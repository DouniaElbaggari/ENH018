import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessagePopover from "sap/m/MessagePopover";
import MessageView from "sap/m/MessageView";
import MessageItem from "sap/m/MessageItem";
import Button from "sap/m/Button";
import Bar from "sap/m/Bar";
import Title from "sap/m/Title";
import { Message as ValidationMessage, TextType, BillingPlanItem, Partner } from "../model/types";
import { createMessageItemTemplate } from "../utils/messageItemFactory";
import Dialog from "sap/m/Dialog";
import type Input from "sap/m/Input";
import Token from "sap/m/Token";
import MessageBoxHelper from "../utils/MessageBoxHelper";
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
import { ValueHelpRegistry } from "../utils/ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../utils/valueHelpConfigs";
import type { Mode, PricingElement, TabContentConfig, SalesOrderHeader, SalesOrderModelData, SubsequentProcFlowDocItem, SalesOrderText } from "../model/types";
import formatter from "../utils/Formatter";
import { addConditionDescriptions } from "../utils/ConditionText";
import MessageBox from "sap/m/MessageBox";
import MessageToast from "sap/m/MessageToast";
import { ODataBatchResponseParser } from "../utils/ODataBatchResponseParser";
import { MessageDisplayService } from "../utils/MessageDisplayService";
import { deserializeUi5ODataError, deserializeSapGatewayError, getActionableSapMessages } from "../utils/ErrorMessageHandler";
import type ResourceModel from "sap/ui/model/resource/ResourceModel";
import type Table from "sap/m/Table";
import DatePicker from "sap/m/DatePicker";
import ComponentContainer from "sap/ui/core/ComponentContainer";
import type { $ComponentSettings } from "sap/ui/core/Component";
import type IconTabBar from "sap/m/IconTabBar";
import type IconTabFilter from "sap/m/IconTabFilter";

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

interface AttachmentComponentSettings extends $ComponentSettings {
  mode: "C" | "D";
  objectType: string;
  objectKey: string;
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
  private _oMessagePopover!: MessagePopover;
  private readonly partnerSelectionFragmentId = "partnerSelection";
  private readonly userStatusFragmentIdEdit = "userStatusSelectionEdit";
  private readonly userStatusFragmentId = "userStatusSelection";

  private _isLoaded: boolean = false;

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

  public async onInit(): void {
    this.getRouter().getRoute("SalesOrderDetails")?.attachPatternMatched(this._onPatternMatched, this);
    this.getRouter().getRoute("Create")?.attachPatternMatched(this._onPatternMatched, this);
    this._initMessageControls();
    this._valueHelpRegistry = new ValueHelpRegistry(this.getView(), this);
    void this._loadTextTypes();
  }

  public onExit(): void {
    this.popover?.destroy();
    this.messageView?.destroy();
    this._valueHelpRegistry.destroyAll();
  }

  public async onSave(): void {
    const oMessageModel = this.getView().getModel("appMessages") as JSONModel;
    oMessageModel.setProperty("/messages", []);

    if (this._preSaveValidation()) {
      //this.popover.openBy(this.getView());
      return;
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
      } else {
        const results = await this._updateSalesOrder();
        const messages = ODataBatchResponseParser.getMessages(results);
        if (ODataBatchResponseParser.hasSuccess(results)) {
          MessageDisplayService.showSuccess(messages);
          this.onCancel();
          return;
        }


        MessageDisplayService.showAll(messages, true, () => {
          this.getRouter().navTo("SalesOrders");
        });
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
    this._oMessagePopover.toggle(event.getSource());
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
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oBaselineModel = structuredClone(oSalesOrderModel.getData());

    this._userStatusDialog = undefined;
    oViewModel.setProperty("/detailFragMode", undefined);
    oViewModel.setProperty("/itemFragMode", undefined);

    this.setModel(oBaselineModel, "baselineModel");
    oViewModel.setProperty("/mode", "Edit");
    this.mode = "Edit";
    this.getPage("detailPage").setShowFooter(this.mode === "Edit" ? true : false);

    await this._loadFragment("Edit");
  }

  public async onCancel(): Promise<void> {
    const oViewModel = this.getModel("viewModel") as JSONModel;
 
    this._isLoaded = false;
   
    if (this.mode === "Edit") {
      oViewModel.setProperty("/mode", "Display");
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
      oSalesOrderModel.setProperty("/to_Item", aItems);
    }
    else {
      let nIndex = aItems.length - 1;
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
        to_PricingElement: [],
        ...(this.mode === "Edit" ? { isNew: true } : {})
      });

      oSalesOrderModel.setProperty("/to_Item", aItems);
      this.simulateSalesOrder(`/to_Item/${aItems.length - 1}`);
    }

    //oSalesOrderModel.refresh();
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
    const data = oSalesOrderModel.getProperty(sPath);
    const { SalesOrder, SalesOrderItem } = data;

    if (this.mode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(this.getView(), "Are you sure you want to delete this item?");

      if (!bConfirmed) {
        return;
      }

      const response = await this._getItemSubDocs(SalesOrder, SalesOrderItem);

      if (response.to_SubsequentProcFlowDocItem.results.length > 0) {
        MessageBox.error(oI118nModel.getText("salesOrderItem.table.cannotDeleteItem"));
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
      ...(this.mode === "Edit" ? { isNew: true } : {}),
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
    const bIsNew = oSalesOrderModel.getProperty(path)?.isNew;

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
      oSalesOrderModel.setProperty(path, { ...oResults.to_Item[0], ProductionPlant, to_BillingPlan, to_Text: [], isNew: bIsNew });

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
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = oEvent.getSource().getBindingContext("salesOrder").getPath();
    const bNew = oSalesOrderModel.getProperty(sPath).isNew;

    if (bNew !== undefined) {
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
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sNetAmount = oSalesOrderModel.getProperty("/TotalNetAmount");
    const oDialog = await this._getUserStatusDialog();
    const oTable = Fragment.byId( this.userStatusFragmentId,"userStatusEdit--userStatusTable") as Table;
    const oSelectedItem = oTable.getSelectedItem();

    if (!oSelectedItem) {
      MessageToast.show("Select a user status.");
      return;
    }

    const oStatus = oSelectedItem.getBindingContext("userStatuses").getObject();

    if (oStatus.Status === "E0002" && Number(sNetAmount) <= 0.00) {
      MessageBox.error("The document cannot be saved with user status “Signed” because mandatory information is missing  (for example: pricing information, analytical assignment). Please complete the missing data and try again.");
      const oItem = oTable.getItems().find((oItem) => oItem.getBindingContext("userStatuses")?.getProperty("Status") === "E0001");

      if (oItem) {
        oTable.setSelectedItem(oItem, true);
      }
      return;
    }

    //const oViewModel = this.getModel("viewModel") as JSONModel;

    //oViewModel.setProperty("/updateUserStatus", true);
    oDialog.close();

    const response = this._updateUserStatus();

    if (oStatus.Status === "E0002") {
      oViewModel.setProperty("/isSigned", true);
      oViewModel.setProperty("/userStatusDescription", "Signed");
    }

    MessageBox.success("User Status upated");
    oViewModel.setProperty("/userStatusEditing", false);

  }


  public onSoldToSuggest = (oEvent: Event) => {
    const sValue = oEvent.getParameter("suggestValue");
    const oBinding = oEvent.getSource().getBinding("suggestionItems");

    if (oBinding.isSuspended()) {
      oBinding.resume();
    }

    const oFilter = new Filter({
      filters: [
        new Filter("Customer", FilterOperator.Contains, sValue),
        new Filter("CustomerName", FilterOperator.Contains, sValue)
      ],
      and: false
    });

    oBinding.filter([oFilter]);
  }

  public onProductSuggest = (oEvent: Event) => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const sValue = oEvent.getParameter("suggestValue");
    const oBinding = oEvent.getSource().getBinding("suggestionItems");

    if (oBinding.isSuspended()) {
      oBinding.resume();
    }

    const oFilter = new Filter({
      filters: [
        new Filter(
          "SalesOrganization",
          FilterOperator.EQ,
          oSalesOrderModel.getProperty("/SalesOrganization")
        ),
        new Filter(
          "DistributionChannel",
          FilterOperator.EQ,
          oSalesOrderModel.getProperty("/DistributionChannel")
        ),
        new Filter({
          filters: [
            new Filter("Product", FilterOperator.Contains, sValue),
            new Filter("ProductName", FilterOperator.Contains, sValue)
          ],
          and: false
        })
      ],
      and: true
    });

    oBinding.filter([oFilter]);
  }

  public onWBSSuggest = (oEvent: Event) => {
    const sValue = oEvent.getParameter("suggestValue");
    const oBinding = oEvent.getSource().getBinding("suggestionItems");

    if (oBinding.isSuspended()) {
      oBinding.resume();
    }

    const oFilter = new Filter({
      filters: [
        new Filter("WBSElementExternalID", FilterOperator.Contains, sValue),
        new Filter("WBSDescription", FilterOperator.Contains, sValue)
      ],
      and: false
    });

    oBinding.filter([oFilter]);
  }

  public onProductSelected = (oEvent: Event): void => {
    const oSource = oEvent.getSource();
    const sPath = oSource.getBindingContext("salesOrder").sPath;

    this.simulateSalesOrder(sPath);
  }

  public onDeclareCreance = async (): Promise<void> => {
    const oCrossAppNav = await sap.ushell.Container.getService("CrossApplicationNavigation");
    const sSalesOrder = this.getModel('salesOrder').getProperty("/SalesOrder");

    oCrossAppNav.toExternal({
      target: {
        semanticObject: "ZDeclarationCreance",
        action: "manage"
      },
      params: {
        Vbeln: sSalesOrder,
        Mode: 'SO'
      }
    }, this.getOwnerComponent());
  }

  public onOpenAttachments = async (): void => {
    if (this._attachmentsLoading) {
      return;
    }

    const sObjectType = "BUS2032";
    const sObjectKey = String(this.getModel("salesOrder").getProperty("/SalesOrder")).padStart(10, "0");
    //const sObjectKey = "NGARDINER" + new Date().toISOString();


    this._attachmentsLoading = true;

    let oComponent;
    let oContainer;
    let oDialog;

    sap.ui.loader.config({
      paths: {
        "sap/se/mi/plm/lib/attachmentservice":
          "/sap/bc/ui5_ui5/sap/plm_ath_cres1/",

        "sap/s4h/cfnd/featuretoggle":
          "/sap/bc/ui5_ui5/sap/featuretoggles1/"
      }
    });

    try {
      oComponent = await this.getOwnerComponent().createComponent({
        usage: "attachmentReuseComponent",
        settings: {
          mode: "C",
          objectType: sObjectType,
          objectKey: sObjectKey
        } as $ComponentSettings & {
          mode: "C" | "D";
          objectType: string;
          objectKey: string;
        }
      });

      oContainer = new ComponentContainer({
        width: "100%",
        component: oComponent
      });

      oDialog = new Dialog({
        title: "Attachments",
        contentWidth: "75rem",
        contentHeight: "35rem",
        resizable: true,
        draggable: true,
        stretchOnPhone: true,

        content: [
          oContainer
        ],

        endButton: new Button({
          text: "Close",
          press: function () {
            oDialog.close();
          }
        }),

        afterClose: function () {
          oDialog.destroy();
          oComponent.destroy();
        }
      });

      this.getView().addDependent(oDialog);
      oDialog.open();
    } catch (oError) {
      if (oDialog) {
        oDialog.destroy();
      } else if (oContainer) {
        oContainer.destroy();
      }

      if (oComponent) {
        oComponent.destroy();
      }

      MessageBox.error(
        oError.message || "Could not open attachments."
      );
    } finally {
      this._attachmentsLoading = false;
    }
  }
  public onRetentionChange = (oEvent: Event): void => {
    const sId = oEvent.getSource().getId().split("--").pop();
    const nNewValue = oEvent.getParameter("newValue");
    const nLength = nNewValue?.length;

    let sTargetId: string;

    switch (sId) {
      case "inPerc1":
        sTargetId = "inAmount1";
        break;

      case "inPerc2":
        sTargetId = "inAmount2";
        break;

      case "inPerc3":
        sTargetId = "inAmount3";
        break;

      case "inAmount1":
        sTargetId = "inPerc1";
        break;

      case "inAmount2":
        sTargetId = "inPerc2";
        break;

      case "inAmount3":
        sTargetId = "inPerc3";
        break;

      default:
        return;
    }

    const oInput = this.byId(sTargetId) as Input;

    if (nLength > 0) {
      oInput.setEnabled(false);
      oInput.setValue("");
    } else if (nLength === 0) {
      oInput.setEnabled(true);
    }

  }

  public onItemQtyChange = async (oEvent: Event) => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const sPath = oEvent.getSource().getBindingContext("salesOrder").sPath;
    let aItems = oSalesOrderModel.getProperty(sPath);
    let aPricingElement = aItems.to_PricingElement;
    let oPr00 = aPricingElement.find((cond) => cond.ConditionType === "PR00");

    this.getView()?.setBusy(true);

    try {
      const results = await this._getUpdatedPricing(sPath);
      const conditions = this._dedupedConditions(results.to_Item.results[0].to_PricingElement.results);
      oSalesOrderModel.setProperty(sPath + "/to_PricingElement", conditions);

      const condition = conditions.find((item) => item.ConditionType === "PR00");

      if (condition.ConditionInactiveReason === "") {
        const taxCondition = conditions.find((item) => item.ConditionType === "TTX1");
        oSalesOrderModel.setProperty(sPath + "/NetAmount", condition.ConditionAmount);
        oSalesOrderModel.setProperty(sPath + "/TaxAmount", taxCondition.ConditionAmount);
      } else {
        const feeCondition = conditions.find((item) => item.ConditionType === "ZFAL");
        const taxDedCondition = conditions.find((item) => item.ConditionType === "ZWST");
        oSalesOrderModel.setProperty(sPath + "/NetAmount", feeCondition.ConditionAmount);
        oSalesOrderModel.setProperty(sPath + "/TaxAmount", taxDedCondition.ConditionAmount);
      }
    } catch (error) {

    } finally {
      this.getView()?.setBusy(false);
    }
  }

  public onEditUserStatus = (oEvent: Event): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;

    oViewModel.setProperty("/userStatusEditing", true);
  }

  public onCancelUserStatusEdit = (oEvent: Event) => {
    const oViewModel = this.getModel("viewModel") as JSONModel;

    oViewModel.setProperty("/userStatusEditing", false);
  }

  public onCloseUserStatus = (): void => {
    this._userStatusDialog?.close();
  }

  // =========================
  // Private methods / functions
  // =========================

  private _getUserStatusDialog = async (): Promise<Dialog> => {
    if (!this._userStatusDialog) {
      this._userStatusDialog = (await Fragment.load({
        id: this.userStatusFragmentId,
        name: "com.eiffage.sdt.view.fragment.UserStatus",
        controller: this,
      })) as Dialog;

      this._userStatusDialog.attachAfterClose(() => {
        this._userStatusDialog?.destroy();
        this._userStatusDialog = undefined;
      });


      this.getView().addDependent(this._userStatusDialog);
    }

    return this._userStatusDialog;
  }
  

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

  private _initMessageControls(): void {
    this._oMessagePopover = new MessagePopover({
      items: {
        path: "appMessages>/messages",
        template: new MessageItem({
          type: "{appMessages>type}",
          title: "{appMessages>title}",
          description: "{appMessages>description}",
          subtitle: "{appMessages>subtitle}",
          counter: 0
        })
      }
    });

    this.byId("btnMessages").addDependent(this._oMessagePopover);
    this.getView().setModel(new JSONModel({ messages: [] }), "appMessages");

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

  private _addMessage(message: ValidationMessage): void {
    const model = this.getView().getModel("appMessages") as JSONModel;
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

    const aFragments = this.contentByMode[sMode] ?? [];

    await Promise.all(
      aFragments.map(async ({ tabId, fragId, fragmentName }) => {
        const tab = this.byId(tabId) as IconTabFilter;
        const content = await this.loadFragment({
          id: this.createId(fragId),
          name: fragmentName,
        });

        tab.destroyContent();
        tab.addContent(content);
      }),
    );
  };

  private async _onPatternMatched(oEvent: Event): Promise<void> {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oArgs = oEvent.getParameter("arguments"); //as { salesOrder: string };
    const oQuery = oArgs["?query"];
    const sSalesOrder = oArgs.SalesOrder || "";
    const oModel = this.getModel("salesOrder") as JSONModel;
    const oTrackingModel = this.getModel("trackingData") as JSONModel;
    const oUserStatusesModel = this.getModel("userStatuses");
    let modelData = oModel.getData();

    this.mode = this.getModel("viewModel").getProperty("/mode");
    this.getPage("detailPage").setShowFooter(this.mode !== "Display" ? true : false);

    if(this.mode === "Create") {
      oSalesOrderModel.setProperty("/BillingDocumentDate", new Date());
    }

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

      try {
        const results = await this._getSalesOrder(sSalesOrder);
        const result = this._unwrapResults(results) as SalesOrderModelData;

        result.to_PricingElement = this._aggregatePricingElements(result.to_Item);
        this._formatConditionTypes(result.to_PricingElement, false, 0);
        result.to_Item.forEach((item: any, index: number) => { this._formatConditionTypes(item.to_PricingElement, true, index) });
        result.to_Partner = await this._enrichHeaderBPData(result.to_Partner);
        const oTaxAmount = result.to_PricingElement.find((cond) => cond.ConditionType === 'TTX1');

        result.TaxAmount = oTaxAmount.ConditionAmount;
        oModel.setData(result);

        oTrackingModel.setProperty("/TotalAmount", result.TotalNetAmount);
        this._calculateInvoicedTotal(result.to_Item, result.TotalNetAmount);
      } catch (oError) {
        // handle error
        console.error(oError);
      } finally {
        this.getView().setBusy(false);
      }

      try {
        const [signedResult, calculatedAmountsResult, userStatusResult, userStatusesResult, companyCode] = await Promise.all([
          this._isSigned(sSalesOrder),
          this._getCalculatedAmounts(sSalesOrder),
          this._getUserStatus(sSalesOrder),
          this._getUserStatuses(sSalesOrder),
          this._getCompanyCode()
        ]);

        oViewModel.setProperty("/isSigned", signedResult.IsOrderSigned.Signed);
        this.getModel("calculatedAmounts").setData(calculatedAmountsResult);
        oViewModel.setProperty("/userStatusDescription", userStatusResult.GetUserStatus.StatusDescription);
        oUserStatusesModel.setData(userStatusesResult);

        if (companyCode.Country === "BE") {
          oViewModel.setProperty("/isBelgium", true);
        } else {
          oViewModel.setProperty("/isBelgium", false);
        }


      } catch (error) {
        console.error(error);
      }
    } else if (oQuery?.createFromContract && !this._isLoaded) {
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

        this._isLoaded = true;


        //oTrackingModel.setProperty("/TotalAmount", result.TotalNetAmount);
        //this._calculateInvoicedTotal(result.to_Item, result.TotalNetAmount);
      } catch (oError) {
        // handle error
        console.error(oError);
      } finally {
        this.getView().setBusy(false);
      }
    } else if (oQuery?.createFromSalesOrder && !this._isLoaded) {
      try {
        this.getView()?.setBusy(true);
        const results = await this._getSalesOrder(oQuery?.salesOrder);
        let result = this._unwrapResults(results) as SalesOrderModelData;

        result.to_PricingElement = this._aggregatePricingElements(result.to_Item);
        this._formatConditionTypes(result.to_PricingElement, false, 0);
        result.to_Item.forEach((item: any, index: number) => { this._formatConditionTypes(item.to_PricingElement, true, index) });
        result.to_Partner = await this._enrichHeaderBPData(result.to_Partner);
        const oTaxAmount = result.to_PricingElement.find((cond) => cond.ConditionType === 'TTX1');

        result.TaxAmount = oTaxAmount.ConditionAmount;
        result.to_Item = this._resetBillingPlan(result.to_Item);

        //Reset Retenue values
        result.ZZ1_LibellRetenue_SDH = "";
        result.ZZ1_LibellRetenue2_SDH = "";
        result.ZZ1_LibellRetenue3_SDH = "";

        result.ZZ1_Pourcentage1_SDH = "0.00";
        result.ZZ1_Pourcentage2_SDH = "0.00";
        result.ZZ1_Pourcentage3_SDH = "0.00";

        result.ZZ1_Montant1_SDH = "0.00";
        result.ZZ1_Montant2_SDH = "0.00";
        result.ZZ1_Montant3_SDH = "0.00";

         result.ZZ1_MontantCaution1_SDH = "0.00";
         result.ZZ1_MontantCaution2_SDH = "0.00";
         result.ZZ1_MontantCaution3_SDH = "0.00";

         result.ZZ1_Mntretenuefact1_SDH = "0.00";
         result.ZZ1_Mntretenuefact2_SDH = "0.00";
         result.ZZ1_Mntretenuefact3_SDH = "0.00";

        oModel.setData(result);

        oTrackingModel.setProperty("/TotalAmount", result.TotalNetAmount);
        this._calculateInvoicedTotal(result.to_Item, result.TotalNetAmount);

        this._isLoaded = true;
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
    const oSalesOrderModel = this.getModel("salesOrder");
    const aItems = oSalesOrderModel.getProperty("/to_Item");
    const oSoldToParty = this.byId("fragGenInfo--inSoldTo") as Input;
    const oDocDate = this.byId("fragGenInfo--dpDocDate") as DatePicker;
    let errorsExist = false;

    if (oSoldToParty.getValue() === '') {
      oSoldToParty.setValueState("Error");
      errorsExist = true;
      this._addMessage({ type: "Error", title: "Missing Data", description: "Sold To Party is mandatory" });
    } else {
      oSoldToParty.setValueState("None");
    }

    if (oDocDate.getDateValue() === null) {
      oDocDate.setValueState("Error");
      errorsExist = true;
      this._addMessage({ type: "Error", title: "Missing Data", description: "Document Date is mandatory" });
    } else {
      oDocDate.setValueState("None");
    }

    if (aItems.length === 0) {
      errorsExist = true;
      this._addMessage({ type: "Error", title: "Missing Data", description: "At least one Article is required" });
    }

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

    oPayload.ZZ1_Pourcentage1_SDH ||= "0.00";
    oPayload.ZZ1_Pourcentage2_SDH ||= "0.00";
    oPayload.ZZ1_Pourcentage3_SDH ||= "0.00";
    oPayload.ZZ1_Montant1_SDH ||= "0.00";
    oPayload.ZZ1_Montant2_SDH ||= "0.00";
    oPayload.ZZ1_Montant3_SDH ||= "0.00";
    oPayload.ZZ1_MontantCaution1_SDH ||= "0.00";
    oPayload.ZZ1_MontantCaution2_SDH ||= "0.00";
    oPayload.ZZ1_MontantCaution3_SDH ||= "0.00";


    oPayload.to_PricingElement.forEach((i) => { delete i.to_SalesOrder });
    oPayload.to_Partner.forEach((p) => { delete p.to_SalesOrder; delete p.to_Address; });
    oPayload.to_Item.forEach((a) => a.to_PricingElement.forEach((b) => { delete b.to_SalesOrderItem }));
    //oPayload.to_Item.forEach((a) => a.to_ScheduleLine.forEach((b) => { delete b.to_SalesOrder; delete b.to_SalesOrderItem }));
    oPayload.to_Item.forEach((i) => i.to_Partner.forEach((p) => { delete p.to_SalesOrder; delete p.to_Address }));
    oPayload.to_Item.forEach((i) => delete i.to_ScheduleLine);
    oPayload.to_Item.forEach((i) => delete i.to_BillingPlan);
    delete oPayload.to_BillingPlan;
    delete oPayload.to_PricingElement;
    delete oPayload.TaxAmount;

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
    
    // Remove as properties not available in the Simulation API, these are created when a material is copied
    // that has already been simulated
    
    delete itemDetails.to_BillingPlan;
    delete itemDetails.ProductionPlant;
    delete itemDetails.WBSElement;
    delete itemDetails.isNew;
    delete itemDetails.to_Text;
    delete itemDetails.to_SalesOrder;
    delete itemDetails.to_ScheduleLine;
    delete itemDetails.__metadata;
    delete itemDetails.SalesOrderItemText;
    delete itemDetails.ProductTaxClassification1;
    delete itemDetails.ProductTaxClassification2;
    
    itemDetails.to_Partner = [];
    itemDetails.to_PricingElement = [];

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
    let bSave = false;

    itemChanges.newItems.forEach((item: any) => item.to_Partner.forEach((partner: any) => delete partner.to_Address));

    oSalesOrderModel.setDeferredGroups([groupId]);

    if (Object.keys(headerChanges).length > 0) {
      bSave = true;
      oSalesOrderModel.update(`/A_SalesOrder('${salesOrder}')`, headerChanges, {
        groupId,
        changeSetId: "SalesOrderChanges"
      });
    }

    if (itemChanges.itemPatches.length > 0) {
      bSave = true;
      itemChanges.itemPatches.forEach((item) => {
        oSalesOrderModel.update(`/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${item.SalesOrderItem}')`, item.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        })
      })
    }

    if (itemChanges.newItems.length > 0) {
      bSave = true;
      itemChanges.newItems.forEach((item) => {
        oSalesOrderModel.create("/A_SalesOrderItem", item, {
          groupId,
          changeSetId: "SalesOrderChanges"
        })
      })
    }

    if (conditionPatches.length > 0) {
      bSave = true;
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
      bSave = true;
      newConditions.forEach((condition) => {
        const sPath =
          `/A_SalesOrderItem(` +
          `SalesOrder='${condition.SalesOrder || salesOrder}',` +
          `SalesOrderItem='${condition.SalesOrderItem}'` +
          `)/to_PricingElement`;

        oSalesOrderModel.create(sPath, condition.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };

    /*if (newItemPartner.length > 0) {
      newItemPartner.forEach((partner) => {
        const sPath = `/A_SalesOrderItem(SalesOrder='${partner.SalesOrder}',SalesOrderItem='${partner.SalesOrderItem}')/to_Partner`;

        oSalesOrderModel.create(sPath, partner.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };*/

    /*newItemPartner.filter(partner => partner.payload.PartnerFunction !== "SP").forEach(partner => {
      const sPath = `/A_SalesOrderItem(SalesOrder='${partner.SalesOrder}',SalesOrderItem='${partner.SalesOrderItem}')/to_Partner`;

      oSalesOrderModel.create(sPath, partner.payload, {
        groupId,
        changeSetId: "SalesOrderChanges"
      });
    });*/

    if (deletedItemPartner.length > 0) {
      bSave = true;
      deletedItemPartner.forEach((partner) => {
        const sPath = `/A_SalesOrderItemPartner(SalesOrder='${partner.SalesOrder}',SalesOrderItem='${partner.SalesOrderItem}',PartnerFunction='${partner.PartnerFunction}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    };

    if (textPatches.length > 0) {
      bSave = true;
      textPatches.forEach((text) => {
        const sPath = `/A_SalesOrderText(SalesOrder='${text.SalesOrder}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;
        oSalesOrderModel.update(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (newText.length > 0) {
      bSave = true;
      newText.forEach((text) => {
        const sPath = `/A_SalesOrder('${text.SalesOrder}')/to_Text`;

        oSalesOrderModel.create(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      });
    }

    if (deletedText.length > 0) {
      bSave = true;
      deletedText.forEach((text) => {
        const sPath = `/A_SalesOrderText(SalesOrder='${text.SalesOrder}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (itemTextPatches.length > 0) {
      bSave = true;
      itemTextPatches.forEach((text) => {
        const sPath = `/A_SalesOrderItemText(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;
        oSalesOrderModel.update(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if (newItemText.length > 0) {
      bSave = true;
      newItemText.forEach((text) => {
        const sPath = `/A_SalesOrderItem(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}')/to_Text`;

        oSalesOrderModel.create(sPath, text.payload, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      });
    }

    if (deletedItemText.length > 0) {
      bSave = true;
      deletedItemText.forEach((text) => {
        const sPath = `/A_SalesOrderItemText(SalesOrder='${text.SalesOrder}',SalesOrderItem='${text.SalesOrderItem}',Language='${text.Language}',LongTextID='${text.LongTextID}')`;

        oSalesOrderModel.remove(sPath, {
          groupId,
          changeSetId: "SalesOrderChanges"
        });
      })
    }

    if(bSave) {
    return new Promise((resolve, reject) => {
      oSalesOrderModel.submitChanges({
        groupId,
        success: (oResponse: object) => resolve(oResponse),
        error: (oError: object) => reject(oError)
      });
    });
  } else {
    MessageBox.information("No changes to save");
  }


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
    const oBaselineModel = this.getView().getModel("baselineModel") as JSONModel;
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
        delete payload.isNew;
        payload.to_PricingElement.forEach((p) => { delete p.__metadata, delete p.ConditionTypeName });
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

        //if(condition.ConditionInactiveReason === "X") return;

        if (!condition.isNew) {
          const baselineCondition = baselineItem?.to_PricingElement?.find((baselineCondition: PricingElement) =>
            baselineCondition.ConditionType === condition.ConditionType && baselineCondition.ConditionInactiveReason === condition.ConditionInactiveReason
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
              DateCategory: "04", //oPlan.BillingPlanBillingDate,
              //dateCategory: oPlan.BillingPlanDateCategory,
              BillingPlanType: oPlan.BillingPlanType,
              //plannedValue: oPlan.BillingPlanAmount
              NetValue: oPlan.BillingPlanAmount,
              Percentage: "100.00",
              BillingRule: "1",
              BillingBlock: oPlan.BillingBlockReason,
              BillingDate: oPlan.BillingDate
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
            BillingDate: oLine.billingDate,
            DateCategory: oLine.DateCategory,
            //BillingType: oLine.billingType,
            Percentage: "100.00",
            BillingBlock: oLine.BillingBlock,
            BillingRule: oLine.BillingRule,
            NetValue: oLine.NetValue
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

    const aPartners = payload.to_Partner;

    payload.to_PricingElement = payload.to_PricingElement
      .filter((price: any) => price.ConditionType !== 'ZMIN' && price.ConditionType !== 'ZMAX')
      .map((price: any) => {
        Object.assign(price, {
          SalesOrder: ''
        });

        delete price.SalesContract;
        delete price.to_SalesContract;
        delete price.__metadata;

        return price;
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

      /*item.to_PricingElement.forEach((price: any) => {
        Object.assign(price, {
          SalesOrder: "",
          SalesOrderItem: ""
        });

        delete price.SalesContract;
        delete price.SalesContractItem;
        delete price.to_SalesContract;
        delete price.to_SalesContractItem;
        delete price.__metadata;
      });*/

      item.to_PricingElement = item.to_PricingElement
        .filter((price: any) => price.ConditionType !== 'ZMIN' && price.ConditionType !== 'ZMAX')
        .map((price: any) => {
          Object.assign(price, {
            SalesOrder: ''
          });

          delete price.SalesContract;
          delete price.SalesContractItem;
          delete price.to_SalesContract;
          delete price.to_SalesContractItem;
          delete price.__metadata;

          return price;
        });

      if (item.to_Partner.length > 0) {
        item.to_Partner.forEach((partner: any) => {
          delete partner.__metadata;
        });
      } else {
        item.to_Partner = aPartners;
      }


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

  private _updateUserStatus = async (): Promise<void> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const bUpdateUserStatus = oViewModel.getProperty("/updateUserStatus");

    //if(!bUpdateUserStatus) return;
     
    const oUserStatusesModel = this.getModel("userStatuses") as JSONModel;
    const aStatuses = oUserStatusesModel.getProperty("/results");
    const oBillingModel = this.getModel("billingDoc") as ODataModelV2;
    const salesOrder = oViewModel.getProperty("/salesOrder");
    const sUrl = `/SalesOrderUserStatusSet('${salesOrder}')`;
    const aStatus = aStatuses.find((status) => status.CurrentStatus);
    const payload = { "Status": aStatus.Status };

    oBillingModel.sDefaultUpdateMethod = "PUT";

    return new Promise<void>((resolve, reject) => {
      oBillingModel.update(sUrl, payload, {
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error)
      });
    })
  }

  private _getCompanyCode = async (): Promise<object> => {
    const oModel = this.getOwnerComponent()?.getModel("companyCodeVH") as ODataModel;
    const sCompanyCode = this.getModel("salesOrder").getProperty("/SalesOrganization");

    const oBinding = oModel.bindList(
      "/I_CompanyCodeStdVH",
      undefined,
      undefined,
      [
        new Filter(
          "CompanyCode",
          FilterOperator.EQ,
          sCompanyCode
        )
      ]
    );

    try {
      const aContexts = await oBinding.requestContexts(0, 1);

      return aContexts.length > 0 ? aContexts[0].getObject() : undefined;
    } finally {
      oBinding.destroy();
    }
  }

  private _resetBillingPlan = (items: SalesOrderItem[]): SalesOrderItem[] => {
    return items.map((item) => ({
      ...item, to_BillingPlan: {
        ...item.to_BillingPlan,
        BillingPlan: "",
        BillingPlanCategory: "",
        BillingPlanEndDate: null,
        BillingPlanEndDateRule: "",
        BillingPlanIsInHeader: false,
        BillingPlanSearchTerm: "",
        BillingPlanStartDate: null,
        BillingPlanStartDateRule: "",
        BillingPlanType: "Z1",
        ReferenceBillingPlan: "",
        SalesOrder: "",
        SalesOrderItem: "",
        to_BillingPlanItem: []
      }
    }));
  };

  private _getUpdatedPricing = async (path: string): Promise<object> => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const salesOrderInfo = oSalesOrderModel.getData();
    const itemData = oSalesOrderModel.getProperty(path);
    const oSalesOrderSimulate = this.getModel("salesOrderSimulate") as ODataModelV2;
    const sPath = "/A_SalesOrderSimulation";

    let to_Item = {
      "Material": itemData.Material,
      "SalesOrder": itemData.SalesOrder,
      "SalesOrderItem": itemData.SalesOrderItem,
      "RequestedQuantity": itemData.RequestedQuantity,
      "RequestedQuantityISOUnit": itemData.RequestedQuantityISOUnit
    };

    let oPayload = {
      "SalesOrderType": salesOrderInfo.SalesOrderType,
      "SoldToParty": salesOrderInfo.SoldToParty,
      "SalesOrganization": salesOrderInfo.SalesOrganization,
      "DistributionChannel": salesOrderInfo.DistributionChannel,
      "OrganizationDivision": salesOrderInfo.OrganizationDivision,
      "PurchaseOrderByCustomer": salesOrderInfo.PurchaseOrderByCustomer,
      "to_Pricing": {},
    };

    to_Item.to_PricingElement = [];

    itemData.to_PricingElement.forEach((cond) => {

      if (cond.ConditionClass === "D") return;

      to_Item.to_PricingElement.push({
        "ConditionAmount": cond.ConditionAmount,
        "ConditionCurrency": cond.ConditionCurrency,
        "ConditionQuantityISOUnit": cond.ConditionQuantityISOUnit,
        "ConditionQuantityUnit": cond.ConditionQuantityUnit,
        "ConditionRateValue": cond.ConditionRateValue,
        "ConditionType": cond.ConditionType,
        "TransactionCurrency": cond.TransactionCurrency,
        "PricingProcedureCounter": cond.PricingProcedureCounter,
        "SalesOrder": cond.SalesOrder,
        "SalesOrderItem": cond.SalesOrderItem
      });
    })

    oPayload.to_Item = [to_Item];

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

  private _dedupedConditions = (conditions: any[]): any[] => {
    const keptByType = new Map();
    const result: any[] = [];

    for (let row of conditions) {
      if (row.ConditionType === "") {
        result.push(row);
        continue;
      }

      //Force to 1 for now as some voodoo going on when simluating
      row.PricingProcedureCounter = "1";

      const existing = keptByType.get(row.ConditionType);

      if (!existing) {
        keptByType.set(row.ConditionType, row);
        result.push(row);
        continue;
      }

      const existingHasValue = Number(existing.ConditionRateValue) !== 0;
      const currentHasValue = Number(row.ConditionRateValue) !== 0;

      if (!existingHasValue && currentHasValue) {
        const index = result.indexOf(existing);
        if (index !== -1) {
          result[index] = row;
        }
        keptByType.set(row.ConditionType, row);
      }
    }

    return result;
  };

  private _getItemSubDocs = async (salesOrder: string, salesOrderItem: string): Promise<object> => {
    const oSalesOrderModel = this.getModel() as ODataModelV2;
    const sUrl = `/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}')`;

    return new Promise((resolve, reject) => {
      oSalesOrderModel.read(sUrl, {
        urlParameters: {
          $expand: "to_SubsequentProcFlowDocItem",
          $select: "SalesOrder,SalesOrderItem,to_SubsequentProcFlowDocItem"
        },
        success: (response: object) => { resolve(response) },
        error: (error: object) => { reject(error) }
      });
    });
  }

}