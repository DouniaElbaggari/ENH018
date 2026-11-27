import JSONModel from "sap/ui/model/json/JSONModel";
import Device from "sap/ui/Device";
import type { Message, SalesOrderModelData, ViewControlModel, TextType, TrackingData, InvoiceItem, Descriptions, TrackingItemData, TrackingItemInvoiceData, BillingDocumentList, BillingDocumentListRaw, CalculatedHeaderAmounts, UserStatuses, Withdoldings } from "./types";

type ViewModelData = {
  salesOrder: string;
};

type MessageModelData = {
  messages: Message[];
};

type TextTypeModelData = {
  textTypes: TextType[];
};

type InvoiceItemData = {
  items: InvoiceItem[];
};

type BillingDocumentList = {
  items: BillingDocumentList[];
}

type BillingDocumentListRaw = {
  items: BillingDocumentListRaw[];
}

export function createDeviceModel(): JSONModel {
  const oModel = new JSONModel(Device);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}



export function createMessageModel(): JSONModel {
  const oData: MessageModelData = {
    messages: []
  };

  return new JSONModel(oData);
}

export function createSalesOrderModel(): JSONModel {
  const oData: SalesOrderModelData = {
    SalesOrder: "",
    SalesGroup: "",
    SalesOrderType: "",
    SoldToParty: "",
    SalesOffice: "",
    SalesDitrict: "",
    //ShipToParty: "",
    //customerName: "",
    BillingDocumentDate: "",
    TransactionCurrency: "EUR",
    TotalNetAmount: "0",
    SalesOrganization: "",
    DistributionChannel: "",
    OrganizationDivision: "",
    //divisionName: "",
    IncotermsVersion: "",
    //customerGroup: "",
    //customerGroupName: "",
    PaymentMethod: "",
    //TransactionCurrency: "EUR",
    CustomerPriceGroup: "",
    SDDocumentReason: "",
    //orderReasonText: "",
    to_Item: [],
    to_Text: [],
    to_PricingElement: [],
    to_Partner: [],
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("TwoWay");
  return oModel;

}

export function createViewModel(): JSONModel {
  const oData: ViewControlModel = {
    mode: "Display",
    salesOrder: "",
    shipToMoreDetails: false,
    billToMoreDetails: false,
    payerMoreDetails: false,
    pricingProcedure: "",
    pricingProcedurePending: true,
    milestoneCalendar: true,
    periodicCalendar: false,
    billingDocument: "",
    detailFragMode: "",
    salesContract: "",
    salesOrderType: "",
    isSigned: false,
    itemPartner: "",
    isProForma: false,
    userStatus: "E0001",
    userStatusDescription: "Initial",
    userStatusOrderNo: "10",
    updateUserStatus: false,
    isSalesOrder: true,
    isSalesContract: false,
    isBelgium: false,
    showInvoiceCrateBackButton: false,
    userStatusEditing: false
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("TwoWay");
  return oModel;
}

export function createTextTypeModel(): JSONModel {
  const oData: TextTypeModelData = {
    textTypes: []
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createItemTextTypeModel(): JSONModel {
  const oData: TextTypeModelData = {
    textTypes: []
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createTrackingDataModel(): JSONModel {
  const oData: TrackingData = {
    TotalAmount: 0,
    TotalAmountPercentage: 100,
    InvoiceAmount: 0,
    InvoiceAmountPercentage: 0,
    BillableAmount: 0,
    BillableAmountPercentage: 0,
    AdvanceTotal: 0,
    AdvanceTotalPercentage: 0,
    AdvanceRepaid: 0,
    AdvanceRepaidPercentage: 0,
    AdvanceOutstanding: 0,
    AdvanceOutstandingPercentage: 0,
    TotalForPeriod: 0,
    TotalForPeriodPercentage: 0,
    PreviousBalance: 0,
    PreviousBalancePercentage: 0,
    TotalAccumulatedAmount: 0,
    TotalAccumulatedAmountPercentage: 0,
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createItemTrackingDataModel(): JSONModel {
  const oData: TrackingItemData = {
    TotalAmountItem: 0,
    TotalAmountPercentageItem: 0,
    InvoicedAmountItem: 0,
    InvoicedAmountItemPercentage: 0,
    BillableAmountItem: 0,
    BillableAmountItemPercentage: 0,
    TotalQty: 0,
    TotalQtyUoM: "",
    TotalInvoicedQty: 0,
    TotalInvoicedQtyUoM: "",
    TotalBillableQty: 0,
    TotalBillableQtyUoM: "",
    TotalAmountForPeriod: 0,
    TotalPercentageForPeriod: 0,
    PreviousBalance: 0,
    PreviousBalancePercentage: 0,
    TotalAccumulatedAmount: 0,
    TotalAccumulatedAmountPercentage: 0,
  };
  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createItemInvoiceTrackingDataModel(): JSONModel {
  const oData: TrackingItemInvoiceData = {
    TotalAmountItem: 0,
    TotalAmountPercentageItem: 0,
    InvoicedAmountItem: 0,
    InvoicedAmountItemPercentage: 0,
    BillableAmountItem: 0,
    BillableAmountItemPercentage: 0,
    TotalQty: 0,
    TotalQtyUoM: "",
    TotalInvoicedQty: 0,
    TotalInvoicedQtyUoM: "",
    TotalBillableQty: 0,
    TotalBillableQtyUoM: "",
    TotalAmountForPeriod: 0,
    TotalPercentageForPeriod: 0,
    PreviousBalance: 0,
    PreviousBalancePercentage: 0,
    TotalAccumulatedAmount: 0,
    TotalAccumulatedAmountPercentage: 0,
  };
  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createInvoiceItemModel(): JSONModel {
  const oData: InvoiceItemData = {
    items: []
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("TwoWay");
  return oModel;
}

export function createDescriptionsModel(): JSONModel {
  const oData: Descriptions = {
    salesOrgDescription: "",
    customerName: "",
    distChannelName: "",
    divisionName: "",
    orderReasonText: "",
  }

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createBillingDocumentList(): JSONModel {
  const oData: BillingDocumentList = {
    items: []
  }

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createBillingDocumentListRaw(): JSONModel {
  const oData: BillingDocumentListRaw = {
    items: []
  }

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createBillingDocModel(): JSONModel {
  const oData: SalesOrderModelData = {
    SalesOrder: "",
    SalesOrderType: "",
    SoldToParty: "",
    //ShipToParty: "",
    //customerName: "",
    BillingDocumentDate: "",
    TransactionCurrency: "EUR",
    TotalNetAmount: "0",
    SalesOrganization: "",
    DistributionChannel: "",
    OrganizationDivision: "",
    //divisionName: "",
    IncotermsVersion: "",
    //customerGroup: "",
    //customerGroupName: "",
    PaymentMethod: "",
    //TransactionCurrency: "EUR",
    CustomerPriceGroup: "",
    SDDocumentReason: "",
    //orderReasonText: "",
    to_Item: [],
    to_Text: [],
    to_PricingElement: [],
    to_Partner: [],
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("TwoWay");
  return oModel;

}

export function createContractItemListModel(): JSONModel {
  const oModel = new JSONModel({ items: [] });
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}

export function createCalculatedAmountsModel(): JSONModel {
  const oData: CalculatedHeaderAmounts = {
    SalesOrder: "",
    Currency: "",
    TotalAmount: 0,
    PercentageBIlled: 0,
    OutsandingAmount: 0,
    OutstandingPercentage: 0,
    InitialAmount: 0,
    AmendmentAmount: 0,
    TotalAdvancedAmount: 0,
    TotalAdancedPercentage: 0,
    PaidAdvancedAmount: 0,
    PaidAdvancedPercentage: 0,
    OustandingAdvancedAmount: 0,
    OustandingAdvancedPercentage: 0,
    PeriodAmount: 0,
    PeriodPercentage: 0,
    PreviousAmount: 0,
    PreviousPercentage: 0,
    CumulativeAmount: 0,
    CumulativePercentage: 0,
    RetentionBaseAmount: 0,
    RetentionPeriodBaseAmount: 0,
    itemAmounts: []
  };

  return new JSONModel(oData);
}

export function createUserStatusesModel(): JSONModel {
  const oData: UserStatuses = {
    SalesOrder: "",
    Status: "",
    StatusOrder: "",
    StatusDescription: "",
    CurrentStatus: false
  };

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("TwoWay");
  return oModel;
}

export function createInvoiceWitholdingModel(): JSONModel {
  const oData: Withdoldings = {
    Description1: "",
    Description2: "",
    Description3: "",
    Percentage1: 0,
    Percentage2: 0,
    Percentage3: 0,
    Amount1: 0,
    Amount2: 0,
    Amount3: 0,
    InvoicedAmount1: 0,
    InvoicedAmount2: 0,
    InvoicedAmount3: 0,
    Deposit1: 0,
    Deposit2: 0,
    Deposit3: 0,
  }

  const oModel = new JSONModel(oData);
  oModel.setDefaultBindingMode("OneWay");
  return oModel;
}