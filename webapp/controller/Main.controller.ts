import BaseController from "./BaseController";
import Sorter from "sap/ui/model/Sorter";
import SearchField from "sap/m/SearchField";
import FilterBar from "sap/ui/comp/filterbar/FilterBar";
import Fragment from "sap/ui/core/Fragment";
import ColumnListItem from "sap/m/ColumnListItem";
import Dialog from "sap/m/Dialog";
import ValueHelpDialog from "sap/ui/comp/valuehelpdialog/ValueHelpDialog";
import Filter from "sap/ui/model/Filter";
import FilterOperator from "sap/ui/model/FilterOperator";
import FilterType from "sap/ui/model/FilterType";
import Token from "sap/m/Token";
import type Event from "sap/ui/base/Event";
import Input from "sap/m/Input";
import MultiInput from "sap/m/MultiInput";
import type FilterGroupItem from "sap/ui/comp/filterbar/FilterGroupItem";
import JSONModel from "sap/ui/model/json/JSONModel";
import MessageBox from "sap/m/MessageBox";
import type ODataModelV2 from "sap/ui/model/odata/v2/ODataModel";
import Table from "sap/m/Table";
import type ListBinding from "sap/ui/model/ListBinding";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";
import { ValueHelpRegistry } from "../utils//ValueHelpRegistry";
import { VALUE_HELP_CONFIGS } from "../utils/valueHelpConfigs";
import FilterFactory from "../utils/filterFactory";
import formatter from "../utils/Formatter";
import Binding from "sap/ui/model/Binding";
import Column from "sap/m/Column";
import ColumnMenu from "sap/m/table/columnmenu/Menu";
import QuickSort from "sap/m/table/columnmenu/QuickSort";
import QuickSortItem from "sap/m/table/columnmenu/QuickSortItem";
import { SortOrder } from "sap/ui/core/library";

interface ContractItemText {
  LongTextID: string;
  LongText: string;
  Language: string;
}

interface ContractItem {
  SalesContractItem: string;
  Material: string;
  SalesContractItemText: string;
  to_Text?: {
    results?: ContractItemText[];
  };
}

interface ContractItemForTable extends ContractItem {
  LongText: string;
}

/**
 * @namespace com.eiffage.sdt.controller
 */
export default class Main extends BaseController {
  private _oOrderTypeDialog?: Dialog;
  private _oContractTypeDialog?: Dialog;
  private _oSalesContractDialog?: Dialog;
  private _oSalesOrderDialog?: Dialog;
  private _oContractItemDialog?: Dialog;
  private _oSalesOrgVHD?: ValueHelpDialog;
  private _oBasicSearchField!: SearchField;
  private _oBasicSearchFieldContracts: SearchField;
  private _valueHelpRegistry!: ValueHelpRegistry;
  public formatter = formatter;
  private readonly contractItemSelectionFragmentId = "contractItemSelection";
  private i18nModel!: ResourceModel;
  private resourceBundle!: ResourceBundle;

  /*eslint-disable @typescript-eslint/no-empty-function*/
  public onInit(): void {
    this.getRouter().getRoute("SalesOrders")?.attachPatternMatched(this._onPatternMatched, this);
    /*const oSalesOrdersTable = this.byId("salesOrdersTable");
   
    const oSalesContractsTable = this.byId("salesContractsTable");

    oSalesOrdersTable?.attachEventOnce("updateFinished", () => {
      const oSorter = new Sorter("SalesOrder", true);
      oSalesOrdersTable?.getBinding("items")?.sort(oSorter);
    });

    oSalesContractsTable?.attachEventOnce("updateFinished", () => {
      const oSorter = new Sorter("SalesContract", true);
      oSalesContractsTable?.getBinding("items")?.sort(oSorter);
    });*/

    this._initSalesOrderSortMenus();

    //Search field for Sales Orders
    const searchField = new SearchField({
      showSearchButton: true,
      search: this.onSearch.bind(this),
    });

    this._oBasicSearchField = searchField;

    const filterBar = this.byId("filterBar") as FilterBar;
    filterBar.setBasicSearch(this._oBasicSearchField);

    //Search field for Sales Contracts
    const searchFieldContracts = new SearchField({
      showSearchButton: true,
      search: this.onSearchContracts.bind(this),
    });

    this._oBasicSearchFieldContracts = searchFieldContracts;

    const filterBarContracts = this.byId("contractfilterBar") as FilterBar;
    filterBarContracts.setBasicSearch(this._oBasicSearchFieldContracts);


    this._valueHelpRegistry = new ValueHelpRegistry(this.getView(), this);

    this.i18nModel = this.getModel("i18n") as ResourceModel;
    this.resourceBundle = this.i18nModel.getResourceBundle() as ResourceBundle;
  }


  public onItemPress(oEvent: any): void {
    const oViewModel = this.getModel("viewModel");
    const item = oEvent.getParameter("listItem") as ColumnListItem;
    const salesOrder = item.getBindingContext("salesOrderOData")?.getObject().SalesOrder as string;

    this._clearData();

    oViewModel.setProperty("/mode", "Display");

    this.getRouter().navTo("SalesOrderDetails", {
      SalesOrder: salesOrder,
    });
  }

  public onCreateSalesOrder(): void {
    const oViewModel = this.getModel("viewModel");
    oViewModel.setProperty("/mode", "Create");
    this.getRouter().navTo("Create", {}, false);
  }

  public onCreateSalesContract(): void {
    const oViewModel = this.getModel("viewModel") as JSONModel;

    oViewModel.setProperty("/mode", "Create");

    this.getRouter().navTo("CreateContract", {}, false);
  }

  public onSearch(event: any): void {
    const filterBar = this.byId("filterBar") as FilterBar;
    this.applySearch(filterBar);
  }


  public onSearchContracts(event: any): void {
    const filterBar = this.byId("contractfilterBar") as FilterBar;
    this.applySearchContracts(filterBar);
  }

  public async onOpenOrderTypeDialog(): Promise<void> {
    this._clearData();
    const oDialog = await this.getOrderTypeDialog();
    oDialog?.open();
  }

  public async onOpenContractTypeDialog(): Promise<void> {
    this._clearData();
    const oDialog = await this.getContractTypeDialog();
    oDialog?.open();
  }

  public onCreateSalesOrderFromContract = async (): Promise<void> => {
    this._clearData();
    const oDialog = await this._getSalesContractDialog();
    oDialog?.open();
  }

  public onCreateSalesOrderFromSalesOrder = async (): Promise<void> => {
    this._clearData();
    const oDialog = await this._getSalesOrderDialog();
    oDialog?.open();
  }

  public onCreate(): void {
    const oViewModel = this.getModel("viewModel");
    this._clearData();
    this.getOrderTypeDialog().close();


    oViewModel.setProperty("/mode", "Create");
    this.getRouter().navTo("Main", {}, false);
  }

  public onCreateContract(): void {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    this._clearData();
    this.getContractTypeDialog().close();

    oViewModel.setProperty("/mode", "Create");
    this.getRouter().navTo("Main", {}, false);
  }

  public onCreateFromSalesContract = async (): void => {
    const oViewModel = this.getModel("viewModel");
    const oViewModelData = oViewModel.getData();
    const { salesOrderType, salesContract, salesContractType } = oViewModelData;

    try {
      const result = await this._validateContractSelection();

      if (result) {
        const oDialog = await this._getSalesContractDialog();
        oDialog.close();

        try {
          this.getView()?.setBusy(true);
          const results = await this._getContractItems(salesContract);
          const items = results.to_Item.results as ContractItem[];
          const preparedItems = this._prepareContractItems(items);
          const oContractItemsModel = new JSONModel({ results: preparedItems });

          this.getView()?.setModel(oContractItemsModel, "contractItem");

          const oDialog = await this._getContractItemDialog();
          oDialog.open();
        } catch (error) {
          //Add error handling here
        } finally {
          this.getView()?.setBusy(false);
        }
      } else {
        MessageBox.error(`Copying from sales document type ${salesContractType} to ${salesOrderType} is not supported`);
      }

    } catch (oError) {
      MessageBox.error(oError.error.message);
    }
    oViewModel.setProperty("/mode", "Create");
  }

  public onCreateFromSalesOrder = async (): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const sSalesOrder = oViewModel.getProperty("/salesOrder")

    const oDialog = await this._getSalesOrderDialog();
    oDialog.close();
    oViewModel.setProperty("/mode", "Create");

    this.getRouter().navTo("Create", {
      query: {
        createFromSalesOrder: true,
        salesOrder: sSalesOrder
      }
    });
  }

  public async onCloseCreateDialog(): Promise<void> {
    const oDialog = await this.getOrderTypeDialog();
    oDialog.close();
  }

  public async onCloseSalesContractDialog(): Promise<void> {
    const oDialog = await this._getSalesContractDialog();
    oDialog.close();
  }

  public async onCloseSalesOrderDialog(): Promise<void> {
    const oDialog = await this._getSalesOrderDialog();
    oDialog.close();
  }

  public async onSalesOrgVH(oEvent: Event): Promise<void> {
    const oMultiInput = oEvent.getSource() as MultiInput;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesOrgMultiple,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
    });
  }

  public async onSalesOrgSingleVH(oEvent: Event): Promise<void> {
    const oInput = oEvent.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesOrg,
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
          oSalesOrderModel.setProperty("/SalesOrganization", oSelectedToken.getKey());
          oDescriptionModel.setProperty("/salesOrgDescription", oSelectedToken.getText());
        }

        oDialog.close();
      },
    });
  }

  public async onDistrChannelVH(oEvent: Event): Promise<void> {
    const oMultiInput = oEvent.getSource() as MultiInput;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.distChannelMultiple,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public async onDistrChannelSingleVH(oEvent: Event): Promise<void> {
    const oInput = oEvent.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.distChannel,
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
          oSalesOrderModel.setProperty("/DistributionChannel", oSelectedToken.getKey());
          oDescriptionModel.setProperty("/distChannelName", oSelectedToken.getText());
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public async onDivisionVH(oEvent: Event): Promise<void> {
    const oMultiInput = oEvent.getSource() as MultiInput;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.divisionMultiple,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public async onDivisionSingleVH(oEvent: Event): Promise<void> {
    const oInput = oEvent.getSource() as Input;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.division,
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
          oSalesOrderModel.setProperty(
            "/OrganizationDivision",
            oSelectedToken.getKey(),
          );
          oDescriptionModel.setProperty(
            "/divisionName",
            oSelectedToken.getText(),
          );
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public async onSoldToVH(): Promise<void> {
    const oMultiInput = this.byId("soldToMultiInput") as MultiInput;
    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.soldTo,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onExit = (): void => {
    this._clearData();
  }

  public onSalesContractVH = async (oEvent: Event): void => {
    const oInput = oEvent.getSource() as Input;
    const oViewModel = this.getModel("viewModel");

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesContract,
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
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oViewModel.setProperty("/salesContractType", oObject.SalesContractType);
        }

        if (oSelectedToken) {
          oInput.setValue(oSelectedToken.getKey());
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onSalesOrderVH = async (oEvent: Event): void => {
    const oInput = oEvent.getSource() as Input;
    const oViewModel = this.getModel("viewModel");

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesOrder,
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
        const oVH = oEvent.getSource();
        const oTable = oVH.getTable();
        const iIndex = oTable.getSelectedIndex();
        const oContext = oTable.getContextByIndex(iIndex);
        const oObject = oContext.getObject();

        if (oObject) {
          oViewModel.setProperty("/salesContractType", oObject.SalesContractType);
        }

        if (oSelectedToken) {
          oInput.setValue(oSelectedToken.getKey());
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onDocumentTypeVH = async (oEvent: Event): void => {
    const oMultiInput = oEvent.getSource() as MultiInput;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.soDocumentType,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onCreatedBy = async (oEvent: Event): void => {
    const oMultiInput = oEvent.getSource() as MultiInput;

    const { dialog } = await this._valueHelpRegistry.open({
      ...VALUE_HELP_CONFIGS.salesDocumentUser,
      supportMultiselect: true,
      tokens: oMultiInput.getValue()
        ? [
          new Token({
            key: oMultiInput.getValue(),
            text: oMultiInput.getValue(),
          }),
        ]
        : [],
      ok: (oEvent: Event, oDialog) => {
        const aTokens = oEvent.getParameter("tokens") as sap.m.Token[];
        const oSelectedToken = aTokens[0];

        if (oSelectedToken) {
          oMultiInput.setTokens(aTokens);
        }

        oDialog.close();
      },
      cancel: (_oEvent: Event, oDialog) => {
        oDialog.close();
      },
    });
  }

  public onApplyContractItemSelection = async (oEvent: Event): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oTable = Fragment.byId(this.contractItemSelectionFragmentId, "contractItemSelection") as Table;
    const oContractItems = this.getModel("contractItemList") as JSONModel;
    const aItems = oContractItems.getProperty("/items");

    const aSelectedItems = oTable.getSelectedItems();

    if (aSelectedItems.length === 0) {
      MessageBox.error(this.resourceBundle.getText("contractItemSelection"));
      return;
    }

    const oDialog = await this._getContractItemDialog();
    oDialog.close();

    aSelectedItems.forEach((item) => {
      aItems.push(item.getBindingContext("contractItem")?.getObject().SalesContractItem);
    });

    oContractItems.setProperty("/items", aItems);

    this.getRouter().navTo("Create", {
      query: {
        createFromContract: true,
        salesContract: oViewModel.getProperty("/salesContract")
      }
    })
  }

  public onCloseContractItemDialog = async (oEvent: Event): void => {
    const oDialog = await this._getContractItemDialog();
    oDialog.close();
  }

  public onSearchContractItems(oEvent: Event): void {
    const searchField = oEvent.getSource() as SearchField;
    const query = searchField.getValue().trim();

    //const table = this.byId("contractItemTable") as Table;
    const oTable = Fragment.byId(this.contractItemSelectionFragmentId, "contractItemSelection") as Table;
    const binding = oTable.getBinding("items") as ListBinding;

    if (!binding) {
      return;
    }

    if (!query) {
      return;
    }

    const searchFilter = new Filter({
      filters: [
        new Filter(
          "LongText",
          FilterOperator.Contains,
          query
        ),
        new Filter(
          "SalesContractItemText",
          FilterOperator.Contains,
          query
        )
      ],
      and: false
    });
    //const filters = query ? [new Filter("LongText", FilterOperator.Contains, query)] : [];
    binding.filter(searchFilter, FilterType.Application);
  }

  public onDocumentTypeChange = (oEvent: Event): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const bIsSalesOrder = oViewModel.getProperty("/isSalesOrder");
    const bIsSalesContract = oViewModel.getProperty("/isSalesContract");

    oViewModel.setProperty("/isSalesOrder", !bIsSalesOrder);
    oViewModel.setProperty("/isSalesContract", !bIsSalesContract);
  }

  private _getContractItems = async (contractNo: string): Promise<object> => {
    const oContractModel = this.getModel("salesContract") as ODataModelV2;
    const sUrl = `/A_SalesContract('${contractNo}')`;

    return new Promise((resolve, reject) => {
      oContractModel.read(sUrl, {
        urlParameters: {
          $expand: "to_Item/to_Text",
          $select: "to_Item/SalesContractItem,to_Item/Material,to_Item/SalesContractItemText,to_Item/to_Text"
        },
        success: (response: object) => { resolve(response) },
        error: (error: object) => { reject(error) }
      });
    });
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

  private async getOrderTypeDialog(): Promise<Dialog> {
    if (!this._oOrderTypeDialog) {
      this._oOrderTypeDialog = (await Fragment.load({
        id: this.getView().getId(),
        name: "com.eiffage.sdt.view.fragment.OrderTypeSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oOrderTypeDialog);
    }

    return this._oOrderTypeDialog;
  }

  private async getContractTypeDialog(): Promise<Dialog> {
    if (!this._oContractTypeDialog) {
      this._oContractTypeDialog = (await Fragment.load({
        id: this.getView().getId(),
        name: "com.eiffage.sdt.view.fragment.contract.ContractTypeSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oContractTypeDialog);
    }

    return this._oContractTypeDialog;
  }

  private _getSalesContractDialog = async (): Promise<Dialog> => {
    if (!this._oSalesContractDialog) {
      this._oSalesContractDialog = (await Fragment.load({
        id: this.getView().getId(),
        name: "com.eiffage.sdt.view.fragment.CopyContractSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oSalesContractDialog);
    }

    return this._oSalesContractDialog;
  }

  private _getSalesOrderDialog = async (): Promise<Dialog> => {
    if (!this._oSalesOrderDialog) {
      this._oSalesOrderDialog = (await Fragment.load({
        id: this.getView().getId(),
        name: "com.eiffage.sdt.view.fragment.CopySalesOrderSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oSalesOrderDialog);
    }

    return this._oSalesOrderDialog;
  }

  private applySearch(filterBar: FilterBar): void {
    const oSalesOrdersTable = this.byId("salesOrdersTable") as Table;
    const aItems = filterBar.getFilterGroupItems();
    const oBinding = oSalesOrdersTable.getBinding("items") as Binding;
    const mFilters: Record<string, Filter | null> = {};
    const sFreeText = this._oBasicSearchField.getValue();

    aItems.forEach((item: FilterGroupItem) => {
      const oControl = filterBar.determineControlByFilterItem(item);
      const sKey = item.getName();

      if (oControl.getMetadata().getName() === "sap.m.MultiInput") {
        mFilters[sKey] = FilterFactory.fromTokens({
          path: sKey,
          tokens: oControl.getTokens(),
          operator: FilterOperator.EQ,
          and: false,
          useKey: true,
        });
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.MultiComboBox") {
        mFilters[sKey] = FilterFactory.fromMultiValues({
          path: sKey,
          values: oControl.getSelectedKeys(),
          operator: FilterOperator.EQ,
          and: false,
        });
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.Input") {
        mFilters[sKey] = FilterFactory.eq(sKey, oControl.getValue());
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.DatePicker") {
        const dateValue = oControl.getDateValue();
        if (dateValue) {
          // Convert to ISO date string (YYYY-MM-DD), ignoring time/timezone issues
          const year = dateValue.getFullYear();
          const month = `${dateValue.getMonth() + 1}`.padStart(2, "0");
          const day = `${dateValue.getDate()}`.padStart(2, "0");
          const odataDate = `${year}-${month}-${day}`;

          mFilters[sKey] = FilterFactory.eq(sKey, odataDate);
        } else {
          mFilters[sKey] = null;
        }
        return;
      }
      mFilters[sKey] = null;
    });

    const { SalesOrder, SoldToParty, SalesOrganizationForFilter, OrganizationDivision, RequestedDeliveryDate, OverallSDProcessStatus, SalesOrderType, CreatedByUser } = mFilters;

    const oCombinedFilter = FilterFactory.and([SalesOrder, SalesOrganizationForFilter, SoldToParty, OrganizationDivision, RequestedDeliveryDate, OverallSDProcessStatus, SalesOrderType, CreatedByUser]);

    oBinding.filter(FilterFactory.toArray(oCombinedFilter));

    if (sFreeText) {
      oBinding.changeParameters({ $search: sFreeText });
    }
  }

  private applySearchContracts(filterBar: FilterBar): void {
    const oSalesOrdersTable = this.byId("salesContractsTable") as Table;
    const aItems = filterBar.getFilterGroupItems();
    const oBinding = oSalesOrdersTable.getBinding("items") as Binding;
    const mFilters: Record<string, Filter | null> = {};
    const sFreeText = this._oBasicSearchFieldContracts.getValue();

    aItems.forEach((item: FilterGroupItem) => {
      const oControl = filterBar.determineControlByFilterItem(item);
      const sKey = item.getName();

      if (oControl.getMetadata().getName() === "sap.m.MultiInput") {
        mFilters[sKey] = FilterFactory.fromTokens({
          path: sKey,
          tokens: oControl.getTokens(),
          operator: FilterOperator.EQ,
          and: false,
          useKey: true,
        });
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.MultiComboBox") {
        mFilters[sKey] = FilterFactory.fromMultiValues({
          path: sKey,
          values: oControl.getSelectedKeys(),
          operator: FilterOperator.EQ,
          and: false,
        });
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.Input") {
        mFilters[sKey] = FilterFactory.eq(sKey, oControl.getValue());
        return;
      }

      if (oControl.getMetadata().getName() === "sap.m.DatePicker") {
        const dateValue = oControl.getDateValue();
        if (dateValue) {
          // Convert to ISO date string (YYYY-MM-DD), ignoring time/timezone issues
          const year = dateValue.getFullYear();
          const month = `${dateValue.getMonth() + 1}`.padStart(2, "0");
          const day = `${dateValue.getDate()}`.padStart(2, "0");
          const odataDate = `${year}-${month}-${day}`;

          mFilters[sKey] = FilterFactory.eq(sKey, odataDate);
        } else {
          mFilters[sKey] = null;
        }
        return;
      }
      mFilters[sKey] = null;
    });

    const { SalesContract, SoldToParty, SalesOrganizationForFilter, OrganizationDivision, CreatedByUser } = mFilters;

    const oCombinedFilter = FilterFactory.and([SalesContract, SalesOrganizationForFilter, SoldToParty, OrganizationDivision, CreatedByUser]);

    oBinding.filter(FilterFactory.toArray(oCombinedFilter));

    if (sFreeText) {
      oBinding.changeParameters({ $search: sFreeText });
    }
  }

  private _validateContractSelection = async (): Promise<boolean> => {
    const oViewModel = this.getModel("viewModel");
    const oModel = this.getModel("billingDoc");
    const sUrl = '/ValidateContractOrderType';

    return new Promise((resolve, reject) => {
      oModel.callFunction(sUrl, {
        method: "GET",
        urlParameters: {
          SalesContractType: oViewModel.getProperty('/salesContractType'),
          SalesOrderType: oViewModel.getProperty('/salesOrderType')
        },
        success: (oData: object) => { resolve(oData.ValidateContractOrderType.Allowed) },
        error: (oError: object) => { reject(oError) }
      });
    })
  }

  private _clearData = (): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    const oSalesOrderModel = this.getModel("salesOrder") as JSONModel;
    const oTrackingModel = this.getModel("trackingData") as JSONModel;
    const oDescriptionModel = this.getModel("descriptions") as JSONModel;

    oViewModel.setProperty("/mode", "Display");
    oViewModel.setProperty("/isSigned", false);

    /*UoViewModel.setData({
      mode: "",
      salesOrder: "",
      shipToMoreDetails: false,
      billToMoreDetails: false,
      payerMoreDetails: false,
      pricingProcedure: "",
      pricingProcedurePending: false,
      periodicCalendar: false,
      milestoneCalendar: true,
      billingDocument: "",
    });*/

    oSalesOrderModel.setData({
      SalesOrder: "",
      SalesOrderType: "",
      SoldToParty: "",
      BillingDocumentDate: "",
      TotalNetAmount: "0.00",
      SalesOrganization: "",
      //salesOrgDescription: "",
      DistributionChannel: "",
      OrganizationDivision: "",
      IncotermsVersion: "",
      CustomerPriceGroup: "",
      PaymentMethod: "",
      TransactionCurrency: "",
      SDDocumentReason: "",
      to_BillingPlan: {},
      to_Item: [],
      to_Text: [],
      to_PricingElement: [],
      to_Partner: []
    })

    oTrackingModel.setData({
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
    });

    oDescriptionModel.setData({
      salesOrgDescription: "",
      customerName: "",
      distChannelName: "",
      divisionName: "",
      orderReasonText: ""
    })

    this._salesOrderRefresh();
  }

  private _getContractItemDialog = async (): Promise<Dialog> => {
    if (!this._oContractItemDialog) {
      this._oContractItemDialog = (await Fragment.load({
        id: this.contractItemSelectionFragmentId,
        name: "com.eiffage.sdt.view.fragment.ContractItemSelection",
        controller: this,
      })) as Dialog;

      this.getView().addDependent(this._oContractItemDialog);
    }

    return this._oContractItemDialog;
  }

  private _prepareContractItems(items: ContractItem[]): ContractItemForTable[] {
    return items.map((item) => {
      const longText =
        item.to_Text?.results?.find(
          (text) => text.LongTextID === '0001' || 'ZSI1'
        )?.LongText ?? "";

      return {
        ...item,
        LongText: longText
      };
    });
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

  private _salesOrderRefresh = (): void => {
    const oTable = this.byId("salesOrdersTable");
    const oBinding = oTable.getBinding("items");

    if (oBinding) {
      oBinding.refresh();
    }
  }

  private _onPatternMatched = (oEvent: Event): void => {
    const oViewModel = this.getModel("viewModel") as JSONModel;
    //oViewModel.setProperty("/detailFragMode", undefined);
    //oViewModel.setProperty("/itemFragMode", undefined);
    this._salesOrderRefresh();
  }

  private _initSalesOrderSortMenus(): void {
    const oTable = this.byId("salesOrdersTable") as Table;
    //const oColumn = this.byId("salesOrderColumn") as Column;

    const aSortConfigs = [
      {
        columnId: "salesOrderColumn",
        path: "SalesOrder",
        label: "Sales Order"
      },
      {
        columnId: "documentDateColumn",
        path: "SalesOrderDate",
        label: "Document Date"
      }
    ];


    const aSortColumns = aSortConfigs.map((oConfig) => ({
      ...oConfig,
      column: this.byId(oConfig.columnId) as Column,
      sortItem: new QuickSortItem({
        key: oConfig.path,
        label: oConfig.label,
        sortOrder: SortOrder.None
      })
    }));

    aSortColumns.forEach((oConfig) => {
      const oMenu = new ColumnMenu({
        quickActions: [
          new QuickSort({
            items: [oConfig.sortItem],

            change: (oEvent: Event) => {
              const oBinding = oTable.getBinding("items") as
                | ListBinding
                | undefined;

              if (!oBinding) {
                return;
              }

              const sSortOrder = oEvent.getParameter("item").getSortOrder();

              const bSorted =
                sSortOrder === SortOrder.Ascending ||
                sSortOrder === SortOrder.Descending;

              oBinding.sort(
                bSorted
                  ? [
                    new Sorter(
                      oConfig.path,
                      sSortOrder === SortOrder.Descending
                    )
                  ]
                  : []
              );

              // Synchronize all indicators and menu selections.
              aSortColumns.forEach((oEntry) => {
                const sOrder =
                  oEntry === oConfig && bSorted
                    ? sSortOrder
                    : SortOrder.None;

                oEntry.column.setSortIndicator(sOrder);
                oEntry.sortItem.setSortOrder(sOrder);
              });
            }
          })
        ]
      });

      oConfig.column.addDependent(oMenu);
      oConfig.column.setHeaderMenu(oMenu);
    });
  }
}
