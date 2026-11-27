import BaseController from "./BaseController";
import type { SalesOrderItem } from "../model/types";
import MessageBox from "sap/m/MessageBox"
import formatter from "../utils/Formatter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Event from "sap/ui/base/Event";

/**
 * @namespace com.eiffage.sdt.controller
 */

export default class InvoiceCreateItem extends BaseController {
    public formatter = formatter;

    public async onInit(): Promise<void> {
        this.getRouter().getRoute("CreateInvoiceItemDetail")?.attachPatternMatched(this._onPatternMatched, this);
    }

    private _onPatternMatched(oEvent: any): void {
        const args = oEvent.getParameter("arguments");
        const sPath = args.Path;
        const oInvoiceItemData = this.getView().getModel("invoiceItem").getProperty("/items");
        const oBillingDocModel = this.getModel("billingDocDisp");
        let oBillingData = oBillingDocModel.getProperty(decodeURIComponent(sPath));

        const oInvoiceItem = oInvoiceItemData.find((item) => item.SalesDocumentItem === oBillingData.SalesDocumentItem);

        if (oInvoiceItem) {
            oBillingData.InvoiceQuantity = oInvoiceItem.InvoiceQuantity;
            oBillingData.InvoiceAmount = oInvoiceItem.InvoiceAmount;
            oBillingData.InvoiceTaxAmount = oInvoiceItem.InvoiceTaxAmount;
        }

        const oModel = new JSONModel(oBillingData);
        this.getView().setModel(oModel, "billingDocItemDetail");
    }
}