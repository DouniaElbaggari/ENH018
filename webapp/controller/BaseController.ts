import Controller from "sap/ui/core/mvc/Controller";
import History from "sap/ui/core/routing/History";
import Router from "sap/ui/core/routing/Router";
import UIComponent from "sap/ui/core/UIComponent";
import Model from "sap/ui/model/Model";
import ResourceModel from "sap/ui/model/resource/ResourceModel";
import ResourceBundle from "sap/base/i18n/ResourceBundle";

/**
 * @namespace com.eiffage.sdt.controller
 */
export default class BaseController extends Controller {
  public getRouter(): Router {
    return (this.getOwnerComponent() as UIComponent).getRouter();
  }

  public getModel(sName?: string): Model {
    return this.getOwnerComponent()?.getModel(sName) as Model;
  }

  public setModel(oModel: Model, sName?: string): void {
    this.getView()?.setModel(oModel, sName);
  }

  public getResourceBundle(): ResourceBundle {
    const oI18nModel = (this.getOwnerComponent() as UIComponent).getModel(
      "i18n",
    ) as ResourceModel;
    return oI18nModel.getResourceBundle() as ResourceBundle;
  }

  public onNavBack(): void {
    const sPreviousHash = History.getInstance().getPreviousHash(),
      oRouter = this.getRouter();

    if (sPreviousHash !== undefined) {
      window.history.go(-1);
    } else {
      oRouter.navTo("master", {}, true /*no history*/);
    }
  }

  public getPage(pageId: string): any {
    return this.byId(pageId);
  }
}
