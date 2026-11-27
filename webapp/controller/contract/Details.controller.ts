import BaseController from "../BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessagePopover from "sap/m/MessagePopover";
import MessageView from "sap/m/MessageView";
import MessageItem from "sap/m/MessageItem";
import Button from "sap/m/Button";
import Bar from "sap/m/Bar";
import Title from "sap/m/Title";
import { Message as ValidationMessage, TextType, BillingPlanItem, Partner } from "../../model/types";
import { createMessageItemTemplate } from "../../utils/messageItemFactory";
import Dialog from "sap/m/Dialog";
import type Input from "sap/m/Input";
import Token from "sap/m/Token";
import MessageBoxHelper from "../../utils/MessageBoxHelper";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import ODataModelV2 from "sap/ui/model/odata/v2/ODataModel";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Popover from "sap/m/Popover";
import Fragment from "sap/ui/core/Fragment";
import DateFormat from "sap/ui/core/format/DateFormat"
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Context from "sap/ui/model/odata/v4/Context";
import type Event from "sap/ui/base/Event";
import { ValueHelpRegistry } from "../../utils/ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../../utils/valueHelpConfigs";
import type { Mode, PricingElement, TabContentConfig, SalesOrderHeader, SalesOrderModelData, SubsequentProcFlowDocItem, SalesOrderText } from "../../model/types";
import formatter from "../../utils/Formatter";
import { addConditionDescriptions } from "../../utils/ConditionText";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import { ODataBatchResponseParser } from "../../utils/ODataBatchResponseParser";
import { MessageDisplayService } from "../../utils/MessageDisplayService";
import { deserializeUi5ODataError, deserializeSapGatewayError, getActionableSapMessages } from "../../utils/ErrorMessageHandler";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import type Table from "sap/m/Table";

export type PricingProcedureResult = {
  SalesOrderType: string;
  SalesOrganization: string;
  DistributionChannel: string;
  Division: string;
  SoldToParty: string;
  CustomerPricingProcedure?: string;
  DocumentPricingProcedure?: string;
  PricingProcedure?: string;
  ProcedureDescription?: string;
  Status?: string;
  Message?: string;
};

type HeaderChanges = {
  Field: string;
  Value: string
}

type JsonObject = Record<string, unknown>;

type ItemChangeSet = {
  salesOrderItem: string;
  itemPatch?: Record<string, unknown>;
  newScheduleLines?: Array<Record<string, unknown>>;
  billingPlanPatches?: Array<Record<string, unknown>>;
  billingPlanItemPatches?: Array<Record<string, unknown>>;
};

type SalesOrderItem = JsonObject & {
  SalesOrderItem: string;
};

type Condition = JsonObject & {
  SalesOrder: string;
  SalesOrderItem: string;
  PricingProcedureStep: string;
  PricingProcedureCounter: string;
  payload: JsonObject
}

type ItemPatch = {
  SalesOrderItem: string;
  payload: JsonObject;
};

type ItemChanges = {
  itemPatches: ItemPatch[];
  newItems: JsonObject[];
};

type ItemPartner = {
  SalesOrder: string;
  SalesOrderItem: string;
  Custome: string;
  PartnerFunction: string;
}

type HeaderText = {
  SalesOrder: string;
  Language: string;
  LongTextID: string;
  payload: JsonObject;
}

type ItemText = {
  SalesOrder: string;
  SalesOrderItem: string;
  Language: string;
  LongTextID: string;
  payload: JsonObject;
}
//type UnwrapValue = | null | undefined | string | number | boolean | UnwrapValue[] | { [key: string]: UnwrapValue | { results?: UnwrapValue[] };

/**
 * @namespace com.eiffage.sdt.controller
 */
export default class Detail extends BaseController {
  public formatter = formatter;
  private messageView!: MessageView;
  private backButton!: Button;
  private closeButton!: Button;
  private bar!: Bar;
  private title!: Title;
  private popover!: MessagePopover;
  private _valueHelpRegistry!: ValueHelpRegistry;
  private mode!: Mode;
  private _addressPopover?: Promise<Popover>;
  private _salesOrder?: String;
  private _conditionDialog?: Promise<Dialog>;
  private _partnerFunctionDialog?: Dialog;
  private _userStatusDialog?: Dialog;
  private _itemPath?: string;
  private readonly partnerSelectionFragmentId = "partnerSelection";
  private readonly userStatusFragmentId = "userStatusSelection";

  private readonly contentByMode: Record<Mode, TabContentConfig[]> = {
    Create: [
      {
        tabId: "genInfo",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.GeneralInformation",
      },
      {
        tabId: "items",
        fragId: "fragItems",
        fragmentName: "com.eiffage.sdt.view.fragment.create.SalesOrderItem",
      },
      {
        tabId: "prices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.PriceElementsTable",
      },
      {
        tabId: "texts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.create.TextTable",
      },
      {
        tabId: "statusandblocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlock",
      }
    ],
    Edit: [
      {
        tabId: "genInfo",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.GeneralInformation",
      },
      {
        tabId: "items",
        fragId: "fragItems",
        fragmentName: "com.eiffage.sdt.view.fragment.create.SalesOrderItem",
      },
      {
        tabId: "prices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.PriceElementsTable",
      },
      {
        tabId: "texts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.create.TextTable",
      }/*,
      {
        tabId: "statusandblocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlock",
      }*/
    ],
    Display: [
      {
        tabId: "genInfo",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.display.GeneralInformation",
      },
      {
        tabId: "items",
        fragId: "fragItems",
        fragmentName: "com.eiffage.sdt.view.fragment.display.SalesOrderItem",
      },
      {
        tabId: "prices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.display.PriceElementsTable",
      },
      {
        tabId: "texts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.display.TextTable",
      }/*,
      {
        tabId: "statusandblocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlock",
      }*/
    ],
  };

  private readonly mMenuActions: Record<string, () => void> = {
    createByItems: () => this.createByItems(),
    createProgressInvoice: () => this.createProgressInvoice(),
    createCreditNote: () => this.createCreditNote()
  };

  public async onInit(): Promise<void> {
    this.getRouter().getRoute("SalesContractDetails")?.attachPatternMatched(this._onPatternMatched, this);

    this.getRouter().getRoute("CreateContract")?.attachPatternMatched(this._onPatternMatched, this);

    //this.mode = this.getModel("viewModel").getProperty("/mode");
    //this.getPage("detailPage").setShowFooter(this.mode === "Create" ? true : false);

    //this.initMessageModel();
    this.initMessageControls();

    // Example message for testing
    this.addMessage({
      type: "Error",
      title: "Save failed",
      description: "Test error message",
      subtitle: "Subtitle",
    });

    this._valueHelpRegistry = new ValueHelpRegistry(this.getView(), this);
    void this._loadTextTypes();
    //await this._loadFragment(this.mode);
  }

  public onExit(): void {
    this.popover?.destroy();
    this.messageView?.destroy();
    this._valueHelpRegistry.destroyAll();
  }

  public async onSave(): void {
    if (!this._preSaveValidation()) {
      //this.popover.openBy(this.getView());
    }

    try {
      this.getView().setBusy(true);

      if (this.mode === "Create") {
        const results = await this._createSalesOrder();

        if (results.SalesOrder) {
          const billingResults = await this._createBillingSchedule(results.SalesOrder);

          MessageBox.success(`Sales Order ${results.SalesOrder} created`, {
            actions: [MessageBox.Action.OK],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
              if (sAction === "OK") {
                this.getRouter().navTo("SalesOrders");
              }
            },
            dependentOn: this.getView()
          });
        } else {
          const messages = ODataBatchResponseParser.getMessages(results);

          if (ODataBatchResponseParser.hasErrors(results)) {
            MessageDisplayService.showAll(messages);
            return;
          }

          MessageDisplayService.showAll(messages);
        }

        //this.getView().setBusy(false);
      } else {

        const [results, statusUpdateResults ]  = await Promise.all([this._updateSalesOrder(), this._updateUserStatus()]);
        const messages = ODataBatchResponseParser.getMessages(results);

        /*if (ODataBatchResponseParser.hasErrors(results)) {
          MessageDisplayService.showAll(messages);
          return;
        }*/

        if (ODataBatchResponseParser.hasSuccess(results)) {
          MessageDisplayService.showSuccess(messages);
          this.onCancel();
          return;
        }

        MessageDisplayService.showAll(messages);

        //essage = JSON.parse(results.__batchResponses[0].__changeResponses[0].headers["sap-message"])
        //this.getRouter().navTo("SalesOrders");
      }
    } catch (error) {
      const oSapError = deserializeUi5ODataError(error);
      const aMessages = getActionableSapMessages(oSapError);
      const sUserMessage = aMessages.map((oMessage) => `[${oMessage.code}] ${oMessage.message}`).join("\n");

      MessageBox.error(sUserMessage || oSapError.error.message);

    } finally {
      this.getView().setBusy(false);
    }
  }

  public onOpenMessages(event: any): void {
    this.popover.toggle(event.getSource());
  }

  public async onSoldToVH(oEvent: Event): Promise<void> {
    //const oInput = this.byId("inSoldTo") as Input;
    const oInput = oEvent.getSource();
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.soldTo,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: async (oEvent: Event, oDialog) => {

        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          //oInput.setValue(oSelectedToken.getText());
          oSalesOrderModel.setProperty("/SoldToParty", oSelectedToken.getKey());

          const fnAfterClose = () => {
            oDialog.detachAfterClose(fnAfterClose);
            void this._getPricingProcedure(oSelectedToken.getKey());
          };

          oDialog.attachAfterClose(fnAfterClose);
          //oDialog.close();
          //await this._getPricingProcedure(oSelectedToken.getKey());
        } //else {
        oDialog.close();
        //}
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });

    dialog.open();
  }
  public async onCustGrpVH(): Promise<void> {
    const oInput = this.byId("inCustGrp") as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.customerGroup,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          //oInput.setValue(oSelectedToken.getText());
          oSalesOrderModel.setProperty(
            "/salesOrderHeader/customerGroup",
            oSelectedToken.getKey(),
          );
          oSalesOrderModel.setProperty(
            "/salesOrderHeader/customerGroupName",
            oSelectedToken.getText(),
          );
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });

    dialog.open();
  }

  public async onEdit(): Promise<void> {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oBaselineModel = structuredClone(oSalesOrderModel.getData());

    this.setModel(oBaselineModel, "baselineModel");
    this.getModel("viewModel").setProperty("/mode", "Edit");
    this.mode = "Edit";
    this.getPage("detailPage").setShowFooter(this.mode === "Edit" ? true : false);

    await this._loadFragment("Edit");
  }

  public async onCancel(): Promise<void> {
    if (this.mode === "Edit") {
      this.getModel("viewModel").setProperty("/mode", "Display");
      this.mode = "Display";
      this.getPage("detailPage").setShowFooter(this.mode === "Display" ? false : true);
      window.history.go(-1);
      await this._loadFragment("Display");
    } else if (this.mode === "Create") {
      window.history.go(-1);
    }
  }

  public onAddItem(event: Event): void {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    let aItems = oSalesOrderModel.getProperty("/to_Item");

    // First item to be added
    if (aItems.length === 0) {

      aItems.push({
        SalesOrder: "",
        SalesOrderItem: "000010",
        Material: "",
        RequestedQuantity: "0",
        NetAmount: "0",
        TransactionCurrency: "",
        WBSElement: "",
        to_PricingElement: []
      });
    }
    else {
      const nIndex = aItems.length - 1;
      const oPrevData = { ...oSalesOrderModel.getProperty(`/to_Item/${nIndex}`) };

      aItems.push({
        SalesOrder: "",
        SalesOrderItem: String((aItems.length + 1) * 10).padStart(6, "0"),
        Material: oPrevData.Material,
        WBSElement: oPrevData.WBSElement,
        RequestedQuantity: oPrevData.RequestedQuantity,
        NetAmount: "0",
        TransactionCurrency: oPrevData.TransactionCurrency,
        SalesOrderItemCategory: oPrevData.SalesOrderItemCategory,
        SalesOrderItemText: oPrevData.SalesOrderItemText,
        RequestedQuantityUnit: oPrevData.RequestedQuantityUnit,
        to_PricingElement: []
      });
    }

    //oSalesOrderModel.refresh();
    oSalesOrderModel.setProperty("/to_Item", aItems);
  }

  public onDeleteItem = async (oEvent: Event): void => {
    const oItemTable = this.byId("fragItems--salesOrderItemTableCreate") as Table;
    const oSelectedItem = oItemTable.getSelectedItem();
    const oI118nModel = this.getResourceBundle();

    if (!oSelectedItem) {
      MessageBox.error(oI118nModel.getText("salesOrderText.table.noItemSelected"));
      return;
    }

    const oSalesOrderModel = this.getView().getModel("salesOrder") as JSONModel;
    const aItem = oSalesOrderModel.getProperty("/to_Item");
    const sPath = oSelectedItem.getBindingContextPath();

    if (this.mode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(this.getView(), "Are you sure you want to delete this text?");

      if (!bConfirmed) {
        return;
      }

      oSalesOrderModel.setProperty(sPath + "/isDeleted", true);

    } else {
      const nIndex = Number(sPath.split("/").pop());
      aItem.splice(nIndex, 1);
      oSalesOrderModel.setProperty("/to_Item", aItem);
    }
  }

  public onAddText(event: Event): void {
    let oSalesOrderModel = this.getModel("salesOrder");
    let aItems = oSalesOrderModel.getProperty("/to_Text");

    aItems.push({
      Language: "FR",
      LongTextID: "",
      LongText: "",
      ...(this.mode !== "Create" ? { isNew: true } : {}),
    });

    oSalesOrderModel.setProperty("/to_Text", aItems);

  }

  public async onItemDelete(event: Event): Promise<void> {
    const sMode = this.getModel("viewModel").getProperty("/mode");

    if (sMode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(
        this.getView(),
        "Are you sure you want to delete this item?",
      );

      if (!bConfirmed) {
        return;
      }
    }

    let oSalesOrderModel = this.getModel("salesOrder");
    let aItem = oSalesOrderModel.getProperty("/to_Item");
    const oList = event.getParameter("listItem");
    const oContext = oList.getBindingContext("salesOrder");
    const sPath = oContext.getPath();
    const nIndex = Number(sPath.split("/").pop());

    aItem.splice(nIndex, 1);
    oSalesOrderModel.refresh();
  }

  public async onTextDelete(event: Event): Promise<void> {
    const oTextTable = this.byId("fragTexts--tableTextCreate");
    const oSelectedItem = oTextTable.getSelectedItem();
    const sMode = this.getModel("viewModel").getProperty("/mode");
    const oI118nModel = this.getResourceBundle();
    let oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    let aItem = oSalesOrderModel.getProperty("/to_Text");
    const sPath = oSelectedItem.getBindingContextPath();

    if (!oSelectedItem) {
      MessageBox.error(oI118nModel.getText("salesOrderText.table.noItemSelected"));
      return;
    }

    if (sMode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(
        this.getView(),
        "Are you sure you want to delete this text?",
      );

      if (!bConfirmed) {
        return;
      }

      oSalesOrderModel.setProperty(sPath + "/isDeleted", true);
    } else {
      const nIndex = Number(sPath.split("/").pop());

      aItem.splice(nIndex, 1);
      oSalesOrderModel.setProperty("/to_Text", aItem);
    }
  }

  public async onProductVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = event.getSource().getParent().getBindingContext("salesOrder").getPath();
    let oItem = oSalesOrderModel.getProperty(sPath);

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.product,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oItem.Material = oObject.Product;
          oItem.RequestedQuantityUnit = oObject.RequestedQuantityUnit;
          oItem.RequestedQuantity = "1";
          oItem.SalesOrderItemText = oObject.ProductName;
        }

        //oSalesOrderModel.refresh();
        oSalesOrderModel.setProperty(sPath, oItem);
        oDialog.close();
        this.simulateSalesOrder(sPath);
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onWBSVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = event.getSource().getParent().getBindingContext("salesOrder").getPath();
    let item = oSalesOrderModel.getProperty(sPath);

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.wbsElement,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          item.WBSElement = oObject.WBSElementExternalID;
        }

        oSalesOrderModel.setProperty(`${sPath}/WBSElement`, oObject.WBSElementExternalID);
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onItemCatVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = event
      .getSource()
      .getParent()
      .getBindingContext("salesOrder")
      .getPath();
    let oItem = oSalesOrderModel.getProperty(sPath);

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.itemCategory,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oItem.SalesOrderItemCategory = oObject.SalesDocumentItemCategory;
        }

        oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onCustMatVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = event
      .getSource()
      .getParent()
      .getBindingContext("salesOrder")
      .getPath();
    let oItem = oSalesOrderModel.getProperty(sPath);

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.itemCategory,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oItem.SalesOrderItemCategory = oObject.SalesDocumentItemCategory;
        }

        oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onSalesOfficeVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesOffice,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oSalesOrderModel.setProperty("/SalesOffice", oSelectedToken.getKey());
        }

        //oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onSalesGroupVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesGroup,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oSalesOrderModel.setProperty("/SalesGroup", oSelectedToken.getKey());
        }

        //oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onSalesDistrictVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesDistrict,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oSalesOrderModel.setProperty("/SalesDistrict", oSelectedToken.getKey());
        }

        //oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onIncotermsVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.incoterms,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oSalesOrderModel.setProperty("/IncotermsVesion", oSelectedToken.getKey());
        }

        //oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public async onLanguageVH(event: Event): Promise<void> {
    const oInput = event.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = event
      .getSource()
      .getParent()
      .getBindingContext("salesOrder")
      .getPath();
    let oItem = oSalesOrderModel.getProperty(sPath);

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.language,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oItem.Language = oObject.Language;
        }

        oSalesOrderModel.refresh();
        oDialog.close();
      },
      /*cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();*
      },*/
    });
  }

  public onItemPress(oEvent: Event): void {
    const item = oEvent.getParameter("listItem");
    const salesOrder = item.getBindingContext("salesOrder")?.getObject();
    const path = item.getBindingContext("salesOrder").getPath();
    const index = parseInt(path.split("/").pop(), 10);

    if (salesOrder) {
      const { SalesOrder, SalesOrderItem } = salesOrder;
      this.getRouter().navTo("SalesOrderItemDetails", {
        //SalesOrder: SalesOrder,
        // SalesOrderItem: SalesOrderItem,
        Index: index
      });
    }
  }

  public onBPAddressDetailPress = async (oEvent: Event): Promise<void> => {
    const oLink = oEvent.getSource() as sap.ui.core.Control;
    const sPath = oEvent.getSource().getBindingContext("salesOrder").getPath();
    const oAddressDetails = this.getModel("salesOrder").getProperty(`${sPath}/to_Address`);
    const oAddressModel = new JSONModel(oAddressDetails);
    const oView = this.getView();

    oView?.setModel(oAddressModel, "address");

    if (!this._addressPopover) {
      this._addressPopover = (await Fragment.load({
        id: oView.getId(),
        name: "com.eiffage.sdt.view.fragment.popover.SoldToAddressDetails",
        controller: this
      })) as Popover;

      oView.addDependent(this._addressPopover);
      //this._addressPopover.bindElement("/ProductCollection/0");
    }

    this._addressPopover.openBy(oLink);
  }

  public onShowMoreDetails = (oEvent: Event): void => {
    let oViewModel = this.getModel("viewModel");
    const sLinkName = oEvent.getSource().getId().split("--").pop();

    if (sLinkName === "linkShipTo") {
      oViewModel.setProperty("/shipToMoreDetails", !oViewModel.getProperty("/shipToMoreDetails"));
    } else if (sLinkName === "linkBillTo") {
      oViewModel.setProperty("/billToMoreDetails", !oViewModel.getProperty("/billToMoreDetails"));
    } else if (sLinkName === "linkPayer") {
      oViewModel.setProperty("/payerMoreDetails", !oViewModel.getProperty("/payerMoreDetails"));
    }
  }


  public onMenuItemSelected = (oEvent: Event): void => {
    const oItem = oEvent.getParameter("item") as sap.m.MenuItem;
    const sKey = oItem.getKey();

    this.mMenuActions[sKey]?.();
  }

  public createProgressInvoice = (): void => {
    this.getRouter().navTo("CreateProgressInvoice", {
      SalesOrder: this._salesOrder
    }, false);
  }

  public createItemInvoice = (): void => {
    this.getRouter().navTo("CreateInvoiceByItem", {
      SalesOrder: this._salesOrder
    }, false);
  }

  public onCreatePricingElement = async (): Promise<void> => {
    const oDialog = await this._getConditionDialog();
    oDialog.open();
  }


  public onConditionTypeValueHelp = async (): Promise<void> => {
    const oInput = this.byId("conditionTypeInput") as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.conditionType,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oInput.setValue(oSelectedToken.getText());
          /*oSalesOrderModel.setProperty(
            "/SalesOrganization",
            oSelectedToken.getKey(),
          );
          oDescriptionModel.setProperty(
            "/salesOrgDescription",
            oSelectedToken.getText(),
          );*/
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onCreateCondition = (): void => {

  }

  public onItemBarSelected = async (oEvent: Event): Promise<void> => {
    const sItemKey = oEvent.getParameter("key") as string;

    if (sItemKey === "prices") {
      //this._getPricingProcedure();
    }

  }

  public onCancelCreateDialog = async (): Promise<void> => {
    const oDialog = await this._getConditionDialog();
    oDialog.close();
  }

  public simulateSalesOrder = async (path: string): Promise<void> => {
    const oSalesOrderModel = this.getModel("salesOrder");

    const to_BillingPlan = {
      SalesOrder: "",
      SalesOrderItem: "",
      BillingPlan: "",
      BillingPlanIsInHeader: false,
      BillingPlanStartDate: "",
      BillingPlanStartDateRule: "",
      ReferenceBillingPlan: "",
      BillingPlanCategory: "",
      BillingPlanType: "",
      BillingPlanEndDate: "",
      BillingPlanEndDateRule: "",
      BillingPlanSearchTerm: "",
      to_BillingPlanItem: []
    }

    try {
      this.getView().setBusy(true);
      const oRawResults = await this._simulateSalesOrder(path);
      const oResults = this._unwrapResults(oRawResults);
      oResults.to_Item[0].to_Partner = oResults.to_Partner;

      const ProductionPlant = oResults.to_Item[0].Plant;
      delete oResults.to_Item[0].Plant;

      //oSalesOrderModel.setProperty("/to_PricingElement", oResults?.to_PricingElement?.results ?? []);
      oSalesOrderModel.setProperty("/to_Partner", oResults?.to_Partner ?? []);
      oSalesOrderModel.setProperty(path, { ...oResults.to_Item[0], ProductionPlant, to_BillingPlan, to_Text: [] });

      //oSalesOrderModel.setProperty("/to_PricingElement", oResults?.to_PricingElement?.results ?? []);

      this._formatConditionTypes(oResults?.to_PricingElement ?? []);
      this.getView().setBusy(false);
    } catch (error) {
      this.getView().setBusy(false);
      const oSapError = deserializeUi5ODataError(error);
      const aMessages = getActionableSapMessages(oSapError);
      const sUserMessage = aMessages.map((oMessage) => `[${oMessage.code}] ${oMessage.message}`).join("\n");

      MessageBox.error(sUserMessage || oSapError.error.message);
      //console.error("Simulation failed", e);
    }
  }

  public onCalendarTypeChange = (oEvent: Event): void => {

    const oViewModel = this.getModel("viewModel");
    const bPerodicCalendar = oViewModel.getProperty("/periodicCalendar");
    const bMilestoneCalendar = oViewModel.getProperty("/milestoneCalendar");

    oViewModel.setProperty("/periodicCalendar", !bPerodicCalendar);
    oViewModel.setProperty("/milestoneCalendar", !bMilestoneCalendar);

  }

  public onCreateAdvanceInvoice = (oEvent: Event): void => {
    this.getRouter().navTo("CreateAdvanceInvoice");
  }

  public onDeletePartner = (oEvent: Event): void => {
    const oSalesOrderModel = this.getView()?.getModel("salesOrder") as JSONModel;
    const oTable = this.byId("partnersTable") as Table;
    const oSelectedItem = oTable.getSelectedItem();
    const aItems = oSalesOrderModel?.getProperty("/to_Partner");
    //const sPath = oSelectedItem.getBindingContext("itemDetail").getPath();

    if (this.mode === "Edit") {
      oSalesOrderModel.setProperty(sPath + "/isDeleted", true);
    } else {
      const nIndex = Number(sPath.split("/").pop());
      aItems.splice(nIndex, 1);
      oSalesOrderModel.setProperty("/to_Partner", aItems);
    }
  }

  public onAddPartner = async (oEvent: Event): Promise<void> => {
    const oDialog = await this._getPartnerFunctionDialog();
    const oSelect = Fragment.byId(this.partnerSelectionFragmentId, "partnerTypeSelect") as Select;
    const oSalesOrderModel = this.getModel("salesOrder");
    const oItemsBinding = oSelect.getBinding("items");

    oItemsBinding.filter([
      new Filter(
        "SalesDocumentType",
        FilterOperator.EQ,
        oSalesOrderModel?.getProperty("/SalesOrderType")
      )
    ]);

    oDialog.open();

  }

  public onCreatePartner = async (): void => {
    const oSelect = Fragment.byId(this.partnerSelectionFragmentId, "partnerTypeSelect") as Select;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const aPartners = oSalesOrderModel?.getProperty("/to_Partner");
    const oDialog = await this._getPartnerFunctionDialog();
    const oSelectedItem = oSelect.getSelectedItem();
    const sKey = oSelect.getSelectedKey();
    const sText = oSelectedItem?.getText();

    const oNewPartner = {
      "PartnerFunction": sKey,
      "Customer": "",
      "Address": "",
      "isNew": true
    };

    aPartners.push(oNewPartner);

    oItemDetailModel.setProperty("/to_Partner", aPartners);
    oDialog.close();
  };

  public onPartnerVH = async (oEvent: Event): Promise<void> => {
    const oInput = oEvent.getSource() as Input;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.soldTo,
      supportMultiselect: false,
      tokens: oInput.getValue()
        ? [
          new Token({
            key: oInput.getValue(),
            text: oInput.getValue(),
          }),
        ]
        : [],
      ok: async (oEvent: Event, oDialog) => {
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oInput.setValue(oObject.Customer);
        }
        oDialog.close();

      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });

    dialog.open();
  }

  public onTextChange = (oEvent: Event): void => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const sPath = oEvent.getSource().getBindingContext("salesOrder").getPath();
    const bNew = oSalesOrderModel.getProperty(sPath).isNew;

    if (!bNew) {
      oSalesOrderModel.setProperty(sPath + "/isChanged", true);
    }
  }

  public onOpenUserStatusDialog = async (): Promise<void> => {
    const oDialog = await this._getUserStatusDialog();
    oDialog.open();
  }

  public onCancelUserStatus = async (): Promise<void> => {
    const oDialog = await this._getUserStatusDialog();
    oDialog.close();
  }

  public onApplyUserStatus = async (): Promise<void> => {
    const oDialog = await this._getUserStatusDialog();
    const oTable = Fragment.byId(this.userStatusFragmentId, "userStatusTable");
    const oSelectedItem = oTable.getSelectedItem();

    if (!oSelectedItem) {
      MessageToast.show("Select a user status.");
      return;
    }

    const oStatus = oSelectedItem.getBindingContext("userStatuses").getObject();
    const oViewModel = this.getModel("viewModel") as JSONModel;

    oViewModel.setProperty("/updateUserStatus", true);
    oDialog.close();
  }

  private _getUserStatusDialog = async (): Promise<Dialog> => {
    if (!this._userStatusDialog) {
      this._userStatusDialog = (await Fragment.load({
        id: this.userStatusFragmentId,
        name: "com.eiffage.sdt.view.fragment.create.UserStatus",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._userStatusDialog);
    }

    return this._userStatusDialog;
  }
  // =========================
  // Private methods / functions
  // =========================

  private _getConditionDialog = async (): Promise<Dialog> => {
    if (!this._conditionDialog) {
      this._conditionDialog = Fragment.load({
        id: this.getView().getId(),
        name: "com.eiffage.sdt.view.fragment.create.ConditionType",
        controller: this
      }).then((oDialog) => {
        const oTypedDialog = oDialog as Dialog;
        this.getView().addDependent(oTypedDialog);
        return oTypedDialog;
      });
    }

    return this._conditionDialog;
  }

  private initMessageControls(): void {
    const messageTemplate: MessageItem = createMessageItemTemplate();

    this.title = new Title({ text: "Messages" });

    this.popover = new MessagePopover({
      items: {
        path: "messageModel>/messages",
        template: messageTemplate,
      },
    });

    this.byId("btnMessages").addDependent(this.popover);
    /* this.messageView.setModel(this.getModel("messageModel") as JSONModel);

    this.backButton = new Button({
      icon: IconPool.getIconURI("nav-back"),
      visible: false,
      press: () => this.onNavigateBack(),
    });

    this.closeButton = new Button({
      text: "Close",
      press: () => this.popover.close(),
    });

    this.bar = new Bar({
      contentLeft: [this.backButton],
      contentMiddle: [this.title],
    });

    this.popover = new MessagePopover({
      customHeader: this.bar,
      contentWidth: "20%",
      contentHeight: "40%",
      modal: true,
      verticalScrolling: false,
      content: [this.messageView],
      endButton: this.closeButton,
      placement: "Auto",
      resizable: true,
    });*/
  }

  private onMessageItemSelect(): void {
    this.backButton.setVisible(true);
    this.title.setText("Message Details");
  }

  private onNavigateBack(): void {
    this.messageView.navigateBack();
    this.backButton.setVisible(false);
    this.title.setText("Messages");
    this.popover.focus();
  }

  // =========================
  // Validation & messages
  // =========================

  private preSaveValidation(): boolean {
    // future validation logic
    return false;
  }

  private addMessage(message: ValidationMessage): void {
    const model = this.getModel("messageModel") as JSONModel;
    const messages = model.getProperty("/messages") as ValidationMessage[];

    messages.push(message);
    model.refresh(true);
  }

  private _getOrderTypeDialog(): Dialog {
    return this.byId("orderTypeSelectionDialog") as Dialog;
  }

  private async _loadTextTypes(): Promise<void> {
    const oODataModel = this.getModel("textTypeVH") as ODataModel;
    const oTextTypesModel = this.getModel("textTypes") as JSONModel;
    const sSalesOrderType = this.getModel("salesOrder")?.getProperty(
      "/SalesOrderType",
    );

    const oListBinding = oODataModel.bindList(
      "/C_SlsDocTypeTxtDetnProcedItmVH",
    );

    oListBinding.filter([
      new Filter(
        "SalesDocumentType",
        FilterOperator.EQ,
        sSalesOrderType || "ZOR0",
      ),
    ]);

    const aContexts = await oListBinding.requestContexts();

    const aTextTypes: TextType[] = aContexts.map((oContext) => {
      const oObject = oContext.getObject() as {
        LongTextID: string;
        LongTextIDText: string;
      };

      return {
        LongTextID: oObject.LongTextID,
        LongTextIDText: oObject.LongTextIDText,
      };
    });

    oTextTypesModel.setProperty("/textTypes", aTextTypes);
  }

  private _loadFragment = async (sMode: Mode): Promise<void> => {
    //const oGenInfoTabFilter = this.byId("genInfo");

    const aFragments = this.contentByMode[sMode] ?? [];

    await Promise.all(
      aFragments.map(async ({ tabId, fragId, fragmentName }) => {
        const tab = this.byId(tabId);
        const content = await this.loadFragment({
          id: this.createId(fragId),
          name: fragmentName,
        });

        tab.destroyContent();
        tab.addContent(content);
      }),
    );
    /*const content = await this.loadFragment({
      id: this.createId("fragGenInfo"),
      name: "com.eiffage.sdt.view.fragment.display.GeneralInformation"
    });

    oGenInfoTabFilter.removeAllContent();
    oGenInfoTabFilter.addContent(content);  */
  };

  private async _onPatternMatched(oEvent: Event): Promise<void> {
    const oViewModel = this.getModel("viewModel");
    const oArgs = oEvent.getParameter("arguments"); //as { salesOrder: string };
    const oQuery = oArgs["?query"];
    const sSalesOrder = oArgs.SalesOrder || "";
    const oModel = this.getModel("salesOrder") as JSONModel;
    const oTrackingModel = this.getModel("trackingData");
    const oUserStatusesModel = this.getModel("userStatuses");
    let modelData = oModel.getData();

    this.mode = this.getModel("viewModel").getProperty("/mode");
    this.getPage("detailPage").setShowFooter(this.mode !== "Display" ? true : false);

    //await this._loadFragment(this.mode);
    const fragMode = oViewModel.getProperty("/detailFragMode");

    if (fragMode !== this.mode) {
      await this._loadFragment(this.mode);
      oViewModel.setProperty("/detailFragMode", this.mode);
    }

    this._salesOrder = sSalesOrder;

    this.getModel("viewModel").setProperty("/salesOrder", sSalesOrder);

    if (this.mode === "Display") {
      if (sSalesOrder == "") return;
      this.getView().setBusy(true);

      /*try {
        const results = await this._isSigned(sSalesOrder);
        oViewModel.setProperty("/isSigned", results.IsOrderSigned.Signed);
      } catch (error) {
        //Add error handling
      }

      try {
        const results = await this._getCalculatedAmounts(sSalesOrder);
        this.getModel("calculatedAmounts").setData(results);
        //oViewModel.setProperty("/isSigned", results.IsOrderSigned.Signed);
      } catch (error) {
        //Add error handling
      }*/

      try {
        const [signedResult, calculatedAmountsResult, userStatusResult, userStatusesResult] = await Promise.all([
          this._isSigned(sSalesOrder),
          this._getCalculatedAmounts(sSalesOrder),
          this._getUserStatus(sSalesOrder),
          this._getUserStatuses(sSalesOrder)
        ]);

        oViewModel.setProperty("/isSigned", signedResult.IsOrderSigned.Signed);
        this.getModel("calculatedAmounts").setData(calculatedAmountsResult);
        oViewModel.setProperty("/userStatusDescription", userStatusResult.GetUserStatus.StatusDescription);
        oUserStatusesModel.setData(userStatusesResult);


      } catch (error) {
        // Handle error
      }

      try {
        const results = await this._getUserStatus(sSalesOrder);
        oViewModel.setProperty("/isSigned", results.IsOrderSigned.Signed);
      } catch (error) {
        //Add error handling
      }

      try {
        const results = await this._getSalesOrder(sSalesOrder);
        const result = this._unwrapResults(results) as SalesOrderModelData;
        //        oModel.setData(result);

        result.to_PricingElement = this._aggregatePricingElements(result.to_Item);
        this._formatConditionTypes(result.to_PricingElement, false, 0);
        result.to_Item.forEach((item: any, index: number) => { this._formatConditionTypes(item.to_PricingElement, true, index) });
        result.to_Partner = await this._enrichHeaderBPData(result.to_Partner);
        oModel.setData(result);

        oTrackingModel.setProperty("/TotalAmount", result.TotalNetAmount);
        this._calculateInvoicedTotal(result.to_Item, result.TotalNetAmount);
      } catch (oError) {
        // handle error
        console.error(oError);
      } finally {
        this.getView().setBusy(false);
      }
    } else if (oQuery?.createFromContract) {
      try {
        this.getView().setBusy(true);
        const contractItemList = this.getModel("contractItemList").getProperty("/items");
        let contractResults = await this._getSalesContract(oQuery.salesContract);
        const filteredItems = contractResults?.to_Item.results.filter((item: any) => contractItemList.includes(item.SalesContractItem));
        contractResults.to_Item.results = filteredItems;
        const results = this._unwrapResults(contractResults) as SalesOrderModelData;
        const result = this._mapContractToSalesOrder(results);
        result.to_PricingElement = this._aggregatePricingElements(result.to_Item);
        this._formatConditionTypes(result.to_PricingElement, false, 0);
        result.to_Item.forEach((item: any, index: number) => { this._formatConditionTypes(item.to_PricingElement, true, index) });
        //Get Address and commm for each BP
        result.to_Partner = await this._enrichHeaderBPData(result.to_Partner);
        //oModel.setProperty("to_Partner", partners)
        oModel.setData(result);


        //oTrackingModel.setProperty("/TotalAmount", result.TotalNetAmount);
        //this._calculateInvoicedTotal(result.to_Item, result.TotalNetAmount);
      } catch (oError) {
        // handle error
        console.error(oError);
      } finally {
        this.getView().setBusy(false);
      }
    }
  }

  private _getSalesOrder = async (sSalesOrder: string): Promise<unknown[]> => {
    const oModel = this.getModel();
    const sPath = `/A_SalesOrder('${sSalesOrder}')`;

    return new Promise((resolve, reject) => {
      oModel.read(sPath, {
        urlParameters: {
          $expand:
            "to_PricingElement,to_BillingPlan,to_Item,to_Item/to_PricingElement,to_Item/to_Text,to_Item/to_BillingPlan/to_BillingPlanItem,to_Item/to_Partner,to_Item/to_PrecedingProcFlowDocItem,to_Item/to_SubsequentProcFlowDocItem,to_Partner/to_Address,to_PricingElement,to_Text,to_SubsequentProcFlowDoc,to_PrecedingProcFlowDoc",
        },
        success: (oData) => resolve(oData),
        error: (oError) => reject(oError)
      });
    });
  }

  private _getSalesContract = async (sSalesOrder: string): Promise<unknown[]> => {
    const oModel = this.getModel("salesContract");
    const sPath = `/A_SalesContract('${sSalesOrder}')`;

    return new Promise((resolve, reject) => {
      oModel.read(sPath, {
        urlParameters: {
          $expand:
            "to_Item,to_Partner,to_PricingElement,to_Text,to_Item/to_Partner,to_Item/to_PricingElement,to_Item/to_Text",
        },
        success: (oData) => resolve(oData),
        error: (oError) => reject(oError)
      });
    });
  }

  private _preSaveValidation = (): boolean => {
    const errorsExist = false;

    return errorsExist;

  }

  private _createSalesOrder = async (): Promise<object> => {
    const oModel = this.getModel();
    const oData = this.getModel("salesOrder").getData();
    const sPath = "/A_SalesOrder";

    let oPayload = {
      ...oData, BillingDocumentDate: this._formatDate(oData.BillingDocumentDate), to_Item: (oData.to_Item || []).map((oLine) => {
        return {
          ...oLine//, 
          //RequestedDeliveryDate: this._formatDate(oLine.RequestedDeliveryDate)
        }
      })
    };

    oPayload.to_PricingElement.forEach((i) => { delete i.to_SalesOrder });
    oPayload.to_Partner.forEach((p) => { delete p.to_SalesOrder; delete p.to_Address; });
    oPayload.to_Item.forEach((a) => a.to_PricingElement.forEach((b) => { delete b.to_SalesOrderItem }));
    //oPayload.to_Item.forEach((a) => a.to_ScheduleLine.forEach((b) => { delete b.to_SalesOrder; delete b.to_SalesOrderItem }));
    oPayload.to_Item.forEach((i) => i.to_Partner.forEach((p) => { delete p.to_SalesOrder; delete p.to_Address }));
    oPayload.to_Item.forEach((i) => delete i.to_ScheduleLine);
    oPayload.to_Item.forEach((i) => delete i.to_BillingPlan);
    delete oPayload.to_BillingPlan;
    delete oPayload.to_PricingElement;

    for (const item of oPayload.to_Item ?? []) {
      if (!Array.isArray(item.to_PricingElement)) continue;

      const filtered: typeof item.to_PricingElement = [];
      for (let cond of item.to_PricingElement) {
        if (cond.ConditionIsManuallyChanged) {
          delete cond.ConditionTypeName;
          filtered.push(cond);
        }
      }
      item.to_PricingElement = filtered;
    }

    const cleanedPayload = {
      ...oPayload,

      to_Partner: oPayload.to_Partner.map(
        ({ __metadata: _partnerMeta, ...partner }) => partner
      ),

      to_Item: oPayload.to_Item.map(
        ({ __metadata: _itemMeta, to_SalesOrder: _toSalesOrder, ...item }) => ({
          ...item,

          to_PricingElement: item.to_PricingElement.map(
            ({ __metadata: _pricingMeta, ...pricingElement }) => pricingElement
          ),

          to_Partner: item.to_Partner.map(
            ({ __metadata: _partnerMeta, ...partner }) => partner
          ),
        })
      ),
    };

    return new Promise((resolve, reject) => {
      oModel.create(sPath, cleanedPayload, {
        success: (oData: object): void => resolve(oData),
        error: (oError: object): void => reject(oError)
      })
    })
  }

  private _formatDate = (date: Date): String => {
    const oFmt = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss.SSS" });
    return oFmt.format(new Date(date));
  }

  private _getPricingProcedure = async (soldTo: string): Promise<void> => {
    let oViewModel = this.getModel("viewModel");

    const oResult = await this._readPricingProcedure(soldTo);

    oViewModel.setProperty("/pricingProcedure", oResult.PricingProcedure);

  }

  private _readPricingProcedure = async (soldTo: string): Promise<PricingProcedureResult> => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const oModel = this.getModel("pricingProcedure") as ODataModel;
    let aFilters = [];


    aFilters.push(new Filter("SalesOrderType", FilterOperator.EQ, oSalesOrderModel.getProperty("/SalesOrderType")));
    aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, oSalesOrderModel.getProperty("/SalesOrganization")));
    aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, oSalesOrderModel.getProperty("/DistributionChannel")));
    aFilters.push(new Filter("Division", FilterOperator.EQ, oSalesOrderModel.getProperty("/OrganizationDivision")));
    aFilters.push(new Filter("SoldToParty", FilterOperator.EQ, soldTo));

    const oBinding = oModel.bindList("/PricingProcedureDetermination", undefined, undefined, aFilters);
    //const oBinding = oModel.bindList("/PricingProcedureDetermination");
    const aContexts = await oBinding.requestContexts(0, 1);
    const oResult = aContexts[0]?.getObject() as PricingProcedureResult;

    return oResult;
  }

  private _simulateSalesOrder = async (path: string): Promise<object> => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oSalesOrderSimulate = this.getModel("salesOrderSimulate") as ODataModelV2;
    const sPath = "/A_SalesOrderSimulation";
    const oData = oSalesOrderModel.getData();
    const itemDetails = { ...oSalesOrderModel.getProperty(path) };
    delete itemDetails.to_BillingPlan;
    delete itemDetails.ProductionPlant;

    //Remove as WBSElement is not available in the Simulation API
    delete itemDetails.WBSElement;

    const oPayload = {
      SalesOrderType: oData.SalesOrderType,
      SalesOrganization: oData.SalesOrganization,
      DistributionChannel: oData.DistributionChannel,
      OrganizationDivision: oData.OrganizationDivision,
      SoldToParty: oData.SoldToParty,
      to_Item: [itemDetails],
      to_Partner: [],
      to_PricingElement: [],
      to_Pricing: {}
    }



    return new Promise((resolve, reject) => {
      oSalesOrderSimulate.create(sPath, oPayload, {
        success: (oResults: any) => {
          resolve(oResults);
        },
        error: (oError: any) => {
          reject(oError);
        }
      });
    });
  }

  private _formatConditionTypes = async (aConditions: PricingElement[], isItem: boolean = false, index: number = 0): Promise<void> => {

    const oSalesOrderModel = this.getModel("salesOrder")
    // Step 1: Build an array of condition types
    const aConditionTypes = [...new Set(aConditions.map((item) => item.ConditionType).filter(Boolean))];

    //Step 2: Build an array of filters based on the array on conditions
    const aSingleFilters = aConditionTypes.map((conditionType) => new Filter({ path: "ConditionType", operator: FilterOperator.EQ, value1: conditionType }));
    const oOrFilter = new Filter(aSingleFilters, false);

    //Step 3: Get Condition configuration and bind to the view
    const oCondfigResult = await this._getConditionTypeConfig(oOrFilter);
    const oConditionModel = new JSONModel(oCondfigResult?.results);
    this.setModel(oConditionModel, "conditionTypeModel");

    await addConditionDescriptions(aConditions, oCondfigResult, navigator.language);

    if (!isItem) {
      oSalesOrderModel.setProperty("/to_PricingElement", aConditions ?? []);
    } else {
      oSalesOrderModel.setProperty(`to_Item[${index}]/to_PricingElement`, aConditions ?? []);
    }
  }

  private _getConditionTypeConfig = async (oFilter: object): Promise<object> => {

    const oConditionModel = this.getModel("conditionTypeConfig");
    const sPath = "/A_SlsPricingConditionType";

    return new Promise((resolve, reject) => {
      oConditionModel.read(sPath, {
        urlParameters: {
          $expand:
            "to_Text",
        },
        filters: [oFilter],
        success: (oData: object): void => resolve(oData),
        error: (oError: object): void => reject(oError)
      })
    })
  }

  private _unwrapResults = (node: unknown): unknown => {
    if (Array.isArray(node)) {
      return node.map((item) => this._unwrapResults(item));
    }

    if (node instanceof Date) {
      return node;
    }

    if (node && typeof node === "object") {
      if ("results" in node && Array.isArray((node as { results?: UnwrapValue[] }).results)) {
        return (node as { results: UnwrapValue[] }).results.map((item) => this._unwrapResults(item));
      }

      const out: { [key: string]: UnwrapValue } = {};
      for (const [key, value] of Object.entries(node)) {
        out[key] = this._unwrapResults(value);
      }
      return out;
    }

    return node;
  }

  private _updateSalesOrder = async (): Promise<object> => {
    const oSalesOrderModel = this.getModel() as ODataModelV2;
    const groupId = "salesOrderUpdateGroup";
    const salesOrder = this.getModel("viewModel").getProperty("/salesOrder");
    const headerChanges = this._getHeaderChanges();
    const itemChanges = this._getItemChanges();
    const { conditionPatches, newConditions } = this._getPricingElementChanges();
    const { itemPartnerPatches, deletedItemPartner, newItemPartner } = this._getItemPartnerChanges();
    const { textPatches, deletedText, newText } = this._getTextChanges(salesOrder);
    const { itemTextPatches, deletedItemText, newItemText } = this._getItemTextChanges();

    itemChanges.newItems.forEach((item: any) => item.to_Partner.forEach((partner: any) => delete partner.to_Address));

    oSalesOrderModel.setDeferredGroups([groupId]);

    if (Object.keys(headerChanges).length > 0) {
      oSalesOrderModel.update(`/A_SalesOrder('${salesOrder}')`, headerChanges, {
        groupId,
        changeSetId: "SalesOrderChanges"
      });
    }

    if (itemChanges.itemPatches.length > 0) {
      itemChanges.itemPatches.forEach((item) => {
        oSalesOrderModel.update(`/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${item.SalesOrderItem}')`, item.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        })
      })
    }

    if (itemChanges.newItems.length > 0) {
      itemChanges.newItems.forEach((item) => {
        oSalesOrderModel.create("/A_SalesOrderItem", item, {
          groupId,
          changeSetId: "SalesOrderChanges"
        })
      })
    }

    if (conditionPatches.length > 0) {
      conditionPatches.forEach((patch) => {
        const sPath =
          `/A_SalesOrderItemPrElement(` +
          `SalesOrder='${salesOrder}',` +
          `SalesOrderItem='${patch.SalesOrderItem}',` +
          `PricingProcedureStep='${patch.PricingProcedureStep}',` +
          `PricingProcedureCounter='${patch.PricingProcedureCounter}'` +
          `)`;

        oSalesOrderModel.update(sPath, patch.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (newConditions.length > 0) {
      newConditions.forEach((condition) => {
        const sPath =
          `/A_SalesOrderItem(` +
          `SalesOrder='${condition.SalesOrder}',` +
          `SalesOrderItem='${condition.SalesOrderItem}'` +
          `)/to_PricingElement`;

        oSalesOrderModel.create(sPath, condition.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };

    if (newItemPartner.length > 0) {
      newItemPartner.forEach((partner) => {
        const sPath = `/A_SalesOrderItem(SalesOrder='${partner.SalesOrder}',SalesOrderItem='${partner.SalesOrderItem}')/to_Partner`;

        oSalesOrderModel.create(sPath, partner.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };

    if (deletedItemPartner.length > 0) {
      deletedItemPartner.forEach((partner) => {
        const sPath = `/A_SalesOrderItemPartner(SalesOrder='${partner.SalesOrder}',SalesOrderItem='${partner.SalesOrderItem}',PartnerFunction='${partner.PartnerFunction}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };

    if (textPatches.length > 0) {
      textPatches.forEach((text) => {
        const sPath = `/A_SalesOrderText(SalesOrder='${text.SalesOrder}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;
        oSalesOrderModel.update(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (newText.length > 0) {
      newText.forEach((text) => {
        const sPath = `/A_SalesOrder('${text.SalesOrder}')/to_Text`;

        oSalesOrderModel.create(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      });
    }

    if (deletedText.length > 0) {
      deletedText.forEach((text) => {
        const sPath = `/A_SalesOrderText(SalesOrder='${text.SalesOrder}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (itemTextPatches.length > 0) {
      itemTextPatches.forEach((text) => {
        const sPath = `/A_SalesOrderItemText(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;
        oSalesOrderModel.update(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (newItemText.length > 0) {
      newItemText.forEach((text) => {
        const sPath = `/A_SalesOrderItem(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}')/to_Text`;

        oSalesOrderModel.create(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      });
    }

    if (deletedItemText.length > 0) {
      deletedItemText.forEach((text) => {
        const sPath = `/A_SalesOrderItemText(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    return new Promise((resolve, reject) => {
      oSalesOrderModel.submitChanges({
        groupId,
        success: (oResponse: object) => resolve(oResponse),
        error: (oError: object) => reject(oError)
      });
    });


  }

  private _getHeaderChanges = (): JsonObject => {
    const oSalesOrderModel = this.getModel("salesOrder").getData();
    const oBaselineModel = this.getView().getModel("baselineModel");
    const patch: JsonObject = {};

    for (const key of Object.keys(oSalesOrderModel)) {
      const newValue = oSalesOrderModel[key];

      if (key === "__metadata") continue;
      if (key.startsWith("to_")) continue;
      if (Array.isArray(newValue)) continue;
      if (newValue !== null && typeof newValue === "object" && !(newValue instanceof Date)) continue;

      const oldValue = oBaselineModel[key];

      const isSame =
        oldValue instanceof Date && newValue instanceof Date
          ? oldValue.getTime() === newValue.getTime()
          : Object.is(oldValue, newValue);

      if (!isSame) {
        patch[key] = newValue;
      }
    }

    return patch;

  }
  private _getItemChanges = (): { itemPatches: ItemPatch[]; newItems: JsonObject[]; } => {
    const oSalesOrderModel = this.getModel("salesOrder").getProperty("/to_Item");
    const oBaselineModel = this.getView().getModel("baselineModel");
    const itemPatches: ItemPatch[] = [];
    const newItems: JsonObject[] = [];

    oSalesOrderModel.forEach((changedItem: SalesOrderItem) => {
      const baselineItem = oBaselineModel.to_Item.find(
        (item) => item.SalesOrderItem === changedItem.SalesOrderItem
      );

      if (!baselineItem) {
        let payload: JsonObject = {
          //SalesOrder: oBaselineModel.SalesOrder
        };

        Object.keys(changedItem).forEach((key) => {
          const newValue = changedItem[key];

          if (key === "__metadata") {
            return;
          }

          if (key === "SalesOrder" || key === "SalesOrderItem") {
            return;
          }

          //if (key.startsWith("to_")) {
          //  return;
          //}

          if (Array.isArray(newValue)) {
            return;
          }

          if (
            typeof newValue === "object" &&
            newValue !== null &&
            !(newValue instanceof Date)
          ) {
            return;
          }

          payload[key] = newValue;
        });

        //payload.to_Item = changedItem.to_item;
        payload = changedItem;
        payload.SalesOrder = oBaselineModel.SalesOrder;

        //Tidy up mess created by the Sales Order Simulation API
        delete payload.__metadata;
        delete payload.to_SalesOrder;
        delete payload.to_BillingPlan;
        delete payload.to_ScheduleLine;
        payload.to_PricingElement.forEach((p) => delete p.__metadata);
        payload.to_Partner.forEach((p) => delete p.__metadata);

        const filtered: typeof payload.to_PricingElement = [];
        for (const cond of payload.to_PricingElement) {
          if (cond.ConditionIsManuallyChanged) {
            filtered.push(cond);
          }
        }
        payload.to_PricingElement = filtered;

        //payload.to_PricingElement = changedItem.to_PricingElement;
        //payload.to_Text = changedItem.to_Text;
        newItems.push(payload);
        return;
      }

      const payload: JsonObject = {};

      Object.keys(changedItem).forEach((key) => {
        const newValue = changedItem[key];

        if (key === "__metadata") {
          return;
        }

        if (key === "SalesOrder" || key === "SalesOrderItem") {
          return;
        }

        if (key.startsWith("to_")) {
          return;
        }

        if (Array.isArray(newValue)) {
          return;
        }

        if (
          typeof newValue === "object" &&
          newValue !== null &&
          !(newValue instanceof Date)
        ) {
          return;
        }

        // If the item does not exist in the baseline, it is a new item,
        // so copy all allowed scalar values into the create payload.
        //if (!baselineItem) {
        //  payload[key] = newValue;
        //  return;
        //}

        const oldValue = baselineItem[key];

        const isSame =
          oldValue instanceof Date && newValue instanceof Date
            ? oldValue.getTime() === newValue.getTime() : Object.is(oldValue, newValue);

        if (!isSame) {
          payload[key] = newValue;
        }
      });

      if (Object.keys(payload).length === 0) {
        return;
      }

      //if (!baselineItem) {
      //  newItems.push({
      //    SalesOrder: oBaselineModel.SalesOrder,
      //    ...payload
      //  });
      //  return;
      //}

      itemPatches.push({
        SalesOrderItem: changedItem.SalesOrderItem,
        payload
      });
    });

    return {
      itemPatches,
      newItems
    };
  };

  private _getPricingElementChanges = (): { conditionPatches: Condition[], newConditions: JsonObject[] } => {
    const oSalesOrderModel = this.getModel("salesOrder").getProperty("/to_Item");
    const oBaselineModel = this.getView().getModel("baselineModel");
    const conditionPatches: Condition[] = [];
    const newConditions: JsonObject[] = [];

    oSalesOrderModel.forEach((item: SalesOrderItem) => {
      const baselineItem = oBaselineModel.to_Item.find((baselineItem: SalesOrderItem) =>
        baselineItem.SalesOrderItem === item.SalesOrderItem
      );

      item.to_PricingElement.forEach((condition: PricingElement) => {

        if (!condition.isNew) {
          const baselineCondition = baselineItem?.to_PricingElement?.find((baselineCondition: PricingElement) =>
            baselineCondition.ConditionType === condition.ConditionType
          );

          if (baselineCondition) {
            if (condition.ConditionRateValue !== baselineCondition.ConditionRateValue) {

              const payload = { "ConditionRateValue": condition.ConditionRateValue };

              conditionPatches.push({
                SalesOrder: condition.SalesOrder,
                SalesOrderItem: condition.SalesOrderItem,
                PricingProcedureCounter: condition.PricingProcedureCounter,
                PricingProcedureStep: condition.PricingProcedureStep,
                payload
              });
            }
          } else {
            if (condition.ConditionType === "") return;
            newConditions.push({
              SalesOrder: condition.SalesOrder,
              SalesOrderItem: condition.SalesOrderItem,
              payload: {
                ConditionType: condition.ConditionType,
                ConditionRateValue: String(condition.ConditionRateValue)
              }
            });
          }
        } else {
          newConditions.push({
            SalesOrder: condition.SalesOrder,
            SalesOrderItem: condition.SalesOrderItem,
            payload: {
              ConditionType: condition.ConditionType,
              ConditionRateValue: String(condition.ConditionRateValue)
            }
          });
        }
      });
    });

    return { conditionPatches, newConditions };
  }

  private _getItemPartnerChanges = (): { itemPartnerPatches: ItemPartner[], deletedItemPartner: ItemPartner[], newItemPartner: JsonObject[] } => {
    const oSalesOrderModel = this.getModel("salesOrder").getProperty("/to_Item") as SalesOrderItem[];
    const oBaselineModel = this.getView().getModel("baselineModel") as { to_Item: SalesOrderItem[] };

    const itemPartnerPatches: ItemPartner[] = [];
    const newItemPartner: JsonObject[] = [];
    const deletedItemPartner: ItemPartner[] = [];

    oSalesOrderModel.forEach((item: SalesOrderItem) => {
      const baselineItem = oBaselineModel.to_Item.find(
        (baselineItem: SalesOrderItem) => baselineItem.SalesOrderItem === item.SalesOrderItem
      );

      const currentPartners = item.to_Partner ?? [];

      currentPartners.forEach((partner: ItemPartner) => {
        // Skip already deleted partners for patch/new logic
        if (!partner.isNew && !partner.isDeleted) {
          const baselinePartner = baselineItem?.to_Partner?.find(
            (bp: ItemPartner) => bp.PartnerFunction === partner.PartnerFunction
          );

          if (baselinePartner) {
            // Existing partner – check for changes
            if (partner.Customer !== baselinePartner.Customer) {
              itemPartnerPatches.push({
                SalesOrder: item.SalesOrder,
                SalesOrderItem: item.SalesOrderItem,
                PartnerFunction: partner.PartnerFunction,
                payload: { Customer: partner.Customer },
              } as unknown as ItemPartner);
            }
          } else {
            // New partner (not in baseline)
            if (partner.PartnerFunction === "") return;

            newItemPartner.push({
              SalesOrder: item.SalesOrder,
              SalesOrderItem: item.SalesOrderItem,
              payload: {
                PartnerFunction: partner.PartnerFunction,
                Customer: partner.Customer,
              },
            });
          }
        }

        // Deleted partners
        if (partner.isDeleted) {
          deletedItemPartner.push({
            SalesOrder: item.SalesOrder,
            SalesOrderItem: item.SalesOrderItem,
            PartnerFunction: partner.PartnerFunction,
          } as unknown as ItemPartner);
        }

        // Explicitly new partners (if you use isNew flag as well)
        if (partner.isNew) {
          newItemPartner.push({
            SalesOrder: item.SalesOrder,
            SalesOrderItem: item.SalesOrderItem,
            payload: {
              PartnerFunction: partner.PartnerFunction,
              Customer: partner.Customer
            }
          });
        }
      });
    });

    return { itemPartnerPatches, newItemPartner, deletedItemPartner };
  };

  private _getTextChanges = (salesOrder: string): { textPatches: HeaderText[], deletedText: HeaderText[], newText: JsonObject[] } => {
    const oSalesOrderModel = this.getModel("salesOrder").getProperty("/to_Text") as SalesOrderText[];
    const textPatches: HeaderText[] = [];
    const newText: JsonObject[] = [];
    const deletedText: HeaderText[] = [];

    oSalesOrderModel.forEach((item: SalesOrderText) => {
      // Deleted texts
      if (item.isDeleted) {
        deletedText.push({
          SalesOrder: salesOrder,
          LongTextID: item.LongTextID,
          Language: item.Language
        } as HeaderText);
      }

      // Explicitly new texts (if you use isNew flag as well)
      if (item.isNew) {
        newText.push({
          SalesOrder: salesOrder,
          payload: {
            LongTextID: item.LongTextID,
            LongText: item.LongText,
            Language: item.Language
          }
        });
      }

      if (item.isChanged) {
        textPatches.push({
          SalesOrder: salesOrder,
          LongTextID: item.LongTextID,
          Language: item.Language,
          payload: {
            LongText: item.LongText
          }
        } as HeaderText);
      }
    });

    return { textPatches, newText, deletedText };
  };

  private _getItemTextChanges = (): { itemTextPatches: ItemText[], deletedItemText: ItemText[], newItemText: JsonObject[] } => {
    const oSalesOrderModel = this.getModel("salesOrder").getProperty("/to_Item") as JSONModel;
    const itemTextPatches: ItemText[] = [];
    const newItemText: JsonObject[] = [];
    const deletedItemText: ItemText[] = [];

    oSalesOrderModel.forEach((item) => {
      item.to_Text.forEach((text) => {
        // Deleted texts
        if (text.isDeleted) {
          deletedItemText.push({
            SalesOrder: text.SalesOrder,
            SalesOrderItem: text.SalesOrderItem,
            LongTextID: text.LongTextID,
            Language: text.Language
          } as ItemText);
        }

        // Explicitly new texts (if you use isNew flag as well)
        if (text.isNew) {
          newItemText.push({
            SalesOrder: text.SalesOrder,
            SalesOrderItem: text.SalesOrderItem,
            payload: {
              LongTextID: text.LongTextID,
              LongText: text.LongText,
              Language: text.Language
            }
          });
        }

        if (text.isChanged) {
          itemTextPatches.push({
            SalesOrder: text.SalesOrder,
            SalesOrderItem: text.SalesOrderItem,
            LongTextID: text.LongTextID,
            Language: text.Language,
            payload: {
              LongText: text.LongText
            }
          } as ItemText);
        }
      });
    })
    return { itemTextPatches, newItemText, deletedItemText };
  };

  private _aggregatePricingElements = (items: SalesOrderItem[]): PricingElement[] => {

    const map = new Map<string, PricingElement>();

    items.forEach((item) => {
      (item.to_PricingElement ?? []).forEach((pe) => {
        const key = [
          pe.PricingProcedureStep,
          pe.PricingProcedureCounter,
          pe.ConditionType,
          pe.TransactionCurrency ?? pe.ConditionCurrency ?? ""
        ].join("|");

        const existing = map.get(key);

        if (existing) {
          existing.ConditionAmount = String(
            Number(existing.ConditionAmount ?? 0) + Number(pe.ConditionAmount ?? 0)
          );
        } else {
          map.set(key, { ...pe });
        }
      });
    });

    return [...map.values()];
  }

  private _calculateInvoicedTotal = async (items: any, totalNetValue: number): Promise<void> => {
    const oTrackingModel = this.getModel("trackingData");
    const oBillingDocModel = this.getModel("billingDocument");
    const aSubDocs = items.to_SubsequentProcFlowDocItem;
    let nTotalInvoiced = 0;
    let nTotalInvoicedPercentage = 0;
    let nBillableAmount = 0;
    let nBillableAmountPercentage = 0;
    //let aFilters = [];

    /*const aFilters = items.forEach((item: any) => {
   
     return  item.to_SubsequentProcFlowDocItem.map((item: SubsequentProcFlowDocItem) => {
       new Filter({
         path: "BillingDocument",
         operator: FilterOperator.EQ,
         value1: item.SubsequentDocument
       })
     })
   })*/

    const aFilters: Filter[] = items.flatMap((item: any) =>
      item.to_SubsequentProcFlowDocItem.map((oDoc: SubsequentProcFlowDocItem) =>
        new Filter({
          path: "BillingDocument",
          operator: FilterOperator.EQ,
          value1: oDoc.SubsequentDocument
        })
      )
    );

    if (aFilters.length === 0) {
      oTrackingModel.setProperty("/BillableAmount", Number(totalNetValue).toFixed(2));
      oTrackingModel.setProperty("/BillableAmountPercentage", 100);
      return;
    };

    const oCombinedFilter = new Filter({
      filters: aFilters,
      and: false
    });

    const oListBinding = oBillingDocModel.bindList("/BillingDocument") as ODataListBinding;

    oListBinding.filter([oCombinedFilter]);

    const aContexts: Context[] = await oListBinding.requestContexts(0, 100);

    aContexts.forEach((context) => {
      const object = context.getObject();

      nTotalInvoiced += Number(object.TotalNetAmount);
    });

    const nNetValue = Number(totalNetValue);
    const nInvoiced = Number(nTotalInvoiced);

    nBillableAmount = nNetValue - nInvoiced;

    oTrackingModel.setProperty("/InvoiceAmount", nTotalInvoiced);
    oTrackingModel.setProperty("/BillableAmount", Number(nBillableAmount));
    //oTrackingModel.setProperty("/InvoiceAmountPercentage", (nTotalInvoiced / totalNetValue) * 100);
    oTrackingModel.setProperty("/InvoiceAmountPercentage", ((nInvoiced / nNetValue) * 100).toFixed(2));
    oTrackingModel.setProperty("/BillableAmountPercentage", ((nBillableAmount / totalNetValue) * 100).toFixed(2));
  }

  private _createBillingSchedule = async (salesOrder: string): Promise<object> => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const oBillingDocModel = this.getModel("billingDoc");
    const oSalesOrder = await this._getSalesOrder(salesOrder);
    const aItems1 = oSalesOrder.to_Item.results;
    const aItems2 = oSalesOrderModel.getProperty("/to_Item");

    const aNewLines = [];

    // 1. Loop over to_Items from payload 1
    for (const oIt1 of aItems1) {
      // 2. Find matching entries in payload 2 by Material + SalesOrderItem
      for (const oIt2 of aItems2) {
        if (oIt1.Material === oIt2.Material) { //&& oIt1.SalesOrderItem === oIt2.SalesOrderItem) {
          const aPlanItems = oIt2.to_BillingPlan?.to_BillingPlanItem || [];

          // 3. For each matching plan item, build a line to create
          for (const oPlan of aPlanItems) {
            aNewLines.push({
              BillingPlanNumber: oIt1.BillingPlan || "", // from payload 1
              DateCategory: "Z1", //oPlan.BillingPlanBillingDate,
              //dateCategory: oPlan.BillingPlanDateCategory,
              BillingPlanType: oPlan.BillingPlanType,
              //plannedValue: oPlan.BillingPlanAmount
              Percentage: "100.00",
              BillingRule: "1",
              BillingBlock: oPlan.BillingBlockReason
            });
          }
        }
      }
    }

    // 4. Build the batch: one deferred group, one changeset per billing plan
    const sGroupId = "billingPlanDates";
    oBillingDocModel.setDeferredGroups([sGroupId]);

    // Optional: group by billing plan so each plan gets its own changeset
    const mLinesByPlan = new Map();
    for (const oLine of aNewLines) {
      if (!mLinesByPlan.has(oLine.BillingPlanNumber)) {
        mLinesByPlan.set(oLine.BillingPlanNumber, []);
      }
      mLinesByPlan.get(oLine.BillingPlanNumber).push(oLine);
    }

    for (const [sFplnr, aLines] of mLinesByPlan.entries()) {
      for (const oLine of aLines) {
        oBillingDocModel.create("/BillingScheduleSet",
          {
            BillingPlanNumber: sFplnr,
            BillingPlanType: oLine.BillingPlanType,
            //BillingPlanDate: "",
            //BillingDate: oLine.billingDate,
            DateCategory: oLine.DateCategory,
            //BillingType: oLine.billingType,
            Percentage: "100.00",
            BillingBlock: oLine.BillingBlock,
            BillingRule: oLine.BillingRule
          },
          {
            groupId: sGroupId,
            changeSetId: "plan-" + sFplnr
          }
        );
      }
    }

    return new Promise((resolve, reject) => {
      oBillingDocModel.submitChanges({
        groupId: sGroupId,
        success: (oData) => { resolve(oData) },
        error: (oError) => { reject(oError) }
      });
    })

  }

  private _mapContractToSalesOrder = (contract: any): any => {
    const oViewModel = this.getModel("viewModel");

    const payload = structuredClone(contract);

    payload.SalesOrder = "";
    payload.SalesOrderType = oViewModel.getProperty("/salesOrderType");
    payload.BillingDocumentDate = new Date();
    payload.PricingDate = new Date();

    delete payload.SalesContract;
    delete payload.SalesContractApprovalReason;
    delete payload.SalesContractDate;
    delete payload.SalesContractType;
    delete payload.SalesContractValidityStartDate;
    delete payload.SalesContractValidityEndDate;
    delete payload.SalesContractValidityPerdUnit;
    delete payload.SalesContractValidityPerdCat;
    delete payload.SalesContractSignedDate;
    delete payload.NmbrOfSalesContractValdtyPerd;
    delete payload.SalesContractFollowUpAction;
    delete payload.SlsContractFollowUpActionDate;
    delete payload.ContractManualCompletion;
    delete payload.OutlineAgreementTargetAmount;
    delete payload.__metadata;

    payload.to_Partner.forEach((partner: any) => {
      Object.assign(partner, {
        SalesOrder: ""
      });
      delete partner.SalesContract;
      delete partner.to_SalesContract;
      delete partner.__metadata;
    });

    payload.to_PricingElement.forEach((price: any) => {
      Object.assign(price, {
        SalesOrder: ""
      });

      delete price.SalesContract;
      delete price.to_SalesContract;
      delete price.__metadata;
    });

    payload.to_Text.forEach((text: any) => {
      Object.assign(text, {
        SalesOrder: "",
      });

      delete text.SalesContract;
      delete text.to_SalesContract;
      delete text.__metadata;
    });

    let nIndex = 0;
    payload.to_Item.forEach((item: any) => {
      nIndex++;
      Object.assign(item, {
        SalesOrder: "",
        SalesOrderItem: String(nIndex * 10).padStart(6, "0"),
        SalesOrderItemCategory: item.SalesContractItemCategory,
        SalesOrderItemText: item.SalesContractItemText,
        to_BillingPlan: {
          BillingPlanStartDate: this._formatDate(new Date()),
          to_BillingPlanItem: [
            {
              SalesOrder: "",
              BillingPlan: "",
              BillingPlanItem: "",
              BillingPlanDateCategory: "",
              BillingPlanBillingDate: this._formatDate(new Date()),
              BillingPlanAmount: item.NetAmount,
              TransactionCurrency: "EUR",
              BillingPlanAmountPercent: "100",
              CustomerPaymentTerms: "",
              ProposedBillingDocumentType: "",
              BillingPlanDateDescriptionCode: "",
              BillingBlockReason: "Z1",
              BillingPlanServiceStartDate: undefined,
              BillingPlanServiceEndDate: undefined,
              BillingPlanRelatedBillgStatus: "",
              BillingPlanType: "",
              AdoptingBillingDateID: "",
              BillingPlanBillingRule: "1",
              BillingPlanMilestoneUsage: "",
              BillgPlnDteCorrectionRfndType: "",
              AccountingExchangeRate: "",
              PostponementReason: "",
            }
          ]
        }
      });

      delete item.SalesContract;
      delete item.SalesContractItem;
      delete item.SalesContractItemCategory;
      delete item.SalesContractItemText;
      delete item.SalesContractValidityStartDate;
      delete item.SalesContractValidityEndDate;
      delete item.NmbrOfSalesContractValdtyPerd;
      delete item.SalesContractValidityPerdUnit;
      delete item.SalesContractValidityPerdCat;
      delete item.SalesContractSignedDate;
      delete item.SalesContractFollowUpAction;
      delete item.SlsContractFollowUpActionDate;
      delete item.SlsContrItemReleasedQuantity;
      delete item.SlsContrItmReldQuantityUnit;
      delete item.OutlineAgreementTargetAmount;
      delete item.ZZ1_R007_NATURE_SDIT;
      delete item.ZZ1_R007_NATURE_SDI;
      delete item.ZZ1_R007_PDCDATE_SDI;
      delete item.to_SalesContract;
      delete item.__metadata;

      item.to_PricingElement.forEach((price: any) => {
        Object.assign(price, {
          SalesOrder: "",
          SalesOrderItem: ""
        });

        delete price.SalesContract;
        delete price.SalesContractItem;
        delete price.to_SalesContract;
        delete price.to_SalesContractItem;
        delete price.__metadata;
      });

      item.to_Partner.forEach((partner: any) => {
        delete partner.__metadata;
      });

      item.to_Text.forEach((text: any) => {
        Object.assign(text, {
          SalesOrder: "",
          SalesOrderItem: ""
        });

        delete text.SalesContract;
        delete text.SalesContractItem;
        delete text.to_SalesContract;
        delete text.to_SalesContractItem;
        delete text.__metadata;
      });
    });

    return payload;
  }

  private _enrichHeaderBPData = async (partner: any): Promise<object[]> => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    //const aPartner = oSalesOrderModel.getProperty("/to_Partner");

    const aAddresses = await this._getBPAddresses(partner)

    const addressMap = new Map(aAddresses.map(addr => [addr.BusinessPartner, addr]));

    partner.forEach((partner: any) => {
      partner.to_Address = addressMap.get(partner.Customer) ?? null;
    });

    //oSalesOrderModel.setProperty("/to_Partner", aPartner);

    return partner;
  }

  private _getBPAddresses = async (partners: any): Promise<object[]> => {
    const bpModel = this.getModel("itemPartners");

    const aFilters = [...new Set(partners.map(p => p.Customer))].map(bp => new Filter("BusinessPartner", FilterOperator.EQ, bp));

    const oFilter = new Filter({
      filters: aFilters,
      and: false
    });

    const oBinding = bpModel.bindList(
      "/I_BusinessPartnerAddress",
      undefined,
      undefined,
      oFilter);
    const aContexts = await oBinding.requestContexts();
    const aAddresses = aContexts.map(ctx => ctx.getObject());

    return aAddresses;
  }

  private _isSigned = async (salesOrder: string): Promise<object> => {
    const oBillingModel = this.getModel("billingDoc");
    const sUrl = "/IsOrderSigned";

    return new Promise((resolve, reject) => {
      oBillingModel.callFunction(sUrl, {
        urlParameters: {
          SalesOrder: salesOrder
        },
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error)
      });
    });
  }

  private _getCalculatedAmounts = async (salesOrder: string): Promise<object> => {
    const oBillingModel = this.getModel("billingDoc");
    const sUrl = `/CalculateAmountsSet(SalesOrder='${salesOrder}')`;

    return new Promise((resolve, reject) => {
      oBillingModel.read(sUrl, {
        urlParameters: {
          $expand: "itemAmounts"
        },
        success: (response: object) => resolve(response),
        error: (error: object) => { reject(error) }
      });
    });
  }

  private _getPartnerFunctionDialog = async (): Promise<Dialog> => {
    if (!this._partnerFunctionDialog) {
      this._partnerFunctionDialog = (await Fragment.load({
        id: this.partnerSelectionFragmentId,
        name: "com.eiffage.sdt.view.fragment.create.ItemPartnerTypeSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._partnerFunctionDialog);
    }

    return this._partnerFunctionDialog;
  }

  private _getUserStatus = async (salesOrder: string): Promise<object> => {
    const oBillingModel = this.getModel("billingDoc");
    const sUrl = "/GetUserStatus";

    return new Promise((resolve, reject) => {
      oBillingModel.callFunction(sUrl, {
        urlParameters: {
          SalesOrder: salesOrder
        },
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error)
      });
    });
  }

  private _getUserStatuses = async (salesOrder: string): Promise<object> => {
    const oBillingModel = this.getModel("billingDoc") as ODataModelV2;
    const sUrl = "/SalesOrderUserStatusSet";
    const oFilter = new Filter("SalesOrder", FilterOperator.EQ, salesOrder);

    return new Promise((resolve, reject) => {
      oBillingModel.read(sUrl, {
        filters: [oFilter],
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error)
      });
    });

  }

  private _updateUserStatus = async (): Promise<object> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oUserStatusesModel = this.getModel("userStatuses") as JSONModel;
    const aStatuses = oUserStatusesModel.getProperty("/results");
    const oBillingModel = this.getModel("billingDoc") as ODataModelV2;
    const salesOrder = oViewModel.getProperty("/salesOrder");
    const sUrl = `/SalesOrderUserStatusSet('${salesOrder}')`;
    const aStatus = aStatuses.find((status) => status.CurrentStatus);
    const payload = { "Status": aStatus.Status };

    oBillingModel.sDefaultUpdateMethod = "PUT";

    return new Promise((resolve, reject) => {
      oBillingModel.update(sUrl, payload, {
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error)
      });
    })
  }
}