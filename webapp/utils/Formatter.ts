import DateFormat from "sap/ui/core/format/DateFormat";

const oDateTimeFormat = DateFormat.getDateInstance({
  pattern: "dd MMM yyyy"
});

const formatter = {
  formatDocumentDate(vDate: string | Date | null | undefined): string {
    if (!vDate) {
      return "";
    }

    const oDate = vDate instanceof Date ? vDate : new Date(vDate);
    return oDateTimeFormat.format(oDate);
  },

  salesOrderItemDisplay(sSalesOrderItem?: string): string {
    if (!sSalesOrderItem) {
      return "";
    }

    return sSalesOrderItem.replace(/^0+(?=\d)/, "");
  },

  formatLongTextById(oTextCollection: any, sTextId: string): string {
    const aTexts = oTextCollection?.results ?? [];

    const oText = aTexts.find(
      (oT: any) => oT.LongTextID === sTextId || "ZSI1"
    );

    return oText?.LongText ?? "";
  },

  getOverallSDProcessingStatus(status: string): string {

    const statuses = {
      "": { text: "Not Relevant" },
      A: { text: "Open" },
      B: { text: "In Process" },
      C: { text: "Completed" },
    };

    return statuses[status]?.text;

  }
}
export default formatter;