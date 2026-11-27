export type MessageType = "Error" | "Warning" | "Success" | "Information";
export type Mode = "Create" | "Edit" | "Display";

export interface Message {
  type: MessageType;
  title: string;
  description: string;
  subtitle?: string;
  counter?: number;
}

export type ScheduleLine = {
  ScheduleLineNo: string;
  RequestedDeliveryDate: string;
  ConfirmedDeliveryDate: string;
  ScheduleLineOrderQuantity: string;
  ConfdOrderQtyByMatlAvailCheck: string;
};

export type PricingElement = {
  SalesOrder: string;
  SalesOrderItem: string;
  PricingProcedureStep: string;
  PricingProcedureCounter: string;
  ConditionType: string;
  ConditionTypeName: string;
  PriceConditionDeterminationDte: string;
  ConditionCalculationType: string;
  ConditionBaseValue: string;
  ConditionRateValue: string;
  ConditionCurrency: string;
  ConditionQuantity: string;
  ConditionQuantityUnit: string;
  ConditionQuantitySAPUnit: string;
  ConditionQuantityISOUnit: string;
  ConditionIsForStatistics: boolean;
  ConditionOrigin: string;
  IsGroupCondition: string;
  ConditionAmount: string;
  TransactionCurrency: string;
  ConditionInactiveReason: string;
  ConditionClass: string;
  PricingScaleBasis: string;
  ConditionScaleBasisValue: string;
  ConditionIsManuallyChanged: string;
}

export type SalesOrderItem = {
  SalesOrder: string;
  SalesOrderItem: string;
  Material: string;
  SalesOrderItemText: string;
  RequestedQuantity: string;
  NetAmount: string;
  SalesOrderItemCategory: string;
  TransactionCurrency: string;
  PurchaseOrderByCustomer: string;
  to_ScheduleLine: ScheduleLine[];
  to_ItemPricingElement: PricingElement[];
  to_BillingPlan: BillingPlan;
  to_Text: SalesOrderText[];

};

export type SalesOrderHeader = {
  SalesOrder?: string;
  SalesOrderType: string;
  SoldToParty: string;
  ShipToParty: string;
  //CustomerName: string;
  CreationDate: string;
  TotalNetAmount: number;
  SalesOrganization: string;
  //salesOrgDescription?: string;
  DistributionChannel: string;
  //distChannelName?: string;
  OrganizationDivision: string;
  //divisionName?: string;
  IncotermsVersion: string;
  CustomerPriceGroup: string;
  //customerGroupName: string;
  PaymentMethod: string;
  TransactionCurrency: string;
  //customerPriceGroup: string;
  SDDocumentReason: string;
  //orderReasonText: string;
};

export type BillingPlan = {
  SalesOrder: string;
  SalesOrderItem: string;
  BillingPlan: string;
  BillingPlanIsInHeader: string;
  BillingPlanStartDate: string;
  BillingPlanStartDateRule: string;
  ReferenceBillingPlan: string;
  BillingPlanCategory: string;
  BillingPlanType: string;
  BillingPlanEndDate: string;
  BillingPlanEndDateRule: string;
  BillingPlanSearchTerm: string;
  to_BillingPlanItem?: BillingPlanItem[]
};

export type BillingPlanItem = {
  SalesOrder: string;
  BillingPlan: string;
  BillingPlanItem: string;
  BillingPlanDateCategory: string;
  BillingPlanBillingDate: string;
  BillingPlanAmount: string;
  TransactionCurrency: string;
  BillingPlanAmountPercent: string;
  CustomerPaymentTerms: string;
  ProposedBillingDocumentType: string;
  BillingPlanDateDescriptionCode: string;
  BillingBlockReason: string;
  BillingPlanServiceStartDate: string;
  BillingPlanServiceEndDate: string;
  BillingPlanRelatedBillgStatus: string;
  BillingPlanType: string;
  AdoptingBillingDateID: string;
  BillingPlanBillingRule: string;
  BillingPlanMilestoneUsage: string;
  BillgPlnDteCorrectionRfndType: string;
  AccountingExchangeRate: string;
  PostponementReason: string;
};

export type SalesOrderModelData = {
  SalesOrder?: string;
  SalesGroup?: string;
  SalesOffice?: string;
  SalesDitrict?: string;
  SalesOrderType: string;
  SoldToParty: string;
  //ShipToParty: string;
  //customerName: string;
  BillingDocumentDate: string;
  //currency: string;
  TotalNetAmount: string;
  SalesOrganization: string;
  salesOrgDescription?: string;
  DistributionChannel: string;
  //distChannelName?: string;
  OrganizationDivision: string;
  //divisionName?: string;
  IncotermsVersion: string;
  CustomerPriceGroup: string;
  //customerGroupName: string;
  PaymentMethod: string;
  TransactionCurrency: string;
  //customerPriceGroup: string;
  SDDocumentReason: string;
  //orderReasonText: string;
  to_BillingPlan?: BillingPlan;
  to_Item: SalesOrderItem[];
  to_Text: SalesOrderText[];
  to_PricingElement: PricingElement[];
  to_Partner: Partner[];
};

export type ViewControlModel = {
  mode: Mode;
  salesOrder: string;
  shipToMoreDetails: boolean;
  billToMoreDetails: boolean;
  payerMoreDetails: boolean;
  pricingProcedure: string;
  pricingProcedurePending: boolean;
  periodicCalendar: boolean;
  milestoneCalendar: boolean;
  billingDocument: string;
  detailFragMode: string;
  salesContract: string;
  salesOrderType: string;
  isSigned: boolean;
  itemPartner: string;
  isProForma: boolean;
  userStatus: string;
  userStatusDescription: string;
  userStatusOrderNo: string;
  updateUserStatus: boolean;
  isSalesOrder: boolean;
  isSalesContract: boolean;
  isBelgium: boolean;
  showInvoiceCrateBackButton: boolean;
  userStatusEditing: boolean;
}

export type SalesOrderText = {
  Language: string;
  LongTextID: string;
  LongText: string;
}

export type TextType = {
  LongTextID: string;
  LongTextIDText: string;
}

export type Partner = {
  SalesOrder: string;
  PartnerFunction: string;
  PartnerFunctionInternalCode: string;
  Customer: string;
  CustomerName: string;
  Supplier: string;
  Personnel: string;
  ContactPerson: string;
  ReferenceBusinessPartner: string;
  AddressID: string;
  VATRegistration: string;
}

export type TrackingData = {
  TotalAmount: number;
  TotalAmountPercentage: number;
  InvoiceAmount: number;
  InvoiceAmountPercentage: number;
  BillableAmount: number;
  BillableAmountPercentage: number;
  AdvanceTotal: number;
  AdvanceTotalPercentage: number;
  AdvanceRepaid: number;
  AdvanceRepaidPercentage: number;
  AdvanceOutstanding: number;
  AdvanceOutstandingPercentage: number;
  TotalForPeriod: number;
  TotalForPeriodPercentage: number;
  PreviousBalance: number;
  PreviousBalancePercentage: number;
  TotalAccumulatedAmount: number;
  TotalAccumulatedAmountPercentage: number;
}

export type TrackingItemData = {
  TotalAmountItem: number;
  TotalAmountPercentageItem: number;
  InvoicedAmountItem: number;
  InvoicedAmountItemPercentage: number;
  BillableAmountItem: number;
  BillableAmountItemPercentage: number;
  TotalQty: number;
  TotalQtyUoM: string;
  TotalInvoicedQty: number;
  TotalInvoicedQtyUoM: string;
  TotalBillableQty: number;
  TotalBillableQtyUoM: string;
  TotalAmountForPeriod: number;
  TotalPercentageForPeriod: number;
  PreviousBalance: number;
  PreviousBalancePercentage: number;
  TotalAccumulatedAmount: number;
  TotalAccumulatedAmountPercentage: number;
}

export type TrackingItemInvoiceData = {
  TotalAmountItem: number;
  TotalAmountPercentageItem: number;
  InvoicedAmountItem: number;
  InvoicedAmountItemPercentage: number;
  BillableAmountItem: number;
  BillableAmountItemPercentage: number;
  TotalQty: number;
  TotalQtyUoM: string;
  TotalInvoicedQty: number;
  TotalInvoicedQtyUoM: string;
  TotalBillableQty: number;
  TotalBillableQtyUoM: string;
  TotalAmountForPeriod: number;
  TotalPercentageForPeriod: number;
  PreviousBalance: number;
  PreviousBalancePercentage: number;
  TotalAccumulatedAmount: number;
  TotalAccumulatedAmountPercentage: number;
}

export type InvoiceItem = {
  SalesOrderItem: string;
  Material: string;
  SalesOrderItemText: string;
  InvoiceAmount: number;
  InvoiceQuantity: number;
  DueDate: string;
  AmountDue: number;
  PriceRevision: number;
  ToBeInvoiced: number;
  Unit: string;
  Rate: string;
  Percentage?: string;
  PeriodAmount: number;
  PeriodPercentage: number;
}

export type Descriptions = {
  salesOrgDescription: string;
  customerName: string;
  distChannelName?: string;
  divisionName?: string;
  orderReasonText: string;
}

export type TabContentConfig = {
  tabId: string;
  fragId: string;
  fragmentName: string;
};

export type SubsequentProcFlowDocItem = {
  AccountingTransferStatus: string;
  CreationDate: string;
  CreationTime: string;
  DocRelationshipUUID: string;
  LastChangeDate: string;
  PrelimBillingDocumentStatus: string;
  ProcessFlowLevel: string;
  RelatedProcFlowDocStsFieldName: string;
  SDProcessStatus: string;
  SalesOrder: string;
  SalesOrderItem: string;
  SubsequentDocument: string;
  SubsequentDocumentCategory: string;
  SubsequentDocumentItem: string;
  SubsqntDocItmPrecdgDocCategory: string;
  SubsqntDocItmPrecdgDocItem: string;
  SubsqntDocItmPrecdgDocument: string;
}

export type BillingDocumentList = {
  BillingDocument: string;
  NetValue: number;
  TaxValue: number;
  Currency: string;
}

export type BillingDocumentListRaw = {
  BillingDocument: string;
  ReferemnceDocument: string;
  ReferemnceDocumentItem: string;
}


export type BillingDocCreateItem = {
  SalesOrder: string;
  SalesOrderItem: string;
  RequestedQuantity: number;
  UpdateByQuantity: boolean;
  RequestedPercentage: number;
  UpdateByPercentage: boolean;
}

export type BillingDocCreate = {
  SalesOrder: string;
  TestMode: boolean;
  IsProForma: boolean;
  Items: BillingDocCreateItem[];
  Amount1: number;
  Amount2: number;
  Amount3: number;
  Percentage1: number;
  Percentage2: number;
  Percentage3: number;
  InvoicedAmount1: number;
  InvoicedAmount2: number;
  InvoicedAmount3: number;
  Description1: string;
  Description2: string;
  Description3: string;
  Deposit1: number;
  Deposit2: number;
  Deposit3: number;
}

export type CalculatedHeaderAmounts = {
  SalesOrder: string;
  Currency: string;
  TotalAmount: number;
  PercentageBIlled: number;
  OutsandingAmount: number;
  OutstandingPercentage: number;
  InitialAmount: number;
  AmendmentAmount: number;
  TotalAdvancedAmount: number;
  TotalAdancedPercentage: number;
  PaidAdvancedAmount: number;
  PaidAdvancedPercentage: number;
  OustandingAdvancedAmount: number;
  OustandingAdvancedPercentage: number;
  PeriodAmount: number;
  PeriodPercentage: number;
  PreviousAmount: number;
  PreviousPercentage: number;
  CumulativeAmount: number;
  CumulativePercentage: number;
  RetentionBaseAmount: number;
  RetentionPeriodBaseAmount: number;
  itemAmounts: CalculatedItemAmounts[];
}

export type CalculatedItemAmounts = {
  SalesOrder: string;
  SalesOrderItem: string;
  Currency: string;
  Unit: string;
  BusinessCategory: string;
  Nature: string;
  IsBasePriceEligible: boolean;
  IsProgressBillable: boolean;
  IsItemBillable: boolean;
  IsRetentionBasedEligible: boolean;
  TotalAmount: number;
  TotalPercentage: number;
  AmountBilled: number;
  PercentageBilled: number;
  OustandingAmount: number;
  OutstandingPercentage: number;
  OutstandingQuantity: number;
  TotalQuantity: number;
  BilledQuantity: number;
  PeriodAmount: number;
  PeriodPercentage: number;
  PreviousAmount: number;
  PreviousPercentage: number;
  CumulativeAmount: number;
  CumulativePercentage: number;
  RetentionBaseAmount: number;
  RetentionPeriodBaseAmount: number;
}

export type UserStatuses = {
  SalesOrder: string;
  Status: string;
  StatusOrder: string;
  StatusDescription: string;
  CurrentStatus: boolean;
}

export type Withdoldings = {
  Description1: string;
  Description2: string;
  Description3: string;
  Percentage1: number;
  Percentage2: number;
  Percentage3: number;
  Amount1: number;
  Amount2: number;
  Amount3: number;
  InvoicedAmount1: number;
  InvoicedAmount2: number;
  InvoicedAmount3: number;
  Deposit1: number;
  Deposit2: number;
  Deposit3: number;
}