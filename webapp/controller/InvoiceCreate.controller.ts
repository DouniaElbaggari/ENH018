import BaseController from "./BaseController";
import type { SalesOrderItem, InvoiceItem, BillingDocCreate } from "../model/types";
import MessageBox from "sap/m/MessageBox";
import formatter from "../utils/Formatter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Event from "sap/ui/base/Event";
import HBox from "sap/m/HBox";
import Text from "sap/m/Text";
import Link from "sap/m/Link";
import MessagePopover from "sap/m/MessagePopover";
import MessageItem from "sap/m/MessageItem";

/**
 * @namespace com.eiffage.sdt.controller
 */

type InvoicePageHeader = {
  BillingDocument: string;
  Payer: string;
  PayerName: string;
  SoldToParty: string;
  SoldToPartyName: string;
  BillingDocStatus: string;
  NetAmount: number;
  TaxAmount: number;
  State: string;
  Currency: string;
  Status: string;
};

export default class InvoiceCreate extends BaseController {
  public formatter = formatter;
  private _oMessagePopover!: MessagePopover;


  public async onInit(): Promise<void> {
    this.getRouter().getRoute("CreateInvoice")?.attachPatternMatched(this._onRouteMatched, this);

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

    this.getView().setModel(new JSONModel({ messages: [] }), "appMessages");
    this.byId("messagePopoverButtonInvoice").addDependent(this._oMessagePopover);
  }

  public onListItemPress = (oEvent: Event) => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oInvoicePageHeaderModel = this.getView().getModel("invoicePageHeader") as JSONModel;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const aItems = oSalesOrderModel.getProperty("/to_Item");
    const oBillingDocModel = this.getModel("billingDocDisp") as JSONModel;
    const aBillingDocItems = oBillingDocModel.getProperty("/to_Item");
    const sPath = oEvent.getSource().getBindingContext("billingDocList").sPath;
    const billingDocInfo = this.getModel("billingDocList").getProperty(sPath);
    const oBillindDocListRaw = this.getModel("billingDocListRaw") as JSONModel;
    const aBillingDocItemsRaw = oBillindDocListRaw.getProperty("/items");
    const oInvoicePage = this.byId("invoiceInfo");
    const oToBeInvoiced = this.getView().getModel("invoiceItem") as JSONModel;
    const aToBeInvoiced = oToBeInvoiced.getProperty("/items");
    let nTotalNetAmount = 0;
    let nTotalTaxAmount = 0;
    let nTotalAmount = 0;

    oInvoicePage.setBusy(true);

    oViewModel.setProperty("/billingDocument", billingDocInfo.BillingDocument);
    oViewModel.setProperty("/notInvoiced", true);

    //const aBillingDocItems: SalesOrderItem[] = aItems.filter( (item: SalesOrderItem) => item.SalesOrderItem === billingDocInfo.SalesOrderItem)
    //oBillingDocModel.setProperty("/to_Item", aBillingDocItems);

    const aDocTotals = aBillingDocItemsRaw.filter((a) => a.BillingDocument === billingDocInfo.BillingDocument).flatMap((a) =>
      aToBeInvoiced.filter((b) => Number(a.ReferenceDocumentItem) === Number(b.SalesOrderItem)));

    const aInvoiceItems = aBillingDocItemsRaw.filter((a) => a.BillingDocument === billingDocInfo.BillingDocument)
      .flatMap((a) => aBillingDocItems.filter((b) => Number(a.ReferenceDocumentItem) === Number(b.SalesOrderItem)));

    oBillingDocModel.setProperty("/to_Item", aInvoiceItems);

    oInvoicePage.setBusy(false);

    aDocTotals.forEach((total) => {
      nTotalNetAmount += Number(total.InvoiceAmount);
      nTotalTaxAmount += Number(total.InvoiceTaxAmount);
    });

    nTotalAmount = nTotalNetAmount + nTotalTaxAmount;

    oInvoicePageHeaderModel.setProperty("/SoldToParty", oSalesOrderModel.getProperty("/SoldToParty"));
    oInvoicePageHeaderModel.setProperty("/BillingDocument", billingDocInfo.BillingDocument);
    oInvoicePageHeaderModel.setProperty("/TotalAmount", nTotalAmount.toFixed(2));
    oInvoicePageHeaderModel.setProperty("/TaxAmount", nTotalTaxAmount.toFixed(2),);
    oInvoicePageHeaderModel.setProperty("/NetAmount", nTotalNetAmount.toFixed(2));
  };

  public onSave = async (): Promise<void> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oInvoicePageHeaderData = this.getView()?.getModel("invoicePageHeader") as JSONModel;
    const sTempInvoiceNo = oViewModel.getProperty("/billingDocument");
    const oItemInvoiceModel = this.getModel("invoiceItem") as JSONModel;
    const aBillingDocItem = oItemInvoiceModel.getProperty("/items");
    const oBillindDocListRaw = this.getModel("billingDocListRaw");
    const oBillingDocList = this.getModel("billingDocList") as JSONModel;
    let aBillingDocItems = oBillingDocList.getProperty("/items");
    const aBillingDocItemsRaw = oBillindDocListRaw.getProperty("/items");
    const sBillingDocument = oViewModel.getProperty("/billingDocument");
    const oCrossAppNav = await sap.ushell.Container.getService("CrossApplicationNavigation");

    const aInvoiceItems = aBillingDocItemsRaw
      .filter((a) => a.BillingDocument === sBillingDocument)
      .flatMap((a) => aBillingDocItem.filter((b) => Number(a.ReferenceDocumentItem) === Number(b.SalesOrderItem)));

    try {

      this.getView()?.setBusy(true);
      const results = await this._createBillingDocument(aInvoiceItems);

      //Document created
      if (results.BillingDocument) {
        oInvoicePageHeaderData.setProperty("/BillingDocument", results.BillingDocument);
        oInvoicePageHeaderData.setProperty("/State", "Success");
        oInvoicePageHeaderData.setProperty("/Status", "Created");

        const oTempDoc = aBillingDocItems.find(
          (doc) => doc.BillingDocument === sBillingDocument,
        );

        //Temp document found, now update with newly created Invoice no.
        if (oTempDoc) {
          const iIndex = aBillingDocItems.indexOf(oTempDoc);

          oBillingDocList.setProperty(`/items/${iIndex}/BillingDocument`, results.BillingDocument);
          oBillingDocList.setProperty(`/items/${iIndex}/Status`, "Created");
          oBillingDocList.setProperty(`/items/${iIndex}/State`, "Success");

          oViewModel.setProperty("/notInvoiced", false);
          oViewModel.setProperty("/showInvoiceCrateBackButton", true);

          const sHref = oCrossAppNav.hrefForExternal({
            target: {
              semanticObject: "BillingDocument",
              action: "manage"
            },
            appSpecificRoute: `object/display/${encodeURIComponent(results.BillingDocument)}`
          });

          MessageBox.success(
            new HBox({
              alignItems: "Center",
              items: [
                new Text({ text: "Billing Document " }),
                new Link({ text: results.BillingDocument, href: sHref, target: "_blank" }).addStyleClass("sapUiTinyMarginBegin sapUiTinyMarginEnd"),
                new Text({ text: " successfully created" })
              ]
            }),
            {
              title: "Success",
              actions: [MessageBox.Action.OK],
              emphasizedAction: MessageBox.Action.OK
            }
          );
        }
      } else {
        const aErrors = results.Messages.results.filter((message) => message.MessageType === 'E');
        if (aErrors.length > 0) {
          MessageBox.error(aErrors[0].Message);
          this.getView()?.setBusy(false);
        }
      }

      this.getView()?.setBusy(false);
    } catch (error) {
      this.getView()?.setBusy(false);
      MessageBox.error(error.message);
    }
  };

  public onCancel = (): void => {
    MessageBox.confirm("Are you sure you want to cancel", {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      emphasizedAction: MessageBox.Action.OK,
      onClose: (sAction) => {
        if (sAction === "OK") {
          //this.getRouter().navTo("CreateInvoiceByItem")
          window.history.back();
        }
      },
      dependentOn: this.getView(),
    });
  };

  public onBack = (): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    oViewModel.setProperty("/showInvoiceCrateBackButton", false);
    oViewModel.setProperty("/notInvoiced", true);
    window.history.back();
  }

  public onItemPress = (oEvent: Event) => {
    const list = oEvent.getParameter("listItem");
    const sPath = list.getBindingContext("billingDocDisp")?.getPath();

    this.getRouter().navTo("CreateInvoiceItemDetail", {
      Path: encodeURIComponent(sPath),
    });
  };

  public onDeclareCreance = async (): Promise<void> => {
    const oCrossAppNav = await sap.ushell.Container.getService("CrossApplicationNavigation") ?? sap.ushell.Container.getServiceAsync("CrossApplicationNavigation");
    const sSalesOrder = this.getModel('salesOrder').getProperty("/SalesOrder");
    const sHash = await oCrossAppNav.hrefForExternalAsync({
      target: {
        semanticObject: "ZDeclarationCreance",
        action: "manage"
      },
      params: {
        Vbeln: sSalesOrder,
        Mode: "BILL"
      }
    });

    window.open(sHash, "_blank", "noopener");
  }

  private _onRouteMatched = () => {

    interface BillingDocumentTotal {
      BillingDocument: string;
      TotalNetAmount: number;
      TotalTaxAmount: number;
    }

    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oInvoicePageHeaderModel = new JSONModel();
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const aItems = oSalesOrderModel.getProperty("/to_Item");
    const oBillingDocModel = this.getModel("billingDocDisp") as JSONModel;
    const oBillindDocList = this.getModel("billingDocList") as JSONModel;
    const aDocList = oBillindDocList.getProperty("/items");
    const oBillindDocListRaw = this.getModel("billingDocListRaw");
    const aBillingDocItemsRaw = oBillindDocListRaw.getProperty("/items");
    const nDocCount = aDocList.length;
    const oToBeInvoiced = this.getView().getModel("invoiceItem");
    const aToBeInvoiced = oToBeInvoiced.getProperty("/items");
    let oSplitContainer = this.byId("pageCreateInvoice");
    let nTotalNetAmount = 0;
    let nTotalTaxAmount = 0;
    let nTotalAmount = 0;

    this.getView().getModel("appMessages").setProperty("/messages", []);
    this.byId("invoiceInfo").setShowFooter(true);
    this.byId("invoiceInfo").setFloatingFooter(true);

    oViewModel.setProperty("/billingDocument", aDocList[0]?.BillingDocument);

    const aDocTotals = aBillingDocItemsRaw
      .filter((a) => a.BillingDocument === aDocList[0]?.BillingDocument)
      .flatMap((a) => aToBeInvoiced.filter((b) => Number(a.ReferenceDocumentItem) === Number(b.SalesOrderItem)));

    aDocTotals.forEach((total) => {
      nTotalNetAmount += Number(total.InvoiceAmount);
      nTotalTaxAmount += Number(total.InvoiceTaxAmount);
    });

    nTotalAmount = nTotalNetAmount + nTotalTaxAmount;
    aDocList[0].TotalAmount = nTotalAmount;

    const mDocTotals = new Map<string, BillingDocumentTotal>();

    aBillingDocItemsRaw.forEach((docItem) => {
      const oItem = aToBeInvoiced.find((item) => item.SalesOrder === docItem.ReferenceDocument && Number(item.SalesOrderItem) === Number(docItem.ReferenceDocumentItem));
      if (!oItem) return;

      let oTotal = mDocTotals.get(docItem.BillingDocument);

      if (!oTotal) {
        oTotal = { BillingDocument: docItem.BillingDocument, TotalNetAmount: 0, TotalTaxAmount: 0 };
        mDocTotals.set(docItem.BillingDocument, oTotal);
      }

      oTotal.TotalNetAmount += Number(oItem.InvoiceAmount);
      oTotal.TotalTaxAmount += Number(oItem.InvoiceTaxAmount);
    });

    const aDocTotals2 = Array.from(mDocTotals.values());

    aDocList.forEach((doc) => {
      const oTotal = aDocTotals2.find((total) => total.BillingDocument === doc.BillingDocument);
      if (!oTotal) return;

      doc.NetValue = oTotal.TotalNetAmount.toFixed(4);
      doc.TaxValue = oTotal.TotalTaxAmount.toFixed(4);
      doc.TotalAmount = Number((oTotal.TotalNetAmount + oTotal.TotalTaxAmount).toFixed(2));
    });

    oBillindDocList.setProperty("/items", aDocList);
    //oBillingDocModel.setProperty("/item", aDocList);


    if (nDocCount > 1) {
      oSplitContainer.setMode("ShowHideMode");
      //Default 1st item un list if Billind Doc is split
      const aInvoiceItems = aBillingDocItemsRaw
        .filter((a) => a.BillingDocument === aDocList[0].BillingDocument)
        .flatMap((a) => aItems.filter((b) => Number(a.ReferenceDocumentItem) === Number(b.SalesOrderItem)));
      oBillingDocModel.setProperty("/to_Item", aInvoiceItems);
    } else {
      oSplitContainer.setMode("HideMode");
    }

    let oInvoicePageHeaderData: InvoicePageHeader = {
      SoldToParty: oSalesOrderModel.getProperty("/SoldToParty"),
      BillingDocument: aDocList[0].BillingDocument,
      TotalAmount: nTotalAmount.toFixed(2),
      TaxAmount: nTotalTaxAmount.toFixed(2),
      NetAmount: nTotalNetAmount.toFixed(2),
      Status: "Temporary",
      State: "Warning"
    };

    oInvoicePageHeaderModel.setData(oInvoicePageHeaderData);
    this.setModel(oInvoicePageHeaderModel, "invoicePageHeader");

  };

  private _createBillingDocument = async (oInvoiceItems: InvoiceItem[]): Promise<object> => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oItemTrackingDataModel = this.getModel("itemInvoiceTrackingData") as JSONModel;
    const oInvoiceWitholdingModel = this.getModel("invoiceWitholding") as JSONModel;
    const aInvoiceWitholding = oInvoiceWitholdingModel.getData();
    const oItemTrackingData = oItemTrackingDataModel.getData();
    const sSalesOrder = oViewModel.getProperty("/salesOrder");
    const oBillingDocModel = this.getModel("billingDoc");
    const sUrl = "/BillingRequestSet";
    const aPayload = {} as BillingDocCreate;

    aPayload.SalesOrder = sSalesOrder;
    aPayload.TestMode = false;
    aPayload.IsProForma = oViewModel.getProperty("/isProForma");
    aPayload.Amount1 = aInvoiceWitholding.Amount1.toString();
    aPayload.Amount2 = aInvoiceWitholding.Amount2.toString();
    aPayload.Amount3 = aInvoiceWitholding.Amount3.toString();
    aPayload.Percentage1 = aInvoiceWitholding.Percentage1.toString();
    aPayload.Percentage2 = aInvoiceWitholding.Percentage2.toString();
    aPayload.Percentage3 = aInvoiceWitholding.Percentage3.toString();
    aPayload.InvoicedAmount1 = aInvoiceWitholding.InvoicedAmount1.toString();
    aPayload.InvoicedAmount2 = aInvoiceWitholding.InvoicedAmount2.toString();
    aPayload.InvoicedAmount3 = aInvoiceWitholding.InvoicedAmount3.toString();
    aPayload.Deposit1 =  aInvoiceWitholding.DepositAmount1.toString();
    aPayload.Deposit2 =  aInvoiceWitholding.DepositAmount2.toString();
    aPayload.Deposit3 =  aInvoiceWitholding.DepositAmount3.toString();
    aPayload.Description1 = aInvoiceWitholding.Description1;
    aPayload.Description2 = aInvoiceWitholding.Description2;
    aPayload.Description3 = aInvoiceWitholding.Description3;
    aPayload.Items = [];

    oInvoiceItems.forEach((item) => {
      const invoiceItem = {
        SalesOrder: sSalesOrder,
        SalesOrderItem: item.SalesOrderItem,
        RequestedQuantity: item.InvoiceQuantity?.toString(),
        UpdateByQuantity: false,
        RequestedPercentage: item.Percentage?.toString(),
        UpdateByPercentage: true,
        PeriodAmount: item.PeriodAmount.toString(),
        PeriodPercentage: item.PeriodPercentage.toString(),
        //PeriodAmount: oItemTrackingData.PeriodAmount.toString(),
        //PeriodPercentage: oItemTrackingData.PeriodPercentage.toString(),
        //PreviousAmount: oItemTrackingData.PreviousAmount.toString(),
        //PreviousPercentage: oItemTrackingData.PreviousPercentage.toString(),
        //CumulatedAmount: oItemTrackingData.CumulativeAmount.toString(),
        //CumulatedPercentage: oItemTrackingData.CumulativePercentage.toString(),
        BillingRequestItemCondition: item.BillingRequestItemCondition
      };
      aPayload.Items.push(invoiceItem);
    });

    return new Promise((resolve, reject) => {
      oBillingDocModel.create(sUrl, aPayload, {
        success: (response: object) => resolve(response),
        error: (error: object) => reject(error),
      });
    });
  };
}
