import MessageToast from "sap/m/MessageToast";
import type { ValueHelpConfig } from "./ValueHelpDialogFactory";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import Input from "sap/m/Input";
import type JSONModel from "sap/ui/model/json/JSONModel";

export const VALUE_HELP_CONFIGS = {
  salesOrg: {
    key: "salesOrg",
    title: "Sales Organization",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesOrgValueHelp",
    modelName: "salesOrgVH",
    tablePath: "salesOrgVH>/C_SalesDocSalesOrganizationVH",
    keyField: "SalesOrganization",
    descriptionField: "SalesOrganization_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Organization",
        textBinding: "{salesOrgVH>SalesOrganization}",
      },
      {
        label: "Description",
        textBinding: "{salesOrgVH>SalesOrganization_Text}",
      },
    ],

    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    }//,
    //search: (_event, dialog) => { alert("you pressed search") },
  },

  salesOrgMultiple: {
    key: "salesOrgMultiple",
    title: "Sales Organization",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesOrgMultipleValueHelp",
    modelName: "salesOrgVH",
    tablePath: "salesOrgVH>/C_SalesDocSalesOrganizationVH",
    keyField: "SalesOrganization",
    descriptionField: "SalesOrganization_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Organization",
        textBinding: "{salesOrgVH>SalesOrganization}",
      },
      {
        label: "Description",
        textBinding: "{salesOrgVH>SalesOrganization_Text}",
      },
    ],

    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    }//,
    //search: (_event, dialog) => { alert("you pressed search") },
  },

  distChannel: {
    key: "distChannel",
    title: "Distribution Channel",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DistChannelValueHelp",
    modelName: "distChannelVH",
    tablePath: "distChannelVH>/C_Dischannelvaluehelp",
    keyField: "DistributionChannel",
    descriptionField: "DistributionChannelName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Distribution Channel",
        textBinding: "{distChannelVH>DistributionChannel}",
      },
      {
        label: "Description",
        textBinding: "{distChannelVH>DistributionChannelName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty('/SalesOrganization');
      const aFilters = [];

      if (sSalesOrg) {
        aFilters.push(
          new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
        );
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  distChannelMultiple: {
    key: "distChannelMultiple",
    title: "Distribution Channel",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DistChannelMultipleValueHelp",
    modelName: "distChannelVH",
    tablePath: "distChannelVH>/C_Dischannelvaluehelp",
    keyField: "DistributionChannel",
    descriptionField: "DistributionChannelName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Distribution Channel",
        textBinding: "{distChannelVH>DistributionChannel}",
      },
      {
        label: "Description",
        textBinding: "{distChannelVH>DistributionChannelName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty('/SalesOrganization');
      const aFilters = [];

      if (sSalesOrg) {
        aFilters.push(
          new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
        );
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  division: {
    key: "division",
    title: "Division Channel",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DivisionValueHelp",
    modelName: "divisionVH",
    tablePath: "divisionVH>/C_OrgDivisionValueHelp",
    keyField: "Division",
    descriptionField: "DivisionName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Division",
        textBinding: "{divisionVH>Division}",
      },
      {
        label: "Description",
        textBinding: "{divisionVH>DivisionName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty('/SalesOrganization');
      const aFilters = [];

      if (sSalesOrg) {
        aFilters.push(
          new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
        );
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  divisionMultiple: {
    key: "divisionMultiple",
    title: "Division Channel",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DivisionMultipleValueHelp",
    modelName: "divisionVH",
    tablePath: "divisionVH>/C_OrgDivisionValueHelp",
    keyField: "Division",
    descriptionField: "DivisionName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Division",
        textBinding: "{divisionVH>Division}",
      },
      {
        label: "Description",
        textBinding: "{divisionVH>DivisionName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty('/SalesOrganization');
      const aFilters = [];

      if (sSalesOrg) {
        aFilters.push(
          new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
        );
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  soldTo: {
    key: "soldTo",
    title: "Sold To",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SoldToValueHelp",
    modelName: "soldToVH",
    tablePath: "soldToVH>/C_SoldToSalesAreaVH",
    keyField: "Customer",
    descriptionField: "CustomerName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Customer",
        textBinding: "{soldToVH>Customer}",
      },
      {
        label: "Name",
        textBinding: "{soldToVH>CustomerName}",
      },
      {
        label: "Postal Code",
        textBinding: "{soldToVH>PostalCode}",
      },
      {
        label: "City",
        textBinding: "{soldToVH>CityName}",
      },
      {
        label: "Country/Region Key",
        textBinding: "{soldToVH>Country_Text}",
      },
      {
        label: "Street",
        textBinding: "{soldToVH>StreetName}",
      },
      {
        label: "Search Term 1",
        textBinding: "{soldToVH>AddressSearchTerm1}",
      },
      {
        label: "Search Term 2",
        textBinding: "{soldToVH>AddressSearchTerm2}",
      },
    ],
    search: async (
      _event,
      dialog,
      _filterBar,
      basicSearchField,
    ) => {
      const sSearch = basicSearchField.getValue()?.trim() || "";
      const oTable = await dialog.getTableAsync();
      const oBinding = oTable.getBinding?.("rows") || oTable.getBinding?.("items");

      if (oBinding) {
        if ("changeParameters" in oBinding) {
          oBinding.changeParameters({
            $search: sSearch || undefined,
          });
        }
      }

      dialog.update();
    },

    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },

    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  customerGroup: {
    key: "customerGroup",
    title: "Customer Group",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.CustomerGroupValueHelp",
    modelName: "customerGroupVH",
    tablePath: "customerGroupVH>/I_CustomerGroup",
    keyField: "CustomerGroup",
    descriptionField: "CustomerGroup_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Customer Group",
        textBinding: "{customerGroupVH>CustomerGroup}",
      },
      {
        label: "Description",
        textBinding: "{customerGroupVH>CustomerGroup_Text}",
      },
    ],
    /*getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
      const aFilters = [];

      if (sSalesOrg) {
        aFilters.push(
          new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg) 
        );
      }

      return aFilters;
    },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  shippingCondition: {
    key: "shippingCondition",
    title: "Shipping Condition",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.ShippingConditionValueHelp",
    modelName: "shippingConditionsVH",
    tablePath: "shippingConditionsVH>/I_ShippingCondition",
    keyField: "ShippingCondition",
    descriptionField: "ShippingCondition_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Shipping Condition",
        textBinding: "{shippingConditionVH>ShippingCondition}",
      },
      {
        label: "Description",
        textBinding: "{shippingConditionVH>ShippingCondition_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  incoterms: {
    key: "incoterms",
    title: "Incoterms",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.IncotermsValueHelp",
    modelName: "incotermsVH",
    tablePath: "incotermsVH>/I_ShippingCondition",
    keyField: "IncotermsClassification",
    descriptionField: "IncotermsClassification_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Incoterm",
        textBinding: "{incotermsVH>IncotermsClassification}",
      },
      {
        label: "Description",
        textBinding: "{incotermsVH>IncotermsClassification_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  paymentMethod: {
    key: "paymentMethod",
    title: "Payment Method",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.PaymentMethodValueHelp",
    modelName: "paymentMethodVH",
    tablePath: "paymentMethodVH>/C_SalesDocPaymentMethodVH",
    keyField: "PaymentMethod",
    descriptionField: "PaymentMethodDescription",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Payment Method",
        textBinding: "{paymentMethodVH>PaymentMethod}",
      },
      {
        label: "Description",
        textBinding: "{paymentMethodVH>PaymentMethodDescription}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  termsOfPayment: {
    key: "termsOfPayment",
    title: "Terms of Payment",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.TermsOfPaymentValueHelp",
    modelName: "termsOfPaymentVH",
    tablePath: "termsOfPaymentVH>/I_CustomerPaymentTerms",
    keyField: "CustomerPaymentTerms",
    descriptionField: "CustomerPaymentTerms_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Payment Terms",
        textBinding: "{termsOfPaymentVH>CustomerPaymentTerms}",
      },
      {
        label: "Description",
        textBinding: "{termsOfPaymentVH>CustomerPaymentTerms_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  currency: {
    key: "currency",
    title: "Document Currency",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DocumentCurrencyValueHelp",
    modelName: "documentCurrencyVH",
    tablePath: "documentCurrencyVH>/I_CurrencyStdVH",
    keyField: "Currency",
    descriptionField: "Currency_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Current",
        textBinding: "{documentCurrencyVH>Currency}",
      },
      {
        label: "Description",
        textBinding: "{documentCurrencyVH>Currency_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  customerPriceGroup: {
    key: "customerPriceGroup",
    title: "Customer Price Group",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.CustomerPriceGroupValueHelp",
    modelName: "customerPriceGroupVH",
    tablePath: "customerPriceGroupVH>/I_CustomerPriceGroup",
    keyField: "CustomerPriceGroup",
    descriptionField: "CustomerPriceGroup_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Customer Price Group",
        textBinding: "{customerPriceGroupVH>CustomerPriceGroup}",
      },
      {
        label: "Description",
        textBinding: "{customerPriceGroupVH>CustomerPriceGroup_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  priceListTpe: {
    key: "priceListType",
    title: "Price List Type",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.PriceListTypeValueHelp",
    modelName: "priceListTypeVH",
    tablePath: "priceListTypeVH>/I_PriceListType",
    keyField: "PriceListType",
    descriptionField: "PriceListType_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Price List Type",
        textBinding: "{priceListTypeVH>PriceListType}",
      },
      {
        label: "Description",
        textBinding: "{priceListTypeVH>PriceListType_Text}",
      },
    ],
    /*getFilters: (controller) => {
       const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
       const sSalesOrg = oSalesOrderModel.getProperty('/salesOrderHeader/salesOrg');
       const aFilters = [];
 
       if (sSalesOrg) {
         aFilters.push(
           new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg)
         );
       }
 
       return aFilters;
     },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  salesOffice: {
    key: "salesOffice",
    title: "Sales Office",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesOfficeValueHelp",
    modelName: "salesOfficeVH",
    tablePath: "salesOfficeVH>/C_SalesOfficeValueHelp",
    keyField: "SalesOffice",
    descriptionField: "SalesOfficeName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Office",
        textBinding: "{salesOfficeVH>SalesOffice}",
      },
      {
        label: "Description",
        textBinding: "{salesOfficeVH>SalesOfficeName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/SalesOrganization");
      const sDistChannel = oSalesOrderModel.getProperty("/DistributionChannel");
      const sDivision = oSalesOrderModel.getProperty("/OrganizationDivision");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }

      if (sDivision) {
        aFilters.push(new Filter("OrganizationDivision", FilterOperator.EQ, sDivision));
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  salesGroup: {
    key: "salesGroup",
    title: "Sales Group",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesGroupValueHelp",
    modelName: "salesGroupVH",
    tablePath: "salesGroupVH>/C_SalesGroupValueHelp",
    keyField: "SalesGroup",
    descriptionField: "SalesGroupName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Group",
        textBinding: "{salesGroupVH>SalesGroup}",
      },
      {
        label: "Description",
        textBinding: "{salesGroupVH>SalesGroupName}",
      },
    ],
    /*getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/salesOrderHeader/salesOrg");
      const sDistChannel = oSalesOrderModel.getProperty("/salesOrderHeader/distChannel");
      const sDivision = oSalesOrderModel.getProperty("/salesOrderHeader/division");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }

      if (sDivision) {
        aFilters.push(new Filter("OrganizationDivision", FilterOperator.EQ, sDivision));
      }

      return aFilters;
    },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  salesDistrict: {
    key: "salesDistrict",
    title: "Sales District",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesDistrictValueHelp",
    modelName: "salesDistrictVH",
    tablePath: "salesDistrictVH>/I_SalesDistrict",
    keyField: "SalesDistrict",
    descriptionField: "SalesDistrict_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales District",
        textBinding: "{salesDistrictVH>SalesDistrict}",
      },
      {
        label: "Description",
        textBinding: "{salesDistrictVH>SalesDistrict_Text}",
      },
    ],
    /*getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/salesOrderHeader/salesOrg");
      const sDistChannel = oSalesOrderModel.getProperty("/salesOrderHeader/distChannel");
      const sDivision = oSalesOrderModel.getProperty("/salesOrderHeader/division");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }

      if (sDivision) {
        aFilters.push(new Filter("OrganizationDivision", FilterOperator.EQ, sDivision));
      }

      return aFilters;
    },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

   itemCategory: {
    key: "itemCategory",
    title: "Item Category",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.ItemCategoryValueHelp",
    modelName: "itemCategoryVH",
    tablePath: "itemCategoryVH>/C_SlsDocItemItemCatDetnVH",
    keyField: "SalesDocumentItemCategory",
    descriptionField: "SalesDocumentItemCategoryName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Item Category",
        textBinding: "{itemCategoryVH>SalesDocumentItemCategory}",
      },
      {
        label: "Description",
        textBinding: "{itemCategoryVH>SalesDocumentItemCategoryName}",
      },
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sOrderType = oSalesOrderModel.getProperty("/salesOrderHeader/orderType");
      
      const aFilters: Filter[] = [];

      if (sOrderType) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sOrderType));
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      //MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  custAccAssgnGroup: {
    key: "custAccAssgnGroup",
    title: "Customer Account Assignment Group",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.CustAccAssgnGroupValueHelp",
    modelName: "customerAcctAssgmtGroupVH",
    tablePath: "customerAcctAssgmtGroupVH>/I_CustomerAccountAssgmtGroup",
    keyField: "CustomerAccountAssignmentGroup",
    descriptionField: "CustomerAccountAssignmentGroup_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Customer Account Assignment Group",
        textBinding: "{customerAcctAssgmtGroupVH>CustomerAccountAssignmentGroup}",
      },
      {
        label: "Description",
        textBinding: "{customerAcctAssgmtGroupVH>CustomerAccountAssignmentGroup_Text}",
      },
    ],
    /*getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sOrderType = oSalesOrderModel.getProperty("/salesOrderHeader/orderType");
      
      const aFilters: Filter[] = [];

      if (sOrderType) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sOrderType));
      }

      return aFilters;
    },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  country: {
    key: "country",
    title: "Tax Country",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.TaxCountryValueHelp",
    modelName: "countryVH",
    tablePath: "countryVH>/I_CountryVH",
    keyField: "Country",
    descriptionField: "Country_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Country/Region Key",
        textBinding: "{countryVH>Country}",
      },
      {
        label: "Country/Region Name",
        textBinding: "{countryVH>Country_Text}",
      },
      {
        label: "ISO Code 3 Char",
        textBinding: "{countryVH>CountryThreeLetterISOCode}",
      },
      {
        label: "ISO Code 3 Num",
        textBinding: "{countryVH>CountryThreeDigitISOCode}",
      }
    ],
    /*getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sOrderType = oSalesOrderModel.getProperty("/salesOrderHeader/orderType");
      
      const aFilters: Filter[] = [];

      if (sOrderType) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sOrderType));
      }

      return aFilters;
    },*/
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  product: {
    key: "product",
    title: "Product",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.ProductValueHelp",
    modelName: "productVH",
    tablePath: "productVH>/C_SlsOrdProdBySlsOrgDistrChnl",
    keyField: "Product",
    descriptionField: "ProductName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Product",
        textBinding: "{productVH>Product}",
      },
      {
        label: "Product Description",
        textBinding: "{productVH>ProductName}",
      },
      {
        label: "Sales Unit",
        textBinding: "{productVH>RequestedQuantityUnit}",
      }
      
    ],
    getFilters: (controller) => {
      const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/SalesOrganization");
      const sDistChannel = oSalesOrderModel.getProperty("/DistributionChannel");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }

      return aFilters;
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens");
      dialog.close();
      MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  language: {
    key: "Language",
    title: "Language",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.LanguageValueHelp",
    modelName: "languageVH",
    tablePath: "languageVH>/I_Language",
    keyField: "Language",
    descriptionField: "Language_Text",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Language",
        textBinding: "{languageVH>Language}",
      },
      {
        label: "Name",
        textBinding: "{languageVH>Language_Text}",
      },
      {
        label: "Language Code",
        textBinding: "{languageVH>LanguageISOCode}",
      }
    ],

    ok: (event, dialog) => {
      //const tokens = event.getParameter("tokens");
      dialog.close();
      //MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
    //search: (_event, dialog) => { alert("you pressed search") },
  },

  conditionType: {
    key: "ConditionType",
    title: "Condition Type",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.ConditionTypeValueHelp",
    modelName: "conditionTypeVH",
    tablePath: "conditionTypeVH>/C_SlsDocItmPrcgConditionTypeVH",
    keyField: "ConditionType",
    descriptionField: "ConditionTypeName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Condition",
        textBinding: "{conditionTypeVH>ConditionType}",
      },
      {
        label: "Description",
        textBinding: "{conditionTypeVH>ConditionTypeName}",
      }
    ],
    getFilters: (controller) => {
      const oViewModel = controller.getModel("viewModel");
      const aFilters: Filter[] = [];
      aFilters.push(new Filter("SDPricingProcedure", FilterOperator.EQ, oViewModel.getProperty("/pricingProcedure") || 'Z10002'));
      return aFilters;
    },
    ok: (event, dialog) => {
      //const tokens = event.getParameter("tokens");
      dialog.close();
      //MessageToast.show(`${tokens.length} selection(s) confirmed`);
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
    //search: (_event, dialog) => { alert("you pressed search") },
  },

  wbsElement: {
    key: "wbsElement",
    title: "WBS Element",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.WBSElementValueHelp",
    modelName: "wbsElementVH",
    tablePath: "wbsElementVH>/ZC_WBSElementByExternalID",
    keyField: "WBSElementExternalID",
    descriptionField: "WBSDescription",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "WBS Element",
        textBinding: "{wbsElementVH>WBSElementExternalID}",
      },
      {
        label: "Description",
        textBinding: "{wbsElementVH>WBSDescription}",
      }
      
    ],
    getFilters: (controller) => {
      /*const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/SalesOrganization");
      const sDistChannel = oSalesOrderModel.getProperty("/DistributionChannel");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }*/

      return [];
    },
    ok: (event, dialog) => {
      //const tokens = event.getParameter("tokens");
      //dialog.close();
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },
  
  salesContract: {
    key: "salesContract",
    title: "Sales Contract",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesContractValueHelp",
    modelName: "salesContractVH",
    tablePath: "salesContractVH>/C_SalesContrForCreateWithRefVH",
    keyField: "SalesContract",
    descriptionField: "SoldToPartyName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Contract",
        textBinding: "{salesContractVH>SalesContract}",
      },
      {
        label: "Sales Contract Type",
        textBinding: "{salesContractVH>SalesContractType}",
      },
      {
        label: "Sold-To Party",
        textBinding: "{salesContractVH>SoldToPartyName}",
      },
      {
        label: "Customer Reference",
        textBinding: "{salesContractVH>PurchaseOrderByCustomer}",
      },
      {
        label: "Valid-From Date",
        textBinding: "{salesContractVH>SalesContractValidityStartDate}",
      },
      {
        label: "Valid-To Date",
        textBinding: "{salesContractVH>SalesContractValidityEndDate}",
      },
      {
        label: "Overall Status",
        textBinding: "{salesContractVH>OverallSDProcessStatus_Text}",
      }
      
    ],
    getFilters: (controller) => {
      /*const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/SalesOrganization");
      const sDistChannel = oSalesOrderModel.getProperty("/DistributionChannel");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }*/

      return [];
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens") as Token[];
      dialog.close();
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },
  salesOrder: {
    key: "salesOrder",
    title: "Sales Order",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesOrderValueHelp",
    modelName: "salesOrderOData",
    tablePath: "salesOrderOData>/SalesOrderManage",
    keyField: "SalesOrder",
    descriptionField: "CustomerName",
    supportMultiselect: false,
    supportRanges: false,
    columns: [
      {
        label: "Sales Order",
        textBinding: "{salesOrderOData>SalesOrder}",
      },
      {
        label: "Sales Order Type",
        textBinding: "{salesOrderOData>SalesOrderType}",
      },
      {
        label: "Customer Name",
        textBinding: "{salesOrderOData>CustomerName}",
      },
      {
        label: "Sold-To Party",
        textBinding: "{salesOrderOData>SoldToParty}",
      },
      {
        label: "Customer Reference",
        textBinding: "{salesOrderOData>PurchaseOrderByCustomer}",
      }
      
    ],
    getFilters: (controller) => {
      /*const oSalesOrderModel = controller.getModel("salesOrder") as JSONModel;
      const sSalesOrg = oSalesOrderModel.getProperty("/SalesOrganization");
      const sDistChannel = oSalesOrderModel.getProperty("/DistributionChannel");
      const aFilters: Filter[] = [];

      if (sSalesOrg) {
        aFilters.push(new Filter("SalesOrganization", FilterOperator.EQ, sSalesOrg));
      }

      if (sDistChannel) {
        aFilters.push(new Filter("DistributionChannel", FilterOperator.EQ, sDistChannel));
      }*/

      return [];
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens") as Token[];
      dialog.close();
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },
  soDocumentType: {
    key: "soDocumentType",
    title: "Sales Order",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.DocumentTypeValueHelp",
    modelName: "salesOrderTypeVH",
    tablePath: "salesOrderTypeVH>/C_SalesOrderTypeManageVH",
    keyField: "SalesOrderType",
    descriptionField: "SalesOrderType_Text",
    supportMultiselect: true,
    supportRanges: false,
    columns: [
      {
        label: "Sales Order Type",
        textBinding: "{salesOrderTypeVH>SalesOrderType}",
      },
      {
        label: "Sales Order Type",
        textBinding: "{salesOrderTypeVH>SalesOrderType_Text}",
      }
    ],
    getFilters: (controller) => {
      return [];
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens") as Token[];
      dialog.close();
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },

  salesDocumentUser: {
    key: "soDocumentType",
    title: "Created By",
    fragmentName: "com.eiffage.sdt.view.fragment.valueHelp.SalesDocumentUserValueHelp",
    modelName: "salesDocCreatedByVH",
    tablePath: "salesDocCreatedByVH>/C_SalesDocumentUserVH",
    keyField: "UserID",
    descriptionField: "SalesOrderType_Text",
    supportMultiselect: true,
    supportRanges: false,
    columns: [
      {
        label: "User",
        textBinding: "{salesDocCreatedByVH>UserID}",
      },
      {
        label: "User Name",
        textBinding: "{salesDocCreatedByVH>UserDescription}",
      }
    ],
    getFilters: (controller) => {
      return [];
    },
    ok: (event, dialog) => {
      const tokens = event.getParameter("tokens") as Token[];
      dialog.close();
    },
    cancel: (_event, dialog) => {
      dialog.close();
    },
  },
} satisfies Record<string, ValueHelpConfig>;