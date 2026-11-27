import type View from "sap/ui/core/mvc/View";
import type Controller from "sap/ui/core/mvc/Controller";
import type SearchField from "sap/m/SearchField";
import type ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";

import {
  ValueHelpDialogFactory,
  type ValueHelpConfig,
  type ValueHelpInstance,
} from "./ValueHelpDialogFactory";

export class ValueHelpRegistry {
  private readonly _instances = new Map<string, ValueHelpInstance>();

  constructor(
    private readonly view: View,
    private readonly controller: object,
  ) {}

  async getOrCreate(
    config: ValueHelpConfig,
  ): Promise<ValueHelpInstance> {
    const existingInstance = this._instances.get(config.key);

    if (existingInstance) {
      // The attached handlers now use this opening's configuration.
      existingInstance.config = config;

      return existingInstance;
    }

    const instance = await ValueHelpDialogFactory.create({
      view: this.view,
      controller: this.controller,
      config,
    });

    this._instances.set(config.key, instance);

    return instance;
  }

  async open(
    config: ValueHelpConfig,
  ): Promise<ValueHelpInstance> {
    const instance = await this.getOrCreate(config);
    const dialog = instance.dialog;

    dialog.setTitle(config.title);
    dialog.setKey(config.keyField);
    dialog.setDescriptionKey(config.descriptionField ?? "");
    dialog.setSupportMultiselect(config.supportMultiselect ?? false);
    dialog.setSupportRanges(config.supportRanges ?? false);

    // Update or clear tokens for the current input.
    dialog.setTokens(config.tokens ?? []);

    const oTable = await dialog.getTableAsync();

    const aFilters = config.getFilters
      ? config.getFilters(this.controller as Controller)
      : [];

    const oBinding =
      oTable.getBinding?.("rows") ||
      oTable.getBinding?.("items");

    if (oBinding) {
      oBinding.filter(aFilters, "Application");

      if ("changeParameters" in oBinding) {
        const sSearch =
          instance.basicSearchField.getValue()?.trim() || "";

        oBinding.changeParameters({
          $search: sSearch || undefined,
        });
      }
    }

    dialog.update();
    dialog.open();

    return instance;
  }

  getDialog(key: string): ValueHelpDialog | undefined {
    return this._instances.get(key)?.dialog;
  }

  getBasicSearchField(key: string): SearchField | undefined {
    return this._instances.get(key)?.basicSearchField;
  }

  has(key: string): boolean {
    return this._instances.has(key);
  }

  destroy(key: string): void {
    const instance = this._instances.get(key);

    if (!instance) {
      return;
    }

    instance.dialog.destroy();

    // The search field is normally destroyed with the dialog.
    if (!instance.basicSearchField.isDestroyed()) {
      instance.basicSearchField.destroy();
    }

    this._instances.delete(key);
  }

  destroyAll(): void {
    for (const key of Array.from(this._instances.keys())) {
      this.destroy(key);
    }
  }
}