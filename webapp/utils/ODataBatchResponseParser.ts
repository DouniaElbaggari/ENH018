export type MessageType = "Success" | "Error" | "Warning" | "Information";

export interface UiMessage {
  type: MessageType;
  title: string;
  message: string;
  statusCode?: number;
  code?: string;
  details?: string[];
  transactionId?: string;
}

interface SapMessage {
  code?: string;
  message?: string;
  severity?: string;
  target?: string;
  details?: SapMessage[];
}

interface SapErrorDetail {
  code?: string;
  message?: string;
  severity?: string;
  target?: string;
}

interface SapODataError {
  error?: {
    code?: string;
    message?: {
      lang?: string;
      value?: string;
    };
    innererror?: {
      transactionid?: string;
      errordetails?: SapErrorDetail[];
    };
  };
}

export interface ODataChangeResponse {
  $reported?: boolean;
  body?: string;
  headers?: Record<string, string>;
  statusCode?: string | number;
  statusText?: string;
}

export interface ODataBatchResponse {
  $reported?: boolean;
  message?: string;

  response?: {
    body?: string;
    statusCode?: string | number;
    statusText?: string;
    headers?: Record<string, string>;
  };

  __changeResponses?: ODataChangeResponse[];
}

export interface ODataBatchResult {
  __batchResponses?: ODataBatchResponse[];
}

interface NormalizedResponse {
  body?: string;
  headers?: Record<string, string>;
  statusCode?: string | number;
  statusText?: string;
  fallbackMessage?: string;
}

export class ODataBatchResponseParser {
  private static readonly SUCCESS_STATUS_CODES = new Set([
    200,
    201,
    202,
    204
  ]);

  public static getMessages(result: ODataBatchResult | undefined | null): UiMessage[] | undefined {
    const batchResponses = result?.__batchResponses ?? [];

    if (batchResponses.length === 0) return; 
     
      /*[
        {
          type: "Error",
          title: "Request failed",
          message: "The server returned no batch response."
        }
      ];
    }*/

    return batchResponses.flatMap((batchResponse) =>
      this.createMessagesFromBatchResponse(batchResponse)
    );
  }

  public static getPrimaryMessage(result: ODataBatchResult | undefined | null): UiMessage {
    const messages = this.getMessages(result);

    return (
      messages.find((message) => message.type === "Error") ??
      messages.find((message) => message.type === "Warning") ??
      messages[0] ?? {
        type: "Error",
        title: "Request failed",
        message: "No response was received from the server."
      }
    );
  }

  public static hasErrors(result: ODataBatchResult | undefined | null): boolean {
    return this.getMessages(result).some(
      (message) => message.type === "Error"
    );
  }

  public static hasWarnings(result: ODataBatchResult | undefined | null): boolean {
    return this.getMessages(result).some(
      (message) => message.type === "Warning"
    );
  }

  public static hasSuccess(result: ODataBatchResult | undefined | null): boolean {
    return this.getMessages(result).some(
      (message) => message.type === "Success"
    );
  }

  private static createMessagesFromBatchResponse(
    batchResponse: ODataBatchResponse
  ): UiMessage[] {
    const changeResponses = batchResponse.__changeResponses ?? [];

    if (changeResponses.length > 0) {
      return changeResponses.map((changeResponse) =>
        this.createMessageFromResponse({
          body: changeResponse.body,
          headers: changeResponse.headers,
          statusCode: changeResponse.statusCode,
          statusText: changeResponse.statusText,
          fallbackMessage: batchResponse.message
        })
      );
    }

    return [
      this.createMessageFromResponse({
        body: batchResponse.response?.body,
        headers: batchResponse.response?.headers,
        statusCode: batchResponse.response?.statusCode,
        statusText: batchResponse.response?.statusText,
        fallbackMessage: batchResponse.message
      })
    ];
  }

  private static createMessageFromResponse(
    response: NormalizedResponse
  ): UiMessage {
    const statusCode = this.parseStatusCode(response.statusCode);
    const sapMessage = this.parseSapMessage(response.headers);

    if (sapMessage) {
      return this.createMessageFromSapMessage(
        sapMessage,
        statusCode,
        response.statusText
      );
    }

    if (
      statusCode !== undefined &&
      this.SUCCESS_STATUS_CODES.has(statusCode)
    ) {
      return {
        type: "Success",
        title: "Request successful",
        message: this.getSuccessMessage(statusCode),
        statusCode
      };
    }

    return this.createErrorMessage(
      statusCode,
      response.statusText,
      response.body,
      response.fallbackMessage
    );
  }

  private static createMessageFromSapMessage(
    sapMessage: SapMessage,
    statusCode: number | undefined,
    statusText: string | undefined
  ): UiMessage {
    const type = this.getMessageTypeFromSeverity(sapMessage.severity);

    return {
      type,
      title: this.getMessageTitle(type, statusCode),
      message:
        sapMessage.message ??
        statusText ??
        "The server returned a message.",
      statusCode,
      code: sapMessage.code,
      details: this.getSapMessageDetails(
        sapMessage.details ?? [],
        sapMessage.message
      )
    };
  }

  private static createErrorMessage(
    statusCode: number | undefined,
    statusText: string | undefined,
    responseBody: string | undefined,
    fallbackMessage: string | undefined
  ): UiMessage {
    const sapError = this.parseSapError(responseBody);
    const rootError = sapError?.error;

    const mainMessage =
      rootError?.message?.value ??
      fallbackMessage ??
      statusText ??
      "The request could not be completed.";

    return {
      type: "Error",
      title: this.getErrorTitle(statusCode),
      message: mainMessage,
      statusCode,
      code: rootError?.code,
      transactionId: rootError?.innererror?.transactionid,
      details: this.getDistinctErrorDetails(
        rootError?.innererror?.errordetails ?? [],
        mainMessage
      )
    };
  }

  private static parseSapMessage(
    headers: Record<string, string> | undefined
  ): SapMessage | undefined {
    if (!headers) {
      return undefined;
    }

    const sapMessageHeader = Object.entries(headers).find(
      ([headerName]) => headerName.toLowerCase() === "sap-message"
    )?.[1];

    if (!sapMessageHeader) {
      return undefined;
    }

    try {
      return JSON.parse(sapMessageHeader) as SapMessage;
    } catch {
      return undefined;
    }
  }

  private static parseSapError(
    responseBody: string | undefined
  ): SapODataError | undefined {
    if (!responseBody) {
      return undefined;
    }

    try {
      return JSON.parse(responseBody) as SapODataError;
    } catch {
      return undefined;
    }
  }

  private static parseStatusCode(
    statusCode: string | number | undefined
  ): number | undefined {
    if (statusCode === undefined || statusCode === null) {
      return undefined;
    }

    const parsedStatusCode = Number(statusCode);

    return Number.isFinite(parsedStatusCode)
      ? parsedStatusCode
      : undefined;
  }

  private static getMessageTypeFromSeverity(
    severity: string | undefined
  ): MessageType {
    switch (severity?.toLowerCase()) {
      case "success":
        return "Success";

      case "warning":
        return "Warning";

      case "information":
      case "info":
        return "Information";

      case "error":
      case "abort":
      case "termination":
      default:
        return "Error";
    }
  }

  private static getMessageTitle(
    type: MessageType,
    statusCode: number | undefined
  ): string {
    switch (type) {
      case "Success":
        return "Request successful";

      case "Warning":
        return "Warning";

      case "Information":
        return "Information";

      case "Error":
      default:
        return this.getErrorTitle(statusCode);
    }
  }

  private static getSapMessageDetails(
    details: SapMessage[],
    mainMessage: string | undefined
  ): string[] {
    const messages = details
      .map((detail) => detail.message?.trim())
      .filter((message): message is string => Boolean(message))
      .filter((message) => message !== mainMessage);

    return [...new Set(messages)];
  }

  private static getDistinctErrorDetails(
    errorDetails: SapErrorDetail[],
    mainMessage: string
  ): string[] {
    const messages = errorDetails
      .filter((detail) => detail.severity?.toLowerCase() === "error")
      .map((detail) => detail.message?.trim())
      .filter((message): message is string => Boolean(message))
      .filter((message) => message !== mainMessage);

    return [...new Set(messages)];
  }

  private static getSuccessMessage(statusCode: number): string {
    switch (statusCode) {
      case 200:
        return "The request was completed successfully.";

      case 201:
        return "The record was created successfully.";

      case 202:
        return "The request was accepted and is being processed.";

      case 204:
        return "The record was updated or deleted successfully.";

      default:
        return "The request was completed successfully.";
    }
  }

  private static getErrorTitle(
    statusCode: number | undefined
  ): string {
    switch (statusCode) {
      case 400:
        return "Invalid request";

      case 401:
        return "Authentication required";

      case 403:
        return "Access denied";

      case 404:
        return "Not found";

      case 409:
        return "Conflict";

      case 412:
        return "Data changed";

      case 429:
        return "Too many requests";

      case 500:
        return "Server error";

      case 501:
        return "Operation not supported";

      case 503:
        return "Service unavailable";

      default:
        return "Request failed";
    }
  }
}