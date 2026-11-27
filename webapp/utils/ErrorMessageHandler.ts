export type SapMessageSeverity = "error" | "warning" | "info" | "success" | string;

export interface SapGatewayApplication {
    componentId?: string;
    serviceNamespace?: string;
    serviceId?: string;
    serviceVersion?: string;
}

export interface SapGatewayErrorResolution {
    sapTransaction?: string;
    sapNote?: string;
    batchSapNote?: string;
}

export interface SapGatewayErrorDetail {
    contentId?: string;
    code: string;
    message: string;
    longtextUrl?: string;
    propertyRef?: string;
    severity: SapMessageSeverity;
    transition: boolean;
    target?: string;
}

export interface SapGatewayInnerError {
    application?: SapGatewayApplication;
    transactionId?: string;
    timestamp?: string;
    errorResolution?: SapGatewayErrorResolution;
    longtextUrl?: string;
    errorDetails: SapGatewayErrorDetail[];
}

export interface SapGatewayError {
    code: string;
    language?: string;
    message: string;
    innerError?: SapGatewayInnerError;
}

export interface SapGatewayErrorResponse {
    error: SapGatewayError;
}

export interface SapFlatMessage {
    code: string;
    message: string;
    severity: SapMessageSeverity;
    target?: string;
    propertyRef?: string;
    longtextUrl?: string;
    isRootError: boolean;
}

export interface Ui5ODataError {
    responseText?: string;
    response?: {
        body?: string;
    };
}

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord | undefined {
    return isRecord(value) ? value : undefined;
}

function asString(value: unknown): string | undefined {
    return typeof value === "string" ? value : undefined;
}

function asBoolean(value: unknown, fallback = false): boolean {
    return typeof value === "boolean" ? value : fallback;
}

function asArray(value: unknown): unknown[] {
    return Array.isArray(value) ? value : [];
}

function requiredString(
    source: JsonRecord,
    property: string,
    context: string
): string {
    const value = asString(source[property]);

    if (!value) {
        throw new Error(
            `Invalid SAP Gateway error payload: "${property}" is missing or is not a string in ${context}.`
        );
    }

    return value;
}

function deserializeApplication(value: unknown): SapGatewayApplication | undefined {
    const source = asRecord(value);

    if (!source) {
        return undefined;
    }

    return {
        componentId: asString(source.component_id),
        serviceNamespace: asString(source.service_namespace),
        serviceId: asString(source.service_id),
        serviceVersion: asString(source.service_version)
    };
}

function deserializeErrorResolution(
    value: unknown
): SapGatewayErrorResolution | undefined {
    const source = asRecord(value);

    if (!source) {
        return undefined;
    }

    return {
        sapTransaction: asString(source.SAP_Transaction),
        sapNote: asString(source.SAP_Note),
        batchSapNote: asString(source.Batch_SAP_Note)
    };
}

function deserializeErrorDetail(value: unknown): SapGatewayErrorDetail {
    const source = asRecord(value);

    if (!source) {
        throw new Error(
            "Invalid SAP Gateway error payload: errordetails contains a non-object entry."
        );
    }

    return {
        contentId: asString(source.ContentID),
        code: requiredString(source, "code", "errordetails"),
        message: requiredString(source, "message", "errordetails"),
        longtextUrl: asString(source.longtext_url),
        propertyRef: asString(source.propertyref),
        severity: asString(source.severity) ?? "error",
        transition: asBoolean(source.transition),
        target: asString(source.target)
    };
}

function deserializeInnerError(value: unknown): SapGatewayInnerError | undefined {
    const source = asRecord(value);

    if (!source) {
        return undefined;
    }

    return {
        application: deserializeApplication(source.application),
        transactionId: asString(source.transactionid),
        timestamp: asString(source.timestamp),
        errorResolution: deserializeErrorResolution(source.Error_Resolution),
        longtextUrl: asString(source.longtext_url),
        errorDetails: asArray(source.errordetails).map(deserializeErrorDetail)
    };
}

/**
 * Converts a SAP Gateway / OData V2 error body into a typed object.
 * Accepts either a raw JSON body string or an already-parsed object.
 */
export function deserializeSapGatewayError(
    input: string | unknown
): SapGatewayErrorResponse {
    let payload: unknown = input;

    if (typeof input === "string") {
        try {
            payload = JSON.parse(input);
        } catch {
            throw new Error(
                "Invalid SAP Gateway error payload: response body is not valid JSON."
            );
        }
    }

    const root = asRecord(payload);
    const error = root ? asRecord(root.error) : undefined;

    if (!error) {
        throw new Error(
            'Invalid SAP Gateway error payload: root property "error" is missing.'
        );
    }

    const messageObject = asRecord(error.message);
    const message = messageObject
        ? requiredString(messageObject, "value", "error.message")
        : requiredString(error, "message", "error");

    return {
        error: {
            code: requiredString(error, "code", "error"),
            language: messageObject ? asString(messageObject.lang) : undefined,
            message,
            innerError: deserializeInnerError(error.innererror)
        }
    };
}

/**
 * Extracts a typed SAP Gateway error from a UI5 OData V2 error callback object.
 */
export function deserializeUi5ODataError(
    error: Ui5ODataError
): SapGatewayErrorResponse {
    const responseBody = error.responseText ?? error.response?.body;

    if (!responseBody) {
        throw new Error("The UI5 OData error does not contain a response body.");
    }

    return deserializeSapGatewayError(responseBody);
}

/**
 * Returns the root error followed by every message in innererror.errordetails.
 */
export function getSapGatewayMessages(
    response: SapGatewayErrorResponse
): SapFlatMessage[] {
    const rootMessage: SapFlatMessage = {
        code: response.error.code,
        message: response.error.message,
        severity: "error",
        longtextUrl: response.error.innerError?.longtextUrl,
        isRootError: true
    };

    const details =
        response.error.innerError?.errorDetails.map((detail): SapFlatMessage => ({
            code: detail.code,
            message: detail.message,
            severity: detail.severity,
            target: detail.target,
            propertyRef: detail.propertyRef,
            longtextUrl: detail.longtextUrl,
            isRootError: false
        })) ?? [];

    return [rootMessage, ...details];
}

/**
 * Removes generic Gateway wrapper errors and duplicate messages.
 * Use this result for user-facing MessageBox or MessagePopover content.
 */
export function getActionableSapMessages(
    response: SapGatewayErrorResponse
): SapFlatMessage[] {
    const seen = new Set<string>();

    return getSapGatewayMessages(response).filter((message) => {
        if (message.code === "/IWBEP/CX_MGW_BUSI_EXCEPTION") {
            return false;
        }

        const key = `${message.severity}|${message.code}|${message.message}`;

        if (seen.has(key)) {
            return false;
        }

        seen.add(key);
        return true;
    });
}

export function hasSapGatewayErrors(response: SapGatewayErrorResponse): boolean {
    return getActionableSapMessages(response).some(
        (message) => message.severity.toLowerCase() === "error"
    );
}