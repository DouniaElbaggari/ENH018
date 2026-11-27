import Fragment from "sap/ui/core/Fragment";
import SearchField from "sap/m/SearchField";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import Column from "sap/ui/table/Column";
import MColumn from "sap/m/Column";
import Label from "sap/m/Label";
import Text from "sap/m/Text";
import ColumnListItem from "sap/m/ColumnListItem";

import type View from "sap/ui/core/mvc/View";
import type Token from "sap/m/Token";
import type Event from "sap/ui/base/Event";
import type Filter from "sap/ui/model/Filter";
import type Controller from "sap/ui/core/mvc/Controller";

export type ValueHelpColumnConfig = {
  label: string;
  textBinding: string;
};

export type ValueHelpConfig = {
  key: string;
  title: string;
  fragmentName: string;
  modelName: string;
  tablePath: string;
  keyField: string;
  descriptionField?: string;
  supportMultiselect?: boolean;
  supportRanges?: boolean;
  tokens?: Token[];
  columns: ValueHelpColumnConfig[];

  ok?: (event: Event, dialog: ValueHelpDialog) => void;

  cancel?: (event: Event, dialog: ValueHelpDialog) => void;

  getFilters?: (controller: Controller) => Filter[];

  search?: (
    event: Event,
    dialog: ValueHelpDialog,
    filterBar: FilterBar,
    basicSearchField: SearchField,
    controller: Controller,
  ) => Promise<void> | void;
};

export type ValueHelpInstance = {
  dialog: ValueHelpDialog;
  basicSearchField: SearchField;
  filterBar: FilterBar;

  // Updated by the registry for each opening.
  config: ValueHelpConfig;
};

export type CreateValueHelpDialogParams = {
  view: View;
  controller: object;
  config: ValueHelpConfig;
};

export class ValueHelpDialogFactory {
  static async create(
    params: CreateValueHelpDialogParams,
  ): Promise<ValueHelpInstance> {
    const { view, controller, config } = params;

    const basicSearchField = new SearchField({
      width: "100%",
      placeholder: "Search",
    });

    const dialog = (await Fragment.load({
      id: view.getId(),
      name: config.fragmentName,
      controller,
    })) as ValueHelpDialog;

    dialog.setTitle(config.title);
    dialog.setKey(config.keyField);
    dialog.setDescriptionKey(config.descriptionField ?? "");
    dialog.setSupportMultiselect(config.supportMultiselect ?? false);
    dialog.setSupportRanges(config.supportRanges ?? false);

    const filterBar = dialog.getFilterBar() as FilterBar;

    const instance: ValueHelpInstance = {
      dialog,
      basicSearchField,
      filterBar,
      config,
    };

    // Attach once; read the latest configuration when OK is pressed.
    dialog.attachOk((event) => {
      const currentConfig = instance.config;

      if (currentConfig.ok) {
        currentConfig.ok(event, dialog);
      } else {
        dialog.close();
      }
    });

    dialog.attachCancel((event) => {
      instance.config.cancel?.(event, dialog);
      dialog.close();
    });

    filterBar.addContent(basicSearchField);

    basicSearchField.attachSearch(() => {
      filterBar.search();
    });

    filterBar.attachSearch(async (event) => {
      const currentConfig = instance.config;

      if (currentConfig.search) {
        await currentConfig.search(
          event,
          dialog,
          filterBar,
          basicSearchField,
          controller as Controller,
        );

        return;
      }

      const aFilters = currentConfig.getFilters
        ? currentConfig.getFilters(controller as Controller)
        : [];

      await ValueHelpDialogFactory.applyDefaultSearch(
        dialog,
        basicSearchField,
        aFilters,
      );
    });

    view.addDependent(dialog);
    dialog.setModel(view.getModel(config.modelName), config.modelName);

    const table = await dialog.getTableAsync();

    if ("bindRows" in table) {
      config.columns.forEach((columnConfig) => {
        table.addColumn(
          new Column({
            label: new Label({
              text: columnConfig.label,
            }),
            template: new Text({
              text: columnConfig.textBinding,
            }),
          }),
        );
      });

      table.bindRows({
        path: config.tablePath,
      });
    } else {
      config.columns.forEach((columnConfig) => {
        table.addColumn(
          new MColumn({
            header: new Label({
              text: columnConfig.label,
            }),
          }),
        );
      });

      table.bindItems({
        path: config.tablePath,
        template: new ColumnListItem({
          cells: config.columns.map(
            (columnConfig) =>
              new Text({
                text: columnConfig.textBinding,
              }),
          ),
        }),
      });
    }

    dialog.update();

    return instance;
  }

  private static async applyDefaultSearch(
    dialog: ValueHelpDialog,
    basicSearchField: SearchField,
    aFilters: Filter[],
  ): Promise<void> {
    const sSearch = basicSearchField.getValue()?.trim() || "";
    const oTable = await dialog.getTableAsync();

    const oBinding =
      oTable.getBinding?.("rows") ||
      oTable.getBinding?.("items");

    if (!oBinding) {
      return;
    }

    oBinding.filter(aFilters, "Application");

    if ("changeParameters" in oBinding) {
      oBinding.changeParameters({
        $search: sSearch || undefined,
      });
    }

    dialog.update();
  }
}