import BaseController from "./BaseController";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import JSONModel from "sap/ui/model/json/JSONModel";
import ODataModel from "sap/ui/model/odata/v4/ODataModel";
import type ODataModelV2 from "sap/ui/model/odata/v2/ODataModel";
import formatter from "../utils/Formatter";
import MessageBoxHelper from "../utils/MessageBoxHelper";
import Dialog from "sap/m/Dialog";
import Fragment from "sap/ui/core/Fragment";
import Select from "sap/m/Select";
import { addConditionDescriptions } from "../utils/ConditionText";
import { Mode, TabContentConfig, TextType, BillingPlan, BillingPlanItem, PricingElement, MessageType } from "../model/types";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type Event from "sap/ui/base/Event";
import DateFormat from "sap/ui/core/format/DateFormat"
import { ValueHelpRegistry } from "../utils/ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../utils/valueHelpConfigs";
import type Input from "sap/m/Input";
import type Table from "sap/m/Table";
import Token from "sap/m/Token";
import ODataV4MultiSelection from "sap/ui/table/plugins/ODataV4MultiSelection";
import Binding from "sap/ui/model/Binding";
import MessageBox from "sap/m/MessageBox";
import MessageItem from "sap/m/MessageItem";
import MessagePopover from "sap/m/MessagePopover";
import ResourceModel from "sap/ui/model/resource/ResourceModel";

interface ConditionRow {
  ConditionType: string;
  ConditionRateValue: string;
  ConditionClass: string;
  PricingProcedureStep: string;
  PricingProcedureCounter: string;
}

const conditions = {
  ZA00: { type: "Percentage", operation: "Add / Subtract" },
  ZA01: { type: "Value", operation: "Add / Subtract" },
  ZC00: { type: "Percentage", operation: "Add" },
  ZC01: { type: "Value", operation: "Add" },
  ZD00: { type: "Percentage", operation: "Subtract" },
  ZD01: { type: "Value", operation: "Subtract" }
};


/**
 * @namespace com.eiffage.sdt.controller
 */
export default class ItemDetails extends BaseController {

  private mode!: Mode;
  private index!: number;
  private _billingBlockDialog?: Dialog;
  private _rejectionReasonDialog?: Dialog;
  private _conditionDialog?: Dialog;
  private _oItemPartnerFunctionDialog?: Dialog;
  private _valueHelpRegistry!: ValueHelpRegistry;
  private readonly itemPartnerSelectionFragmentId = "itemPartnerSelection";
  private readonly itemPartnerTable = "fragPartners";
  private _oMessagePopover!: MessagePopover;


  private readonly contentByMode: Record<Mode, TabContentConfig[]> = {
    Create: [
      {
        tabId: "genInfoItem",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.GeneralInformationItem",
      },
      {
        tabId: "itemPrices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.ItemPriceElementsTable",
      },
      {
        tabId: "itemTexts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.create.ItemTextTable",
      },
      /*{
        tabId: "itemStatusAndBlocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlockItem",
      },*/
      {
        tabId: "itemPartners",
        fragId: "fragPartners",
        fragmentName: "com.eiffage.sdt.view.fragment.create.PartnersTable",
      },
      {
        tabId: "billingSchedule",
        fragId: "fragbillingSchedule",
        fragmentName: "com.eiffage.sdt.view.fragment.display.BillingSchedule",
      },
      {
        tabId: "billingDocument",
        fragId: "fragBillingDocument",
        fragmentName: "com.eiffage.sdt.view.fragment.create.BillingDocument",
      }
    ],
    Edit: [
      {
        tabId: "genInfoItem",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.GeneralInformationItem",
      },
      {
        tabId: "itemPrices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.create.ItemPriceElementsTable",
      },
      {
        tabId: "itemTexts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.create.ItemTextTable",
      },
      /*{
        tabId: "itemStatusAndBlocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlockItem",
      },*/
      {
        tabId: "itemPartners",
        fragId: "fragPartners",
        fragmentName: "com.eiffage.sdt.view.fragment.create.PartnersTable",
      },
      {
        tabId: "billingSchedule",
        fragId: "fragbillingSchedule",
        fragmentName: "com.eiffage.sdt.view.fragment.display.BillingSchedule",
      },
      {
        tabId: "billingDocument",
        fragId: "fragBillingDocument",
        fragmentName: "com.eiffage.sdt.view.fragment.create.BillingDocument",
      }
    ],
    Display: [
      {
        tabId: "genInfoItem",
        fragId: "fragGenInfo",
        fragmentName:
          "com.eiffage.sdt.view.fragment.display.GeneralInformationItem",
      },
      {
        tabId: "itemPrices",
        fragId: "fragPrices",
        fragmentName:
          "com.eiffage.sdt.view.fragment.display.ItemPriceElementsTable",
      },
      {
        tabId: "itemTexts",
        fragId: "fragTexts",
        fragmentName: "com.eiffage.sdt.view.fragment.display.ItemTextTable",
      },
      /*{
        tabId: "itemStatusAndBlocks",
        fragId: "fragStatus",
        fragmentName: "com.eiffage.sdt.view.fragment.StatusAndBlockItem",
      },*/
      {
        tabId: "billingSchedule",
        fragId: "fragbillingSchedule",
        fragmentName: "com.eiffage.sdt.view.fragment.display.BillingSchedule",
      }
      ,
      {
        tabId: "itemPartners",
        fragId: "fragPartners",
        fragmentName: "com.eiffage.sdt.view.fragment.display.PartnersTable",
      },
      {
        tabId: "billingDocument",
        fragId: "fragBillingDocument",
        fragmentName: "com.eiffage.sdt.view.fragment.display.BillingDocument",
      }
    ],
  };

  public formatter = formatter;

  public async onInit(): Promise<void> {
    const oRouter = this.getRouter();
    oRouter?.getRoute("SalesOrderItemDetails")?.attachPatternMatched(this._onPatternMatched, this);
    this._valueHelpRegistry = new ValueHelpRegistry(this.getView(), this);
    this._initMessageControls();
  }

  public onConditionValueChange = async (oEvent: Event): void => {
    const oPricesTable = oEvent.getSource().getParent().getParent().getParent();
    const sPath = oEvent.getSource().getParent().getBindingContext("itemDetail").sPath;
    let oItemDetailModel = this.getView().getModel("itemDetail") as JSONModel;
    //let nNetAmount = 0;

    oPricesTable.setBusy(true);
    const results = await this._getUpdatedPricing(sPath);
    const conditions = this._dedupedConditions(results.to_Item.results[0].to_PricingElement.results);
    this._formatConditionTypes(conditions, true, this.index);
    oItemDetailModel.setProperty("/to_PricingElement", conditions);

    const nNetAmount = conditions.reduce((total, cond) => {
      if (!cond.ConditionType || cond.ConditionClass === "D") {
        return total;
      }

      const amount = Number(cond.ConditionAmount);

      return Number.isFinite(amount) ? total + amount : total
    }, 0);

    const condition = conditions.find((item) => item.ConditionType === "PR00");

    if (condition.ConditionInactiveReason === "") {
      const taxCondition = conditions.find((item) => item.ConditionType === "TTX1");
      oItemDetailModel.setProperty("/NetAmount", nNetAmount.toString());
      oItemDetailModel.setProperty("/TaxAmount", taxCondition.ConditionAmount);
    } else {
      const feeCondition = conditions.find((item) => item.ConditionType === "ZFAL");
      const taxDedCondition = conditions.find((item) => item.ConditionType === "ZWST");
      oItemDetailModel.setProperty("/NetAmount", nNetAmount.toString());
      oItemDetailModel.setProperty("/TaxAmount", taxDedCondition.ConditionAmount);
    }

    this._updateBillingPlan(condition);

    oPricesTable.setBusy(false);
  }

  public onAddItemText = (): void => {

    let oItemDetailModel = this.getView().getModel("itemDetail");
    let aItems = oItemDetailModel.getProperty("/to_Text");

    aItems.push({
      SalesOrder: oItemDetailModel.getProperty("/SalesOrder"),
      SalesOrderItem: oItemDetailModel.getProperty("/SalesOrderItem"),
      Language: "FR",
      LongTextID: "",
      LongText: "",
      ...(this.mode !== "Create" ? { isNew: true } : {}),
    });

    oItemDetailModel.setProperty("/to_Text", aItems);

  }

  public onTextTypeSelection = (oEvent: Event): void => {
    const oSelect = oEvent.getSource();
    const sSelectedKey = oSelect.getSelectedKey();
    const oItemDetailModel = this.getView().getModel("itemDetail");
    const aItems = oItemDetailModel.getProperty("/to_Text");
    const oI118nModel = this.getResourceBundle();
    //const sPath = oSelectedItem.getBindingContextPath();

    //const oText = aItems.find((text) => text.LongTextID === sSelectedKey);

    //if (oText) {

    //oSelect.setSelectedKey("");
    //MessageBox.error(oI118nModel.getText("salesOrderItemText.message.textAlreadyExists"));
    //}
  }

  public onItemTextDelete = async (oEvent: Event): void => {
    const oTextTable = this.byId("fragTexts--tableItemTextCreate");
    const oSelectedItem = oTextTable.getSelectedItem();
    const oItemDetailModel = this.getView().getModel("itemDetail") as JSONModel;
    const aItem = oItemDetailModel.getProperty("/to_Text");
    const oI118nModel = this.getResourceBundle();
    const sPath = oSelectedItem.getBindingContextPath();

    if (!oSelectedItem) {
      MessageBox.error(oI118nModel.getText("salesOrderText.table.noItemSelected"));
      return;
    }

    const sMode = this.getModel("viewModel").getProperty("/mode");

    if (sMode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(
        this.getView(),
        "Are you sure you want to delete this text?",
      );

      if (!bConfirmed) {
        return;
      }

      oItemDetailModel.setProperty(sPath + "/isDeleted", true);

    } else {
      const nIndex = Number(sPath.split("/").pop());
      aItem.splice(nIndex, 1);
      oItemDetailModel.setProperty("/to_Text", aItem);
    }
  }

  public onApply = (): void => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const oItemDetailModel = this.getView().getModel("itemDetail");
    const sProperty = `/to_Item/${this.index}`;

    if (this._preApplyValidation()) {
      //this.popover.openBy(this.getView());
      return;
    }
    oSalesOrderModel.setProperty(sProperty, oItemDetailModel.getData());

    window.history.go(-1);
  }

  public onBillingBlockSelect = async (oEvent: Event): Promise<void> => {
    const key = oEvent.getParameter("item").getKey();

    if (!this._billingBlockDialog) {
      void await this._loadBillingBlockDialog();

    }

    if (key === "removeBillingBlock") {
      try {
        this.getView().setBusy(true);
        this.getView().getModel("itemDetail").setProperty("/ItemBillingBlockReason", "");
        const results = await this._updateBillingBlock();
        this._billingBlockDialog?.close();
        this.getView().setBusy(false);
      } catch (error) {
        this.getView().setBusy(false);
        console.error(error);
      }
      return;
    }

    this._billingBlockDialog?.open();

  }

  public onCancelBillingBlockPress(): void {
    this._billingBlockDialog?.close();
  }

  public async onSetBillingBlockPress(): Promise<void> {

    try {
      this.getView().setBusy(true);
      void await this._updateBillingBlock();
      this._billingBlockDialog?.close();
      this.getView().setBusy(false);
    } catch (error) {
      console.error(error);
      this.getView().setBusy(false);
    }

  }

  public async onSetRejectionReasonPress(): Promise<void> {

    try {
      this.getView().setBusy(true);
      void await this._updateRejectionReason();
      this._rejectionReasonDialog?.close();
      this.getView().setBusy(false);
    } catch (error) {
      console.error(error);
      this.getView().setBusy(false);
    }

  }

  public onRejectionReasonSelect = async (oEvent: Event): Promise<void> => {
    const key = oEvent.getParameter("item").getKey();

    if (!this._rejectionReasonDialog) {
      void await this._loadRejectionReasonDialog();

    }

    if (key === "removeRejectionReason") {
      try {
        this.getView().setBusy(true);
        this.getView().getModel("itemDetail").setProperty("/SalesDocumentRjcnReason", "");
        const results = await this._updateRejectionReason();
        this._rejectionReasonDialog?.close();
        this.getView().setBusy(false);
      } catch (error) {
        this.getView().setBusy(false);
        console.error(error);
      }

      return;
    }

    this._applyRejectionReasonFilter();
    this._rejectionReasonDialog?.open();

  }

  public onCancelRejectionReasonPress(): void {
    this._rejectionReasonDialog?.close();
  }

  public onCreatePricingElement = async (): Promise<void> => {
    const oDialog = await this._getConditionDialog();
    oDialog.open();
  }

  public onConditionTypeValueHelp = async (oEvent: Event): Promise<void> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oInput = oEvent.getSource() as Input;

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
          oViewModel.setProperty("/itemConditionType", oSelectedToken.getKey());
          oViewModel.setProperty("/itemConditionTypeDesc", oSelectedToken.getText());
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onCreateCondition = async (oEVent: Event): void => {
    const oItemDetailModel = this.getView().getModel("itemDetail") as JSONModel;
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const sNewConditionType = oViewModel.getProperty("/itemConditionType");
    const aPricingElements = oItemDetailModel.getProperty("/to_PricingElement");
    const oDialog = await this._getConditionDialog();

    oDialog.close();

    const oBaseObject = aPricingElements[0];
    try {
      const oConditionInfo = await this._getItemConditionConfig(sNewConditionType);
      const oSingleCondition = oConditionInfo.results[0] || {};

      const result = Object.fromEntries(
        Object.keys(oSingleCondition)
          .filter(key => key in oBaseObject)
          .map(key => [key, oSingleCondition[key]])
      );

      result.isNew = true;

      aPricingElements.push(result);
      oItemDetailModel.setProperty("/to_PricingElement", aPricingElements);
    } catch (error) {
      //Add error handling here
    }
  }

  public onCancelCreateDialog = async (oEVent: Event): void => {
    const oDialog = await this._getConditionDialog();
    oDialog.close();
  }


  public onItemSelected = (oEvent: Event): void => {
    const bSelectAll = oEvent.getParameter("selectAll") as boolean;
  }

  public onDeletePricingElement = (oEvent: Event): void => {
    const oSelectedItems = oEvent.getSource().getParent().getParent().getSelectedItems();
    const oTable = this.byId("tableItemPriceElementsCreate") as Table;
  };

  public onAddPartner = async (oEvent: Event): Promise<void> => {
    const oDialog = await this._getItemPartnerFunctionDialog();
    const oSelect = Fragment.byId(this.itemPartnerSelectionFragmentId, "itemPartnerTypeSelect") as Select;
    const oItemDetailModel = this.getView()?.getModel("itemDetail");
    const oItemsBinding = oSelect.getBinding("items");

    oItemsBinding.filter([
      new Filter(
        "SalesDocumentItemCategory",
        FilterOperator.EQ,
        oItemDetailModel?.getProperty("/SalesOrderItemCategory")
      )
    ]);

    oDialog.open();

  }

  public onCreateItemPartner = async (): void => {
    const oSelect = Fragment.byId(this.itemPartnerSelectionFragmentId, "itemPartnerTypeSelect") as Select;
    const oItemDetailModel = this.getView()?.getModel("itemDetail") as JSONModel;
    const aPartners = oItemDetailModel?.getProperty("/to_Partner");
    const oDialog = await this._getItemPartnerFunctionDialog();
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

  public onCancelItemPartner = async (): void => {
    const oDialog = await this._getItemPartnerFunctionDialog();
    oDialog.close();
  }

  public onPartnerVH = async (oEvent: Event): Promise<void> => {
    const oItemDetailModel = this.getView()?.getModel("itemDetail") as JSONModel;
    const oInput = oEvent.getSource() as Input;
    const itemPath = oEvent.getSource().getParent().getBindingContext("itemDetail").getPath();
    let oItem = oItemDetailModel.getProperty(this._itemPath);

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
          //oItemDetailModel.setProperty("/Customer", oObject.Customer);
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

  public onDeletePartner = (oEvent: Event): void => {
    const oItemDetailModel = this.getView()?.getModel("itemDetail") as JSONModel;
    const oTable = this.byId("fragPartners--partnersTableCreateItem") as Table;
    const oSelectedItem = oTable.getSelectedItem();
    const aItems = oItemDetailModel?.getProperty("/to_Partner");
    const sPath = oSelectedItem.getBindingContext("itemDetail").getPath();

    if (this.mode === "Edit") {
      oItemDetailModel.setProperty(sPath + "/isDeleted", true);
    } else {
      const nIndex = Number(sPath.split("/").pop());
      aItems.splice(nIndex, 1);
      oItemDetailModel.setProperty("/to_Partner", aItems);
    }
  }

  public onTextChange = (oEvent: Event): void => {
    const oSalesOrderModel = this.getView().getModel("itemDetail");
    const sPath = oEvent.getSource().getBindingContext("itemDetail").getPath();
    const bNew = oSalesOrderModel.getProperty(sPath).isNew;

    if (!bNew && this.mode === "Edit") {
      oSalesOrderModel.setProperty(sPath + "/isChanged", true);
    }
  }

  public onAddBillingSchedule = (): void => {
    const oItemModel = this.getView().getModel("itemDetail");
    let aBillingPlanItem = oItemModel.getProperty("/to_BillingPlan/to_BillingPlanItem") as BillingPlanItem[];
    let oBillingPlanItem = {} as BillingPlanItem;

    oBillingPlanItem.SalesOrder = "";
    oBillingPlanItem.BillingPlan = "";
    oBillingPlanItem.BillingPlanItem = "";
    oBillingPlanItem.BillingPlanDateCategory = "04";
    oBillingPlanItem.BillingPlanBillingDate = this._formatDate(new Date());
    oBillingPlanItem.BillingPlanAmount = "";
    oBillingPlanItem.TransactionCurrency = "EUR";
    oBillingPlanItem.BillingPlanAmountPercent = "100";
    oBillingPlanItem.CustomerPaymentTerms = "";
    oBillingPlanItem.ProposedBillingDocumentType = "";
    oBillingPlanItem.BillingPlanDateDescriptionCode = "";
    oBillingPlanItem.BillingBlockReason = "Z1";
    oBillingPlanItem.BillingPlanServiceStartDate = undefined;
    oBillingPlanItem.BillingPlanServiceEndDate = undefined;
    oBillingPlanItem.BillingPlanRelatedBillgStatus = "";
    oBillingPlanItem.BillingPlanType = "ZF2";
    oBillingPlanItem.AdoptingBillingDateID = "";
    oBillingPlanItem.BillingPlanBillingRule = "1";
    oBillingPlanItem.BillingPlanMilestoneUsage = "";
    oBillingPlanItem.BillgPlnDteCorrectionRfndType = "";
    oBillingPlanItem.AccountingExchangeRate = "";
    oBillingPlanItem.PostponementReason = "";

    aBillingPlanItem.push(oBillingPlanItem);

    oItemModel.setProperty("/to_BillingPlan/to_BillingPlanItem", aBillingPlanItem);

  }

  public onDeleteBillingSchedule = async (oEvent: Event): void => {
    const oTable = this.byId("fragbillingSchedule--tableBillingScheduleCreate") as Table;
    const oSelectedItem = oTable.getSelectedItem();
    const oI118nModel = this.getResourceBundle();

    if (!oSelectedItem) {
      MessageBox.error(oI118nModel.getText("salesOrderText.table.noItemSelected"));
      return;
    }

    const oItemDetailModel = this.getView().getModel("itemDetail") as JSONModel;
    const aItem = oItemDetailModel.getProperty("/to_BillingPlan/to_BillingPlanItem");
    const sPath = oSelectedItem.getBindingContextPath();

    if (this.mode === "Edit") {
      const bConfirmed = await MessageBoxHelper.confirm(this.getView(), "Are you sure you want to delete this Billing Plan?");

      if (!bConfirmed) {
        return;
      }

      oItemDetailModel.setProperty(sPath + "/isDeleted", true);

    } else {
      const nIndex = Number(sPath.split("/").pop());
      aItem.splice(nIndex, 1);
      oItemDetailModel.setProperty("/to_BillingPlan/to_BillingPlanItem", aItem);
    }
  }

  public onCalendarTypeChange = (oEvent: Event): void => {

    const oViewModel = this.getModel("viewModel");
    const bPerodicCalendar = oViewModel.getProperty("/periodicCalendar");
    const bMilestoneCalendar = oViewModel.getProperty("/milestoneCalendar");

    oViewModel.setProperty("/periodicCalendar", !bPerodicCalendar);
    oViewModel.setProperty("/milestoneCalendar", !bMilestoneCalendar);

  }

  public onCancel = (): void => {
    window.history.go(-1);
  }

  public onOpenMessages(event: any): void {
    this._oMessagePopover.toggle(event.getSource());
  }

  private onNavToInvoice = async (oEvent: Event): void => {
    const sBillingDocument = oEvent.getSource().getText();
    const oCrossAppNav = await sap.ushell.Container.getService("CrossApplicationNavigation");

    oCrossAppNav.toExternal({
      target: {
        semanticObject: "BillingDocument",
        action: "manage"
      },
      appSpecificRoute: `object/display/${encodeURIComponent(sBillingDocument)}`
    });
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

  private _applyRejectionReasonFilter = (): void => {
    const sDocType = this.getModel("salesOrder")?.getProperty("/SalesOrderType") as string;
    const sSalesOrg = this.getModel("salesOrder")?.getProperty("/SalesOrganization") as string;

    const oSelect = sap.ui.getCore().byId("rejectionReasonSelect") as Select;
    const oBinding = oSelect?.getBinding("items");

    if (!oBinding || !sDocType || !sSalesOrg) {
      return;
    }

    oBinding.filter([
      new Filter("SalesDocumentType", FilterOperator.EQ, sDocType),
      new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
    ], "Application");
  };

  private _loadBillingBlockDialog = async (): Promise<void> => {
    this._billingBlockDialog = (await Fragment.load({
      name: "com.eiffage.sdt.view.fragment.BillingBlockItem",
      controller: this
    })) as Dialog;

    this.getView().addDependent(this._billingBlockDialog);
  }

  private _loadRejectionReasonDialog = async (): Promise<void> => {
    this._rejectionReasonDialog = (await Fragment.load({
      name: "com.eiffage.sdt.view.fragment.RejectionReasonItem",
      controller: this
    })) as Dialog;

    this.getView().addDependent(this._rejectionReasonDialog);
  }

  private _updateBillingBlock = async (): Promise<object> => {
    const oModel = this.getView().getModel() as ODataModel;
    const oItemData = this.getView().getModel("itemDetail").getData();

    const salesOrder = oItemData.SalesOrder;
    const item = oItemData.SalesOrderItem;

    return new Promise((resolve, reject) => {
      oModel.update(
        `/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${item}')`,
        { ItemBillingBlockReason: oItemData.ItemBillingBlockReason },
        {
          success: (response: object) => resolve(response),
          error: (error: object) => reject(error)
        }
      );
    });
  }

  private _updateRejectionReason = async (): Promise<object> => {
    const oModel = this.getView().getModel() as ODataModel;
    const oItemData = this.getView().getModel("itemDetail").getData();

    const salesOrder = oItemData.SalesOrder;
    const item = oItemData.SalesOrderItem;

    return new Promise((resolve, reject) => {
      oModel.update(
        `/A_SalesOrderItem(SalesOrder='${salesOrder}',SalesOrderItem='${item}')`,
        { SalesDocumentRjcnReason: oItemData.SalesDocumentRjcnReason },
        {
          success: (response: object) => resolve(response),
          error: (error: object) => reject(error)
        }
      );
    });
  }

  private async _onPatternMatched(oEvent: any): Promise<void> {
    const oItemTrackingDataModel = this.getModel("itemTrackingData") as JSONModel;
    const oCalculateAmountsModel = this.getModel("calculatedAmounts");
    const aCalculatedItems = oCalculateAmountsModel.getProperty("/itemAmounts")
    const args = oEvent.getParameter("arguments");
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const sMode = oViewModel.getProperty("/mode");
    this.index = parseInt(args.Index);
    const itemData = this.getModel('salesOrder').getProperty(`/to_Item/${this.index}`);

    this.mode = this.getModel("viewModel").getProperty("/mode");

    oViewModel.setProperty("/isNewItem", itemData?.isNew ? true : false);

    if (this.mode === "Edit" || this.mode === "Display") {
      const itemCalculatedAmounts = aCalculatedItems.results.find((item) => Number(item.SalesOrderItem) === Number(itemData.SalesOrderItem));
      oItemTrackingDataModel.setData(itemCalculatedAmounts);
    }

    const oModel = new JSONModel(itemData);
    oModel.setDefaultBindingMode("TwoWay");

    if (sMode === "Create") {
      oModel.setProperty("/PricingDate", new Date());
    }

    const partners = await this._enrichHeaderBPData(oModel.getProperty("/to_Partner"));
    oModel.setProperty("/to_Partner", partners);
    this.getView().setModel(oModel, "itemDetail");

    oItemTrackingDataModel.setProperty("/TotalAmountItem", oModel.getProperty("/NetAmount"));
    oItemTrackingDataModel.setProperty("/TotalQty", oModel.getProperty("/RequestedQuantity"));
    oItemTrackingDataModel.setProperty("/TotalQtyUoM", oModel.getProperty("/OrderQuantityUnit"));
    //oItemTrackingDataModel.setProperty("/TotalAmountItemPercentage", "100");
    //oItemTrackingDataModel.setProperty("/TotalItemAmount", oModel.getProperty("/BillableAmountItem"));
    //oItemTrackingDataModel.setProperty("/BillableAmountItemPercentage", "100");

    if (this.mode === "Edit" || this.mode === "Display") {
      this._calculateItemInvoicedTotal(oModel);
    }

    this.getPage("pageSalesOrderItems").setShowFooter(this.mode === "Edit" || this.mode === "Create");

    void this._loadItemTextTypes(oModel.getProperty("/SalesDocumentItemCategory"));

    const fragMode = oViewModel.getProperty("/itemFragMode");

    if (fragMode !== this.mode) {
      await this._loadFragment(this.mode);
      oViewModel.setProperty("/itemFragMode", this.mode);
    }

    const aSalesOrderDocFlow = await this._getSalesOrderDocFlow(oModel.getProperty("/SalesOrder"), oModel.getProperty("/SalesOrderItem")) as [];
    const normalize = (v: unknown) => String(v ?? "").replace(/^0+/, "") || "0";
    const keyOf = (sPlan: unknown, sItem: unknown) => `${normalize(sPlan)}|${normalize(sItem)}`;

    const mBillingDocumentByPlanItem = new Map(aSalesOrderDocFlow.map((oFlow) => [
      keyOf(oFlow.BillingPlan, oFlow.BillingPlanItem),
      oFlow.SubsequentDocument
    ])
    );

    let aBillingPlanItems = oModel.getProperty("/to_BillingPlan/to_BillingPlanItem");

    if (aBillingPlanItems?.length > 0) {

      for (const oPlanItem of aBillingPlanItems ?? []) {
        const sBillingDocument = mBillingDocumentByPlanItem.get(
          keyOf(oPlanItem.BillingPlan, oPlanItem.BillingPlanItem)
        );

        if (sBillingDocument !== undefined) {
          oPlanItem.BillingDocument = sBillingDocument;
        }

        oPlanItem.BillingPlanRelatedBillgStatusDescription = await this._getBillingStatusText(oPlanItem.BillingPlanRelatedBillgStatus);
      }

      oModel.setProperty("/to_BillingPlan/to_BillingPlanItem", aBillingPlanItems);
    }

  }

  private _loadFragment = async (sMode: Mode): Promise<void> => {

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

  };

  private _getUpdatedPricing = async (path: string): Promise<object> => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const salesOrderInfo = oSalesOrderModel.getData();
    const oItemDetailModel = this.getView().getModel("itemDetail");
    const itemData = oItemDetailModel.getData();
    const conditionInfo = oItemDetailModel.getProperty(path);
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

  private _loadItemTextTypes = async (salesDocumentItemCategory: string): Promise<void> => {
    const oODataModel = this.getModel("itemTextTypeVH") as ODataModel;
    const oItemTextTypesModel = this.getModel("itemTextTypes") as JSONModel;


    const oListBinding = oODataModel.bindList(
      "/C_SlsDocItmCatTxtDetnItmVH",
    );

    oListBinding.filter([
      new Filter(
        "SalesDocumentItemCategory",
        FilterOperator.EQ,
        salesDocumentItemCategory || "ZMBP",
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

    oItemTextTypesModel.setProperty("/textTypes", aTextTypes);
  }
  private _calculateItemInvoicedTotal = async (oModel: any): Promise<void> => {
    const item = oModel.getData();
    const oItemTrackingModel = this.getModel("itemTrackingData");
    const oBillingDocModel = this.getModel("billingDocument");
    const aSubDocs = item.to_SubsequentProcFlowDocItem;
    const oBillingDocsModel = new JSONModel();
    let aBillingItems = [];
    let nTotalInvoiced = 0;
    let nTotalInvoicedPercentage = 0;
    let nBillableAmount = 0;
    let nBillableAmountPercentage = 0;
    let nTotalBillingQty = 0;


    const aFilters: Filter[] = item.to_SubsequentProcFlowDocItem.map((oDoc: any) =>
      new Filter({
        filters: [
          new Filter({
            path: "BillingDocument",
            operator: FilterOperator.EQ,
            value1: oDoc.SubsequentDocument
          }),
          new Filter({
            path: "BillingDocumentItem",
            operator: FilterOperator.EQ,
            value1: oDoc.SubsequentDocumentItem
          })
        ],
        and: true
      })
    );

    if (aFilters.length === 0) {
      oItemTrackingModel.setProperty("/BillableAmountItem", Number(item.NetAmount).toFixed(2));
      oItemTrackingModel.setProperty("/InvoiceAmountItem", "0.00");
      oItemTrackingModel.setProperty("/InvoicedAmountItemPercentage", "0");
      oItemTrackingModel.setProperty("/BillableAmountItemPercentage", 100);
      return;
    };

    const oCombinedFilter = new Filter({
      filters: aFilters,
      and: false
    });

    const oListBinding = oBillingDocModel.bindList("/BillingDocumentItem") as ODataListBinding;

    oListBinding.filter([oCombinedFilter]);

    const aContexts: Context[] = await oListBinding.requestContexts(0, 100);

    aContexts.forEach((context) => {
      const object = context.getObject();

      aBillingItems.push({ ...object });

      nTotalInvoiced += Number(object.NetAmount);
      nTotalBillingQty += Number(object.BillingQuantity);
    });

    nBillableAmount = item.NetAmount - nTotalInvoiced;

    oItemTrackingModel.setProperty("/InvoicedAmountItem", nTotalInvoiced);
    oItemTrackingModel.setProperty("/BillableAmountItem", Number(nBillableAmount));
    oItemTrackingModel.setProperty("/InvoiceAmountItem", Number(nTotalInvoiced));
    oItemTrackingModel.setProperty("/InvoicedAmountItemPercentage", (nTotalInvoiced / item.NetAmount) * 100);
    oItemTrackingModel.setProperty("/BillableAmountItemPercentage", (nBillableAmount / item.NetAmount) * 100);
    oItemTrackingModel.setProperty("/TotalInvoicedQty", nTotalBillingQty);
    oItemTrackingModel.setProperty("/TotalInvoicedQtyUoM", item.OrderQuantityUnit);
    oItemTrackingModel.setProperty("/TotalBillableQty", item.RequestedQuantity - nTotalBillingQty);
    oItemTrackingModel.setProperty("/TotalBillableQtyUoM", item.OrderQuantityUnit);

    oBillingDocsModel.setData(aBillingItems);
    this.setModel(oBillingDocsModel, "billingDocs");
  }

  private _updateBillingPlanInfo = (oModel: any): void => {
    const oBillingDocsModel = this.getView().getModel("billingDocs");
    let aBillingPlanItems = oModel.getProperty("/toBillingPlan/to_BillingPlanItem");
  }

  private _updateBillingPlan = (condition: PricingElement): void => {
    const oItemModel = this.getView().getModel("itemDetail");
    const oViewModel = this.getModel("viewModel");
    const sMode = oViewModel.getProperty("/mode");
    const oViewData = oViewModel.getData();
    let aBillingPlan = oItemModel.getProperty("/to_BillingPlan") as BillingPlan;
    let aBillingPlanItem = oItemModel.getProperty("/to_BillingPlan/to_BillingPlanItem") as BillingPlanItem[];
    let oBillingPlanItem = {} as BillingPlanItem;
    let oBillingPlan = {} as BillingPlan;

    if (sMode === "Create") {
      aBillingPlanItem = [];
    }

    if (oViewData.periodicCalendar) {
      const from = new Date(aBillingPlan.BillingPlanStartDate);
      const to = new Date(aBillingPlan.BillingPlanEndDate);
      const months = (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth()) + 1;
      const monthlyNetAmount = Number(condition.ConditionAmount) / months;
      const monthlyPercentage = 100 / months;

      let current = new Date(from.getFullYear(), from.getMonth(), 1);

      while (current <= to) {

        const oBillingPlan = {
          BillingPlanStartDate: this._formatDate(new Date())
        };

        oBillingPlanItem = {
          SalesOrder: "",
          BillingPlan: "",
          BillingPlanItem: "",
          BillingPlanDateCategory: "04",
          BillingPlanBillingDate: new Date(current).toISOString(),
          BillingPlanAmount: monthlyNetAmount.toString(),
          TransactionCurrency: "EUR",
          BillingPlanAmountPercent: monthlyPercentage.toString(),
          CustomerPaymentTerms: "",
          ProposedBillingDocumentType: "",
          BillingPlanDateDescriptionCode: "",
          BillingBlockReason: "Z1",
          BillingPlanServiceStartDate: "",
          BillingPlanServiceEndDate: "",
          BillingPlanRelatedBillgStatus: "",
          BillingPlanType: "ZF2",
          AdoptingBillingDateID: "",
          BillingPlanBillingRule: "1",
          BillingPlanMilestoneUsage: "",
          BillgPlnDteCorrectionRfndType: "",
          AccountingExchangeRate: "",
          PostponementReason: ""
        };

        aBillingPlanItem.push(oBillingPlanItem);
        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }


    } else {

      const oBillingPlan = {
        BillingPlanStartDate: this._formatDate(new Date())
      };

      oBillingPlanItem.SalesOrder = "";
      oBillingPlanItem.BillingPlan = "";
      oBillingPlanItem.BillingPlanItem = "";
      oBillingPlanItem.BillingPlanDateCategory = "04";
      oBillingPlanItem.BillingPlanBillingDate = this._formatDate(new Date());
      oBillingPlanItem.BillingPlanAmount = condition.ConditionAmount;
      oBillingPlanItem.TransactionCurrency = "EUR";
      oBillingPlanItem.BillingPlanAmountPercent = "100";
      oBillingPlanItem.CustomerPaymentTerms = "";
      oBillingPlanItem.ProposedBillingDocumentType = "";
      oBillingPlanItem.BillingPlanDateDescriptionCode = "";
      oBillingPlanItem.BillingBlockReason = "Z1";
      oBillingPlanItem.BillingPlanServiceStartDate = undefined;
      oBillingPlanItem.BillingPlanServiceEndDate = undefined;
      oBillingPlanItem.BillingPlanRelatedBillgStatus = "";
      oBillingPlanItem.BillingPlanType = "ZF2";
      oBillingPlanItem.AdoptingBillingDateID = "";
      oBillingPlanItem.BillingPlanBillingRule = "1";
      oBillingPlanItem.BillingPlanMilestoneUsage = "";
      oBillingPlanItem.BillgPlnDteCorrectionRfndType = "";
      oBillingPlanItem.AccountingExchangeRate = "";
      oBillingPlanItem.PostponementReason = "";

      aBillingPlanItem.push(oBillingPlanItem);
    }

    oItemModel.setProperty("/to_BillingPlan/to_BillingPlanItem", aBillingPlanItem);
    oItemModel.setProperty("/to_BillingPlan/BillingPlanStartDate", this._formatDate(new Date()));
    oItemModel.setProperty("/to_BillingPlan/BillingPlanEndDate", this._formatDate(new Date(9999, 11, 31)));
  }

  private _getSalesOrderDocFlow = async (SalesOrder: string, SalesOrderItem: String): Promise<object> => {
    const oDocFlowModel = this.getModel("salesOrderDocFlow");
    const aFilters: Filter[] = [];

    aFilters.push(new Filter({
      filters: [
        new Filter({
          path: "PrecedingDocument",
          operator: FilterOperator.EQ,
          value1: SalesOrder
        }),
        new Filter({
          path: "PrecedingDocumentItem",
          operator: FilterOperator.EQ,
          value1: SalesOrderItem
        })
      ],
      and: true
    })
    );

    //aFilters.push( new Filter("PrecedingDocument", FilterOperator.EQ, SalesOrder));
    //aFilters.push( new Filter("PrecedingDocumentItem", FilterOperator.EQ, SalesOrderItem));

    const oListBinding = oDocFlowModel.bindList("/ZC_SalesOrderItemFlow") as ODataListBinding;

    oListBinding.filter(aFilters);

    const aContexts: Context[] = await oListBinding.requestContexts(0, 100);

    const aDocumentFlow = aContexts.map((oContext) => oContext.getObject());
    return aDocumentFlow;
  }

  private _formatDate = (date: Date): string => {
    const oFmt = DateFormat.getDateTimeInstance({ pattern: "yyyy-MM-dd'T'HH:mm:ss.SSS" });
    return oFmt.format(new Date(date));
  }
  private _enrichHeaderBPData = async (partner: any): Promise<object[]> => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    //const aPartner = oSalesOrderModel.getProperty("/to_Partner");

    const aAddresses = await this._getBPAddresses(partner)

    const addressMap = new Map(aAddresses.map(addr => [addr.BusinessPartner, addr]));

    partner?.forEach((partner: any) => {
      partner.to_Address = addressMap.get(partner.Customer) ?? null;
    });

    //oSalesOrderModel.setProperty("/to_Partner", aPartner);

    return partner;
  }

  private _getBPAddresses = async (partners: any): Promise<object[]> => {

    if (partners?.length === 0 || partners === undefined) return [];

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

  private _getItemConditionConfig = async (conditionType: string): Promise<object[]> => {
    const oConditionModel = this.getModel("conditionTypeConfig") as ODataModelV2;
    const sPath = "/A_SlsPricingConditionType";
    const oFilter = new Filter("ConditionType", FilterOperator.EQ, conditionType);

    return new Promise((resolve, reject) => {
      oConditionModel.read(sPath, {
        filters: [oFilter],
        success: (oData: object) => { resolve(oData) },
        error: (error: object) => { reject(error) }
      });
    });

  }

  private _getItemPartnerFunctionDialog = async (): Promise<Dialog> => {
    if (!this._oItemPartnerFunctionDialog) {
      this._oItemPartnerFunctionDialog = (await Fragment.load({
        id: this.itemPartnerSelectionFragmentId,
        name: "com.eiffage.sdt.view.fragment.create.ItemPartnerTypeSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oItemPartnerFunctionDialog);
    }

    return this._oItemPartnerFunctionDialog;
  }

  private _preApplyValidation = (): boolean => {
    const oSalesOrderItemModel = this.getView().getModel("itemDetail");
    const oBillingDoc = this.byId("fragBillingDocument--dpBillingDoc") as DatePicker;
    let errorsExist = false;

  }

  private _addMessage(message: ValidationMessage): void {
    const oMessageModel = this.getView().getModel("appMessages") as JSONModel;
    const messages = oMessageModel.getProperty("/messages") as MessageType[];

    messages.push(message);
    oMessageModel.refresh(true);
  }

  private _initMessageControls = (): void => {
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

    this.byId("btnItemMessages").addDependent(this._oMessagePopover);
    this.getView().setModel(new JSONModel({ messages: [] }), "appMessages");

  }

  private _formatConditionTypes = async (aConditions: PricingElement[], isItem: boolean = false, index: number = 0): Promise<void> => {

    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oSalesOrderItemModel = this.getView()?.getModel("itemDetail") as JSONModel;
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
      oSalesOrderItemModel.setProperty("/to_PricingElement", aConditions ?? []);
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

  private async _getBillingStatusText(sStatus: string): Promise<string> {
    const oResourceModel = this.getOwnerComponent()!.getModel("i18n") as ResourceModel;

    const oResourceBundle = await oResourceModel.getResourceBundle();

    const mStatusKeys: Record<string, string> = {
      "": "billingStatusNotRelevant",
      A: "billingStatusA",
      B: "billingStatusB",
      C: "billingStatusC",
      D: "billingStatusD",
      E: "billingStatusE"
    };

    const sKey = mStatusKeys[sStatus.trim()];

    return sKey ? oResourceBundle.getText(sKey) : sStatus;
  }
}