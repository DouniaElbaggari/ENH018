import BaseController from "./BaseController";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessagePopover from "sap/m/MessagePopover";
import MessageItem from "sap/m/MessageItem";
import type { Message as ValidationMessage, InvoiceItem, SalesOrderItem } from "../model/types";
import MessageBox from "sap/m/MessageBox";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import type Event from "sap/ui/base/Event";
import type Context from "sap/ui/model/odata/v4/Context";
import type ODataListBinding from "sap/ui/model/odata/v4/ODataListBinding";
import type V2 from "sap/ui/model/odata/v2/ODataModel";
import formatter from "../utils/Formatter";
import type Table from "sap/m/Table";
import { ValueHelpRegistry } from "../utils/ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../utils/valueHelpConfigs";
import { BillingDocumentList } from "../model/types";
import Dialog from "sap/m/Dialog";
import type SegmentedButton from "sap/m/SegmentedButton";
import type Input from "sap/m/Input";
import MessageToast from "sap/m/MessageToast";
import { getProperty } from "ajv/dist/compile/codegen";

const conditions = {
  ZA00: { type: "Percentage", operation: "Add / Subtract" },
  ZA01: { type: "Value", operation: "Add / Subtract" },
  ZC00: { type: "Percentage", operation: "Add" },
  ZC01: { type: "Value", operation: "Add" },
  ZD00: { type: "Percentage", operation: "Subtract" },
  ZD01: { type: "Value", operation: "Subtract" },
};

interface ConditionRow {
  SalesOrder: string;
  SalesOrderItem: string;
  ConditionType: string;
  ConditionValue: string;
  ConditionCurrency: string;
}

/**
 * @namespace com.eiffage.sdt.controller
 */
export default class InvoiceByItem extends BaseController {
  public formatter = formatter;
  private _valueHelpRegistry!: ValueHelpRegistry;
  private _oMessagePopover!: MessagePopover;
  private _multiInvoiceDialog?: Dialog;
  private readonly multiInvoiceFragmentId = "multiInvoiceSelection";
  private _invoiceTotal = 0;

  public onInit = (): void => {
    const oInvoiceAmountsModelTmp = new JSONModel({
      items: [],
    });

    const oInvoiceAmountsModel = new JSONModel({
      PeriodAmount: 0.0,
      PeriodPercentage: 0,
      PreviousAmount: 0.0,
      PreviousPercentage: 0,
      CumulativeAmount: 0.0,
      CumulativePercentage: 0,
    });

    this._oMessagePopover = new MessagePopover({
      items: {
        path: "appMessages>/messages",
        template: new MessageItem({
          type: "{appMessages>type}",
          title: "{appMessages>title}",
          description: "{appMessages>description}",
          subtitle: "{appMessages>subtitle}",
        }),
      },
    });

    this.getView().setModel(new JSONModel({ messages: [] }), "appMessages");
    this.byId("messagePopoverButton").addDependent(this._oMessagePopover);
    this.getOwnerComponent()?.setModel(oInvoiceAmountsModel, "itemInvoiceTrackingData");
    this.getView()?.setModel(oInvoiceAmountsModelTmp, "itemInvoiceTrackingDataTmp");
    this.getRouter().getRoute("CreateInvoiceByItem")?.attachPatternMatched(this._onPatternMatched, this);
    this.getPage("pageItemInvoice").setShowFooter(true);
  };

  public onShowMessages = (oEvent: Event): void => {
    this._oMessagePopover.toggle(oEvent.getSource());
  };

  public onValidate = (oEvent: Event): void => { };

  public onInvoice = async (): Promise<void> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    oViewModel.setProperty("/isProForma", false);
    this._prepareInvoice();
  };

  public onProForma = (oEvent: Event): void => {
    const oViewModel = this.getModel("viewModel");

    oViewModel.setProperty("/isProForma", true);
    this._prepareInvoice();
  };

  public onPreview = (oEvent: Event): void => { };

  public onRowSelectionChange = async (oEvent: Event): Promise<void> => {
    let oInvoiceItemModel = this.getModel("invoiceItem");
    let oSalesOrderModel = this.getModel("salesOrder");
    let aItems = oInvoiceItemModel.getProperty("/items") as InvoiceItem[] || [];
    const oListItem = oEvent.getParameter("listItem");
    const sPath = oListItem.getBindingContext("salesOrder").sPath;
    const oSalesOrderItem = this.getModel("salesOrder").getProperty(sPath);
    const bSelected = oEvent.getParameter("selected");
    const bSelectAll = oEvent.getParameter("selectAll");
    const aListItems = oEvent.getParameter("listItems");
    let aConditions = [];

    //All items selected
    if (bSelectAll) {
      const aSalesOrderItems = oSalesOrderModel.getProperty("/to_Item");
      aSalesOrderItems.forEach(async (item) => {
        let {
          SalesOrder,
          SalesOrderItem,
          Material,
          SalesOrderItemText,
          QtyBalance,
          Balance,
          NetAmount,
          TaxAmount,
          RequestedQuantity,
          InvoiceQuantity,
          InvoiceAmount,
          InvoiceTaxAmount,
          MatlAccountAssignmentGroup
        } = item;
        const exists: boolean = aItems.some(
          (i) => i.SalesOrderItem === item.SalesOrderItem,
        );

        if (!exists) {
          if (Number(item.RequestedQuantity) === 1) {
            InvoiceQuantity = 1;
          } else {
            InvoiceQuantity = "";
          }

          const aItem = {
            SalesOrder,
            SalesOrderItem,
            Material,
            SalesOrderItemText,
            QtyBalance,
            Balance,
            NetAmount,
            TaxAmount,
            RequestedQuantity,
            InvoiceQuantity,
            InvoiceAmount,
            InvoiceTaxAmount,
            MatlAccountAssignmentGroup
          };
          aItems.push(aItem);
        }
      });
      // All items unselected
    } else if (!bSelectAll && aListItems.length > 1) {
      //oInvoiceItemModel.setProperty("/items", []);
      aItems = [];
      // Single Item selected
    } else if (bSelected) {
      let {
        SalesOrder,
        SalesOrderItem,
        Material,
        SalesOrderItemText,
        QtyBalance,
        Balance,
        NetAmount,
        TaxAmount,
        RequestedQuantity,
        InvoiceQuantity,
        InvoiceAmount,
        InvoiceTaxAmount,
        MatlAccountAssignmentGroup
      } = oSalesOrderItem;
      // Check to see if the item has already been added
      if (aItems.length > 0 && bSelected) {
        const exists: boolean = aItems.some(
          (item) => item.SalesOrderItem === SalesOrderItem,
        );

        if (exists) {
          MessageBox.error("Item already added");
          return;
        }
      }
      //Add an item

      if (Number(RequestedQuantity) === 1) {
        InvoiceQuantity = 1;
      }
      const aItem = {
        SalesOrder,
        SalesOrderItem,
        Material,
        SalesOrderItemText,
        QtyBalance,
        Balance,
        NetAmount,
        TaxAmount,
        RequestedQuantity,
        InvoiceQuantity,
        InvoiceAmount,
        InvoiceTaxAmount,
        MatlAccountAssignmentGroup
      };

      //aItem.Percentage = ( aItem.InvoiceAmount / NetAmount ) * 100;
      aItems.push(aItem);

      // Single Item unselected
    } else {
      //const nIndex = Number(sPath.split("/").pop());
      //aItems.splice(nIndex, 1);

      const index = aItems.findIndex(
        (item) => item.SalesOrderItem === oSalesOrderItem.SalesOrderItem,
      );

      if (index !== -1) {
        aItems.splice(index, 1);
        //oInvoiceItemModel.setProperty("/items", aItems);
      }
    }
    oInvoiceItemModel.setProperty("/items", aItems);
    //oInvoiceItemModel.refresh();
  };

  public onAmountChange = async (oEvent: Event): void => {
    const oInvoiceItemModel = this.getModel("invoiceItem") as JSONModel;
    const sPath = oEvent.getSource().getBindingContext("invoiceItem").sPath;
    const oItem = oInvoiceItemModel.getProperty(sPath);
    const oSource = oEvent.getSource() as Input;
    const nNewAmount = oEvent.getParameter("newValue");
    const nBalance = oEvent.getSource().getBindingContext("invoiceItem").getObject().Balance;
    const oInvoiceAmountsModel = this.getView()?.getModel("itemInvoiceTrackingData") as JSONModel;
    const oInvoiceAmount = oInvoiceAmountsModel?.getData();

    if (Number(nNewAmount) > 0) {
      if (nNewAmount > nBalance) {
        oSource.setValueState("Error");
        oSource.setValueStateText("Amount exceeds oustanding balance");
        return;
      }
    } else if ((nNewAmount < 0)) {
      if (Number(nNewAmount) < nBalance) {
        oSource.setValueState("Error");
        oSource.setValueStateText("Amount exceeds oustanding balance");
        return;
      }
    }

    oSource.setValueState("None");
    const percentageRaw = (nNewAmount / oItem.NetAmount) * 100;
    oItem.Percentage = Math.round(percentageRaw * 100) / 100;
    oItem.InvoiceTaxAmount = (oItem.Percentage / 100) * oItem.TaxAmount;
   
    
    const oCalculatedInvoiceAmounts = await this._calculateInvoiceAmounts(
      oItem.SalesOrder,
      oItem.SalesOrderItem,
      oItem.InvoiceAmount,
      Number(oItem.NetAmount),
    );

     oItem.PeriodAmount = oCalculatedInvoiceAmounts.PeriodAmount;
     oItem.PeriodPercentage = oCalculatedInvoiceAmounts.PeriodPercentage;

     oInvoiceItemModel.setProperty(sPath, oItem);

    this._calculateAmounts(oCalculatedInvoiceAmounts);
    this._calculateWithheldAmounts(oInvoiceItemModel.getProperty("/items"));

  };

  public onQuantityChange = async (oEvent: Event): void => {
    const oInvoiceItemModel = this.getModel("invoiceItem");
    const sPath = oEvent.getSource().getBindingContext("invoiceItem").sPath;
    const oItem = oInvoiceItemModel.getProperty(sPath);
    const oSource = oEvent.getSource();
    const nNewQuantity = oEvent.getParameter("newValue");
    const nQtyBalance = oEvent.getSource().getBindingContext("invoiceItem").getObject().QtyBalance;
    const oInvoiceAmountsModel = this.getView()?.getModel("itemInvoiceTrackingData") as JSONModel;
    const oInvoiceAmount = oInvoiceAmountsModel?.getData();

    if (Number(nNewQuantity) > Number(nQtyBalance)) {
      oSource.setValueState("Error");
      oSource.setValueStateText("Quantity exceeds requested quantity");
      return;
    } else {
      oSource.setValueState("None");
      oItem.InvoiceAmount =
        (oItem.NetAmount / oItem.RequestedQuantity) * nNewQuantity;
      oItem.Percentage = (oItem.InvoiceAmount / oItem.NetAmount) * 100;
      oItem.InvoiceTaxAmount = (oItem.Percentage / 100) * oItem.TaxAmount;
      oInvoiceItemModel.setProperty(sPath, oItem);
      const oCalculatedInvoiceAmounts = await this._calculateInvoiceAmounts(
        oItem.SalesOrder,
        oItem.SalesOrderItem,
        oItem.InvoiceAmount,
        Number(oItem.NetAmount),
      );

      this._calculateAmounts(oCalculatedInvoiceAmounts);
      this._calculateWithheldAmounts(oInvoiceItemModel.getProperty("/items"));
    }
  };

  public onPriceRevision = (oEvent: Event): void => {
    const conditions = {
      PERCENT: { type: "ZA00", operation: "Add / Subtract" },
      AMOUNT: { type: "ZA01", operation: "Add / Subtract" },
    };

    const oSource = oEvent.getSource();
    const oSegButton = this.byId("sbPriceRevision") as SegmentedButton;
    const oSelectedKey = oSegButton.getSelectedKey();
    const nValue = oEvent.getParameter("value");
    const condition = conditions[oSelectedKey];

    oSource.setValueState("None");

    if (oSelectedKey === "PERCENT" && Number(nValue) > 100.0) {
      oSource.setValueState("Error");
      MessageBox.error("Value cannot exceed 100%");
      return;
    }
  };

  public onProRata = (oEvent: Event): void => {
    const conditions = {
      PERCENT: { type: "ZA05", operation: "Add" },
      AMOUNT: { type: "ZA06", operation: "Add" },
    };

    const oSource = oEvent.getSource();
    const nValue = oEvent.getParameter("value");

    oSource.setValueState("None");

    if (Number(nValue) > 100.0) {
      oSource.setValueState("Error");
      MessageBox.error("Value cannot exceed 100%");
      return;
    }
  };
  public onMajoration = (oEvent: Event): void => {
    const conditions = {
      PERCENT: { type: "ZC00", operation: "Add" },
      AMOUNT: { type: "ZC01", operation: "Add" },
    };

    const oSource = oEvent.getSource();
    const oSegButton = this.byId("sbMajoration") as SegmentedButton;
    const oSelectedKey = oSegButton.getSelectedKey();
    const nValue = oEvent.getParameter("value");

    oSource.setValueState("None");

    if (oSelectedKey === "PERCENT" && Number(nValue) > 100.0) {
      oSource.setValueState("Error");
      MessageBox.error("Value cannot exceed 100%");
      return;
    }
  };

  public onRemise = (oEvent: Event): void => {
    const conditions = {
      PERCENT: { type: "ZD00", operation: "Subtract" },
      AMOUNT: { type: "ZD01", operation: "Subtract" },
    };

    const oSource = oEvent.getSource();
    const oSegButton = this.byId("sbRemise") as SegmentedButton;
    const oSelectedKey = oSegButton.getSelectedKey();
    const nValue = oEvent.getParameter("value");

    oSource.setValueState("None");

    if (oSelectedKey === "PERCENT" && Number(nValue) > 100.0) {
      oSource.setValueState("Error");
      MessageBox.error("Value cannot exceed 100%");
      return;
    }
  };

  public onCalculateConditions = (oEvent: Event): void => {
    const oSalesOrderModel = this.getModel("salesOrder");
    const sSalesOrder = oSalesOrderModel.getProperty("/SalesOrder")
    let oInvoiceItemModel = this.getModel("invoiceItem");
    let aItems = oInvoiceItemModel.getProperty("/items") as InvoiceItem[] || [];

    this._invoiceTotal = 0;

    aItems.forEach((item) => this._invoiceTotal += Number(item.InvoiceAmount));

    aItems.forEach((item) => {
      item.BillingRequestItemCondition = this._calculateConditions(sSalesOrder, item.SalesOrderItem, item.InvoiceAmount, this._invoiceTotal);
    })

    MessageToast.show("Conditions calculated successfully.");
  }

  private async _onPatternMatched(oEvent: Event): Promise<void> {
    const oSOItemTable = this.byId("tableSOItems") as Table;
    const oArgs = oEvent.getParameter("arguments") as { salesOrder: string };
    const sSalesOrder = oArgs.SalesOrder;
    const oModel = this.getModel("salesOrder") as JSONModel;
    const oData = oModel.getData();
    let aItems = oModel.getProperty("/to_Item");
    const oInvoiceItemModel = this.getModel("invoiceItem") as JSONModel;
    const oInvoiceAmountsModel = this.getView()?.getModel("itemInvoiceTrackingData") as JSONModel;
    const oInvoiceWitholdingModel = this.getModel("invoiceWitholding") as JSONModel;
    this.getView().getModel("appMessages").setProperty("/messages", []);

    oInvoiceWitholdingModel.setData({
      Description1: oData.ZZ1_LibellRetenue_SDH,
      Description2: oData.ZZ1_LibellRetenue2_SDH,
      Description3: oData.ZZ1_LibellRetenue3_SDH,
      Percentage1: oData.ZZ1_Pourcentage1_SDH,
      Percentage2: oData.ZZ1_Pourcentage2_SDH,
      Percentage3: oData.ZZ1_Pourcentage3_SDH,
      Amount1: 0,
      Amount2: 0,
      Amount3: 0,
      InvoicedAmount1: oData.ZZ1_Mntretenuefact1_SDH,
      InvoicedAmount2: oData.ZZ1_Mntretenuefact2_SDH,
      InvoicedAmount3: oData.ZZ1_Mntretenuefact3_SDH,
      DepositAmount1: oData.ZZ1_MontantCaution1_SDH,
      DepositAmount2: oData.ZZ1_MontantCaution2_SDH,
      DepositAmount3: oData.ZZ1_MontantCaution3_SDH
    });

    oInvoiceItemModel.setProperty("/items", []);

    oSOItemTable.removeSelections();

    oInvoiceAmountsModel.setData({
      PeriodAmount: 0.0,
      PeriodPercentage: 0,
      PreviousAmount: 0.0,
      PreviousPercentage: 0,
      CumulativeAmount: 0.0,
      CumulativePercentage: 0,
    });

    interface SalesOrderItem {
      SalesOrder: string;
      SalesOrderItem: string;
      NetAmount?: number | string | null;
      RequestedQuantity?: number | string | null;
      Balance?: number;
      QtyBalance?: number;
    }

    interface DocFlowTotals {
      amount: number;
      quantity: number;
    }

    interface DocFlowTotals {
      amount: number;
      quantity: number;
    }

    await Promise.all(
      aItems.map(
        async (item: SalesOrderItem): Promise<void> => {
          const aSalesOrderDocFlow = await this._getSalesOrderDocFlow(
            item.SalesOrder,
            item.SalesOrderItem,
          );

          const oTotals = aSalesOrderDocFlow.reduce<DocFlowTotals>(
            (totals, flowItem) => {
              totals.amount += Number(flowItem.Amount ?? 0);
              totals.quantity += Number(flowItem.Quantity ?? 0);
              return totals;
            },
            { amount: 0, quantity: 0 },
          );

          item.Balance = Number(item.NetAmount ?? 0) - oTotals.amount;
          if (item.RequestedQuantity > 1) {
            item.QtyBalance =
              Number(item.RequestedQuantity ?? 0) - oTotals.quantity;
          } else {
            item.QtyBalance = 1;
          }
        },
      ),
    );

    oModel.setProperty("/to_Item", aItems);

    //const aSalesOrderDocFlow = await this._getSalesOrderDocFlow(SalesOrder, SalesOrderItem);
    //let modelData = oModel.getData();
  }

  private _getSalesOrderDocFlow = async (SalesOrder: string, SalesOrderItem: String): Promise<object[]> => {
    const oDocFlowModel = this.getModel("salesOrderDocFlow");
    const aFilters: Filter[] = [];

    aFilters.push(
      new Filter({
        filters: [
          new Filter({
            path: "PrecedingDocument",
            operator: FilterOperator.EQ,
            value1: SalesOrder,
          }),
          new Filter({
            path: "PrecedingDocumentItem",
            operator: FilterOperator.EQ,
            value1: SalesOrderItem,
          }),
          new Filter({
            path: "SubsequentDocumentCategory",
            operator: FilterOperator.EQ,
            value1: "M",
          }),
        ],
        and: true,
      }),
    );

    const oListBinding = oDocFlowModel.bindList(
      "/ZC_SalesOrderItemFlow",
    ) as ODataListBinding;

    oListBinding.filter(aFilters);

    const aContexts: Context[] = await oListBinding.requestContexts(0, 100);

    const aDocumentFlow = aContexts.map((oContext) => oContext.getObject());
    return aDocumentFlow;
  };

  private _simulateBillingDoc = async (): Promise<object> => {
    const oBillingDocModel = this.getModel("billingDoc") as V2;
    const oItemInvoiceModel = this.getModel("invoiceItem") as JSONModel;
    const sSalesOrder = this.getModel("salesOrder").getProperty("/SalesOrder");
    const aInvoiceItems = oItemInvoiceModel.getProperty("/items");
    const sUrl = "/SimulateBillingRequestSet";

    let oPayload = {
      SalesOrder: sSalesOrder,
      TestMode: true,
      Items: [] as {
        SalesOrder: string;
        SalesOrderItem: string;
        RequestedQuantity: string;
      }[],
      Messages: [],
      Success: [],
    };

    aInvoiceItems.forEach((item: any) => {
      oPayload.Items.push({
        SalesOrder: sSalesOrder,
        SalesOrderItem: item.SalesOrderItem,
        RequestedQuantity: "1",
      });
    });

    return new Promise((resolve, reject) => {
      oBillingDocModel.create(sUrl, oPayload, {
        success: (oData: object) => resolve(oData),
        error: (error: object) => reject(error),
      });
    });
  };

  private _calculateInvoiceAmounts = async (
    salesOrder: string,
    salesOrderItem: string,
    amount: number,
    grossAmount: number,
  ): Promise<object> => {
    const oBillingDocModel = this.getModel("billingDoc") as V2;
    const sUrl = `/CalculateInvoiceAmountsSet(SalesOrder='${salesOrder}',SalesOrderItem='${salesOrderItem}',Amount=${amount},GrossAmount=${grossAmount})`;

    return new Promise((resolve, reject) => {
      oBillingDocModel.read(sUrl, {
        success: (response: object) => {
          resolve(response);
        },
        error: (error: object) => {
          reject(error);
        },
      });
    });
  };

  private _calculateAmounts = (amounts: object): void => {
    const oInvoiceAmountsModel = this.getView()?.getModel("itemInvoiceTrackingData") as JSONModel;
    const oCalculateAmountsModel = this.getModel("calculatedAmounts") as JSONModel;
    const nTotalAmount = oCalculateAmountsModel.getProperty("/TotalAmount");
    const oInvoiceAmountsModelTmp = this.getView()?.getModel("itemInvoiceTrackingDataTmp") as JSONModel;
    let aItems = oInvoiceAmountsModelTmp?.getProperty("/items");
    const {
      Amount,
      CumulativeAmount,
      CumulativePercentage,
      GrossAmount,
      PeriodAmount,
      PeriodPercentage,
      PreviousAmount,
      PreviousPercentage,
      SalesOrder,
      SalesOrderItem,
    } = amounts;

    const newItem = {
      Amount,
      CumulativeAmount,
      CumulativePercentage,
      GrossAmount,
      PeriodAmount,
      PeriodPercentage,
      PreviousAmount,
      PreviousPercentage,
      SalesOrder,
      SalesOrderItem,
    };

    const existingIndex = aItems.findIndex((item) => item.SalesOrder === SalesOrder && item.SalesOrderItem === SalesOrderItem);

    if (existingIndex >= 0) {
      aItems[existingIndex] = newItem;
    } else {
      aItems.push(newItem);
    }

    const totals = aItems.reduce(
      (accumulator, item) => {
        accumulator.CumulativeAmount += Number(item.CumulativeAmount ?? 0);
        accumulator.PeriodAmount += Number(item.PeriodAmount ?? 0);
        accumulator.PreviousAmount += Number(item.PreviousAmount ?? 0);
        return accumulator;
      },
      {
        CumulativeAmount: 0,
        PeriodAmount: 0,
        PreviousAmount: 0,
      },
    );

    const toPercentage = (value, total) => total === 0 ? 0 : Number(((value / total) * 100).toFixed(2));

    totals.CumulativePercentage = toPercentage(totals.CumulativeAmount,nTotalAmount);
    totals.PeriodPercentage = toPercentage(totals.PeriodAmount, nTotalAmount);
    totals.PreviousPercentage = toPercentage(totals.PreviousAmount, nTotalAmount);

    oInvoiceAmountsModel.setData(totals);
  };

  private _prepareInvoice = async (): Promise<void> => {
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const aItems = oSalesOrderModel.getProperty("/to_Item");
    const oItemInvoiceModel = this.getModel("invoiceItem") as JSONModel;
    const oBillingDocModel = this.getModel("billingDocDisp") as JSONModel;
    const aInvoiceItems = oItemInvoiceModel.getProperty("/items");
    const oBillindDocList = this.getModel("billingDocList") as JSONModel;
    const oBillindDocListRaw = this.getModel("billingDocListRaw") as JSONModel;
    let aItemRaw = oBillindDocListRaw.getProperty("/items");
    let results = {};

    if (aInvoiceItems.length === 0) {
      MessageBox.error("Select at least on Sales Order Item to Invoice");
      return;
    }

    aItemRaw = [];
    let bErrorExists = false;
    let previousBillingDocument;
    let items: BillingDocumentList[] = [];

    aInvoiceItems.forEach((item: any) => {
      if (Number(item.RequestedQuantity) === 1 && (item.InvoiceAmount === undefined || Number(item.InvoiceAmount) === 0)) {
        bErrorExists = true;
      } else if (item.InvoiceQuantity === "" || item.InvoiceQuantity === undefined) {
        bErrorExists = true;
      }
    });

    if (bErrorExists) {
      MessageBox.error("Please ensure all values / amounts are entered for all lines to be invoiced");
      return;
    }

    //Copy Sales Data model to Billing Data Model
    oBillingDocModel.setData({ ...oSalesOrderModel.getData() });

    this.getView().setBusy(true);

    //Simulate billing doc to check whether a doc split is required
    try {
      results = await this._simulateBillingDoc();

      const aErrors = results.Messages.results.filter((message) => message.MessageType === "E");

      if (aErrors.length > 0) {
        const aUiMessages = aErrors.map((oMsg) => ({
          type: "Error",
          title: oMsg.Message || oMsg.MessageText || "",
          description: [oMsg.MessageId, oMsg.MessageNumber].filter(Boolean).join(" / "),
          subtitle: oMsg.SalesOrder || "",
        }));

        this.getView().getModel("appMessages").setProperty("/messages", aUiMessages);
        this.getView()?.setBusy(false);
        return;
      }

      //if Success array is empty then the document cannot be invoiced
      if (results.Success.results.length === 0) {
        const aInfo = results.Messages.results.filter((message) => message.MessageType === "I");

        if (aErrors.length > 0) {
          MessageBox.error(aErrors[0].Message);
          this.getView().setBusy(false);
          return;
        }

        if (aInfo.length > 0) {
          MessageBox.information(aInfo[0].Message);
          this.getView().setBusy(false);
          return;
        }
      }
    } catch (error) {
      MessageBox.error(error.message);
      return;
    } finally {
      this.getView().setBusy(false);
    }

    const aBillingDocItems: SalesOrderItem[] = aInvoiceItems.flatMap(
      (inItem: SalesOrderItem) => aItems.filter((item: SalesOrderItem) => item.SalesOrderItem === inItem.SalesOrderItem));

    const updatedItems = this._updatePricingCondition(aBillingDocItems);

    oBillingDocModel.setProperty("/to_Item", updatedItems);

    for (const item of results?.Success.results) {
      const itemRaw = {
        BillingDocument: item.BillingDocument, //Temp document IE: $00000000001
        ReferenceDocument: item.ReferenceDocument, //Sales Order
        ReferenceDocumentItem: item.ReferenceDocumentItem, //Sales Order Item
      };

      aItemRaw.push(itemRaw);

      if (item.BillingDocument !== previousBillingDocument) {
        const netValue = Number.parseFloat(item.NetValue) || 0;
        const taxValue = Number.parseFloat(item.TaxValue) || 0;

        item.TotalAmount = netValue + taxValue;
        item.Invoiced = false;
        items.push(item);
        previousBillingDocument = item.BillingDocument;
      }
    }

    oBillindDocListRaw.setProperty("/items", aItemRaw);
    oBillindDocList.setProperty("/items", items);

    this.getView().setBusy(false);

    //oViewModel.setProperty("/notInvoiced", true);
    this.getRouter().navTo("CreateInvoice");
  };

  private _getMultiInvoiceDialog = async (): Promise<Dialog> => {
    if (!this._) {
      this._multiInvoiceDialog = (await Fragment.load({
        id: this.multiInvoiceFragmentId,
        name: "com.eiffage.sdt.view.invoice.fragment.MultipleInvoicesDialog",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._multiInvoiceDialog);
    }

    return this._multiInvoiceDialog;
  };

  private _calculateConditions = (SalesOrder: string, SalesOrderItem: string, ItemAmount: number, InvoiceTotal: number): ConditionRow[] => {
    const inRevPrix = this.byId("inRevPrix") as Input;
    const sbPriceRevision = this.byId("sbPriceRevision") as SegmentedButton;
    const inProRata = this.byId("inProRata") as Input;
    const inMajoration = this.byId("inMajoration") as Input;
    const sbMajoration = this.byId("sbMajoration") as SegmentedButton;
    const inRemise = this.byId("inRemise") as Input;
    const sbRemise = this.byId("sbRemise") as SegmentedButton;

    const nRevPrix = inRevPrix.getValue();
    const sRevPrixKey = sbPriceRevision.getSelectedKey();
    const nProRate = inProRata.getValue();
    const nMajoration = inMajoration.getValue();
    const sMajorationKey = sbMajoration.getSelectedKey();
    const nRemise = inRemise.getValue();
    const sRemiseKey = sbRemise.getSelectedKey();

    let nPercentage = 0;
    let nCalculatedValue = 0;
    let nRatio = 0;

    let BillingRequestItemCondition: ConditionRow[] = [];

    if (nRevPrix !== "") {
      if (sRevPrixKey === "AMOUNT") {
        nRatio = Number(ItemAmount) / InvoiceTotal;
        nPercentage = Math.round(nRatio * 100 * 100) / 100;
        nCalculatedValue = Math.round(Number(nRevPrix) * nRatio * 100) / 100;

        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZA01",
          ConditionValue: nCalculatedValue.toString(),
          ConditionCurrency: "EUR",
        });
      } else {
        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZA00",
          ConditionValue: nRevPrix,
          ConditionCurrency: "",
        });
      }
    }
    if (nProRate !== "") {
      BillingRequestItemCondition.push({
        SalesOrder,
        SalesOrderItem,
        ConditionType: "ZA05",
        ConditionValue: nProRate,
        ConditionCurrency: "",
      });
    }
    if (nMajoration !== "") {
      if (sMajorationKey === "AMOUNT") {

        nRatio = Number(ItemAmount) / InvoiceTotal;
        nPercentage = Math.round(nRatio * 100 * 100) / 100;
        nCalculatedValue = Math.round(Number(nMajoration) * nRatio * 100) / 100;

        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZC01",
          ConditionValue: nCalculatedValue.toString(),
          ConditionCurrency: "EUR",
        });
      } else {
        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZC00",
          ConditionValue: nMajoration,
          ConditionCurrency: "",
        });
      }
    }
    if (nRemise !== "") {
      if (sRemiseKey === "AMOUNT") {

        nRatio = Number(ItemAmount) / InvoiceTotal;
        nPercentage = Math.round(nRatio * 100 * 100) / 100;
        nCalculatedValue = Math.round(Number(nRemise) * nRatio * 100) / 100;

        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZD01",
          ConditionValue: nCalculatedValue.toString(),
          ConditionCurrency: "EUR",
        });
      } else {
        BillingRequestItemCondition.push({
          SalesOrder,
          SalesOrderItem,
          ConditionType: "ZD00",
          ConditionValue: nRemise,
          ConditionCurrency: "",
        });
      }
    }

    return BillingRequestItemCondition;
  };

  private _updatePricingCondition = (items: SalesOrderItem[]): SalesOrderItem[] => {
    const oInvoiceItemModel = this.getModel("invoiceItem") as JSONModel;
    const aItems = oInvoiceItemModel.getProperty("/items");
    const key = (so: string, item: string, type: string) => `${so}|${item}|${type}`;

    const conditionMap = new Map(aItems.flatMap(i => i.BillingRequestItemCondition ?? []).map(c => [key(c.SalesOrder, c.SalesOrderItem, c.ConditionType), c] as const));

    items.forEach(soItem => {
      soItem.to_PricingElement.forEach(pe => {
        const cond = conditionMap.get(key(pe.SalesOrder, pe.SalesOrderItem, pe.ConditionType));
        if (!cond) return;
        pe.ConditionRateValue = cond.ConditionValue;
        pe.ConditionCurrency = cond.ConditionCurrency || pe.ConditionCurrency;
        pe.ConditionIsManuallyChanged = true;
      });
    });
    return items;
  }

  //Need to refactor into one single reuseable file
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

  //Needs to refactor into one single reuseable file
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

  private _calculateWithheldAmounts = (items: []): void => {
    const oInvoiceWitholdingModel = this.getModel("invoiceWitholding") as JSONModel;
    let aInvoiceWitholding = oInvoiceWitholdingModel.getData();
    const oSalesOrderModel = this.getModel("salesOrder");
    const aSOItems = oSalesOrderModel.getProperty("/to_Item");
    const conditionTypes: string[] = ["PR00", "ZFAL"];
    // Refactor this to a service in the backend!
    const excludedValues: string[] = ["26", "29", "35", "Z1", "Z2", "ZA", "ZB", "ZC"];
    let nAmount1 = 0;
    let nAmount2 = 0;
    let nAmount3 = 0;

    items.forEach((item) => {

      if (excludedValues.includes(item.MatlAccountAssignmentGroup)) return;

      if (item.TaxAmount != null && item.InvoiceAmount != null && item.TaxAmount !== 0 && item.InvoiceAmount !== 0) {
        const soItem = aSOItems.find((soI) => soI.SalesOrder === item.SalesOrder && soI.SalesOrderItem === item.SalesOrderItem);
        const aPR00 = soItem.to_PricingElement.find((e) => conditionTypes.includes(e.ConditionType) && e.ConditionInactiveReason === '');
        const nPercentage = Math.round(((aPR00.ConditionAmount / item.NetAmount) * 100) * 100) / 100;
        const nTaxRate = (item.TaxAmount / item.NetAmount) * 100;
        const nNetAmount = Math.round((item.InvoiceAmount * (nPercentage / 100)) * 100) / 100;
        const nTax = Math.round(nNetAmount * (nTaxRate / 100) * 100) / 100;
        const nGrossAmount = Math.round((nNetAmount + nTax) * 100) / 100;
        const nPercentage1 = nGrossAmount * aInvoiceWitholding.Percentage1 / 100.
        nAmount1 += nPercentage1;
        const nPercentage2 = nGrossAmount * aInvoiceWitholding.Percentage2 / 100.
        nAmount2 += nPercentage2;
        const nPercentage3 = nGrossAmount * aInvoiceWitholding.Percentage3 / 100.
        nAmount3 += nPercentage3;
      }
    });

    aInvoiceWitholding.Amount1 = Math.round(nAmount1 * 100) / 100;
    aInvoiceWitholding.Amount2 = Math.round(nAmount2 * 100) / 100;
    aInvoiceWitholding.Amount3 = Math.round(nAmount3 * 100) / 100;

    oInvoiceWitholdingModel.setData(aInvoiceWitholding);

  };
};
