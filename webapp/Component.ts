import BaseComponent from "sap/ui/core/UIComponent";
import EventBus from "sap/ui/core/EventBus";

import {
  createDeviceModel,
  createMessageModel,
  createViewModel,
  createSalesOrderModel,
  createTextTypeModel,
  createTrackingDataModel,
  createItemTrackingDataModel,
  createItemInvoiceTrackingDataModel,
  createInvoiceItemModel,
  createDescriptionsModel,
  createItemTextTypeModel,
  createBillingDocumentList,
  createBillingDocumentListRaw,
  createBillingDocModel,
  createContractItemListModel,
  createCalculatedAmountsModel,
  createUserStatusesModel,
  createInvoiceWitholdingModel
} from "./model/models";

/**
 * @namespace com.eiffage.sdt
 */
export default class Component extends BaseComponent {
  public static metadata = {
    manifest: "json",
    interfaces: ["sap.ui.core.IAsyncContentCreation"],
  };

  public init(): void {
    // call the base component's init function
    super.init();

    // set the device model
    this.setModel(createDeviceModel(), "device");
    this.setModel(createViewModel(), "viewModel");
    this.setModel(createMessageModel(), "messageModel");
    this.setModel(createSalesOrderModel(), "salesOrder");
    this.setModel(createTextTypeModel(), "textTypes");
    this.setModel(createItemTextTypeModel(), "itemTextTypes");
    this.setModel(createTrackingDataModel(), "trackingData");
    this.setModel(createItemTrackingDataModel(), "itemTrackingData");
    this.setModel(createItemInvoiceTrackingDataModel(), "itemInvoiceTrackingData");
    this.setModel(createInvoiceItemModel(), "invoiceItem");
    this.setModel(createDescriptionsModel(), "descriptions");
    this.setModel(createBillingDocumentList(), "billingDocList");
    this.setModel(createBillingDocumentListRaw(), "billingDocListRaw");
    this.setModel(createBillingDocModel(), "billingDocDisp");
    this.setModel(createContractItemListModel(), "contractItemList");
    this.setModel(createCalculatedAmountsModel(), "calculatedAmounts");
    this.setModel(createUserStatusesModel(), "userStatuses");
    this.setModel(createInvoiceItemModel(), "invoiceWitholding");

    // enable routing
    this.getRouter().initialize();
  }
}
