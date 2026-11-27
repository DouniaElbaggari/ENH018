import BaseController from "../BaseController";
import type { SalesOrderItem } from "../../model/types";
import MessageBox from "sap/m/MessageBox"
import formatter from "../../utils/Formatter";
import JSONModel from "sap/ui/model/json/JSONModel";
import type Event from "sap/ui/base/Event";

/**
 * @namespace com.eiffage.sdt.controller
 */

export default class AdvanceInvoice extends BaseController {
    public onInit = (): void => {
        this.getPage("advancePage").setShowFooter(true);
        this.getRouter().getRoute("CreateAdvanceInvoice")?.attachPatternMatched(this._onPatternMatched, this);
    }

    public onSave = (): void => { }
    public onCancel = (): void => {
        MessageBox.confirm("Are you sure you want to cancel", {
            actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
            emphasizedAction: MessageBox.Action.OK,
            onClose: (sAction) => {
                if (sAction === "OK") {
                    window.history.back();
                }
            },
            dependentOn: this.getView(),
        });
    }

    private _onPatternMatched = (oEvent: Event): void => { }
}