import MessageBox from "sap/m/MessageBox";
import { MessageType, UiMessage } from "./ODataBatchResponseParser";

export class MessageDisplayService {
  public static show(
    message: UiMessage,
    navBack = false,
    onNavigateBack?: () => void
  ): void {
    const details = this.createDetails(message);

    const options = {
      actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
      title: message.title,
      details,
      onClose: (action: string | null): void => {
        if (action === MessageBox.Action.OK && navBack) {
          onNavigateBack?.();
        }
      }
    };

    switch (message.type) {
      case "Success":
        MessageBox.success(message.message, options);
        return;

      case "Warning":
        MessageBox.warning(message.message, options);
        return;

      case "Information":
        MessageBox.information(message.message, options);
        return;

      case "Error":
      default:
        MessageBox.error(message.message, options);
    }
  }

  public static showAll(
    messages: UiMessage[],
    navBackOnNoErrors = false,
    onNavigateBack?: () => void
  ): void {
    const hasErrors = messages.some(message => message.type === "Error");

    const primaryMessage =
      messages.find(message => message.type === "Error") ?? messages[0];

    if (!primaryMessage) {
      return;
    }

    const additionalMessages = messages
      .filter(message => message !== primaryMessage)
      .map(message => `${message.title}: ${message.message}`);

    const messageWithAdditionalDetails: UiMessage = {
      ...primaryMessage,
      details: [
        ...(primaryMessage.details ?? []),
        ...additionalMessages
      ]
    };

    this.show(
      messageWithAdditionalDetails,
      navBackOnNoErrors && !hasErrors,
      onNavigateBack
    );
  }

  public static showSuccess(
    messages: UiMessage[],
    navBack = false,
    onNavigateBack?: () => void
  ): void {
    const message =
      messages.find(message => message.type === "Success") ?? messages[0];

    if (!message) {
      return;
    }

    this.show(
      {
        type: message.type,
        title: message.title,
        message: message.message
      },
      navBack,
      onNavigateBack
    );
  }

  public static showError(message: string, title = "Error"): void {
    this.show({
      type: "Error",
      title,
      message
    });
  }

  private static createDetails(message: UiMessage): string | undefined {
    const details = [
      ...(message.details ?? []),
      message.code ? `Error code: ${message.code}` : undefined,
      message.statusCode ? `HTTP status: ${message.statusCode}` : undefined,
      message.transactionId
        ? `Transaction ID: ${message.transactionId}`
        : undefined
    ].filter((detail): detail is string => Boolean(detail));

    return details.length > 0 ? details.join("\n") : undefined;
  }
}

export type { MessageType, UiMessage };