import MessageBox from "sap/m/MessageBox";
import View from "sap/ui/core/mvc/View";

export default class MessageBoxHelper {
  static confirm(
    oView: View,
    sMessage: string,
    sTitle?: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      MessageBox.confirm(sMessage, {
        title: sTitle,
        actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
        emphasizedAction: MessageBox.Action.OK,
        dependentOn: oView,
        onClose: (sAction: string) => {
          resolve(sAction === MessageBox.Action.OK);
        }
      });
    });
  }
}