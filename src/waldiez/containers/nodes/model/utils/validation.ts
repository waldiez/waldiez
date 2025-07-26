/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType, WaldiezModelAWS, WaldiezNodeModelData } from "@waldiez/models";
import { awsSignatureUtils } from "@waldiez/utils/awsSignature";

/**
 * Validation message enum for model validation
 */
export enum ValidationMessage {
    ValidationSuccess = "Model validated successfully",
    MissingBaseUrl = "Missing base URL",
    MissingApiKey = "Missing API key",
    MissingModelName = "Missing model name",
    MissingApiVersion = "Missing Azure API version",
    ModelNotFound = "Model not found",
    ApiError = "API error",
    AzureApiError = "Azure API error",
    ModelFetchFailed = "Model fetch failed",
    InvalidResponse = "Invalid response",
    CouldNotFetchModel = "Could not fetch model",
    CouldNotGetAResponse = "Could not get a response from the model's endpoint",
    UnknownError = "Unknown error",
}

/**
 * Validation result type
 */
type ValidationResult = {
    success: boolean;
    message: ValidationMessage;
    details?: string;
};

/**
 * Base URL mappings for different API types
 */
export const baseUrlsMapping: Record<WaldiezModelAPIType, string> = {
    openai: "https://api.openai.com/v1",
    google: "https://generativelanguage.googleapis.com/v1beta",
    anthropic: "https://api.anthropic.com/v1",
    cohere: "https://api.cohere.com/v1",
    deepseek: "https://api.deepseek.com",
    mistral: "https://api.mistral.ai/v1",
    groq: "https://api.groq.com/openai/v1",
    together: "https://api.together.xyz/v1",
    nim: "https://integrate.api.nvidia.com/v1",
    bedrock: "https://bedrock.{region}.amazonaws.com",
    azure: "",
    other: "",
};

/**
 * API paths for listing models
 */
const modelListPaths: Record<WaldiezModelAPIType, string> = {
    openai: "/models",
    azure: "/openai/deployments",
    deepseek: "/models",
    google: "/models",
    anthropic: "/models",
    cohere: "/models",
    mistral: "/models",
    groq: "/models",
    together: "/models",
    nim: "/models",
    other: "/v1/models",
    bedrock: "",
};

/**
 * API types that support direct model lookup
 */
const supportsDirectLookup: WaldiezModelAPIType[] = [
    "openai",
    "google",
    "groq",
    "anthropic",
    "cohere",
    "mistral",
    "nim",
    "other", // should be openai compatible
];

/**
 * Timeout value for fetch requests in milliseconds
 */
const FETCH_TIMEOUT_MS = 4000;

/**
 * Validate a model configuration
 * @param model - The model configuration to validate
 * @returns Validation result
 */
export const validateModel = async (model: WaldiezNodeModelData): Promise<ValidationResult> => {
    // Validate model inputs first
    const validation = validateModelInputs(model);
    if (!validation.success || !validation.details) {
        return validation;
    }

    // Build request configuration
    const { url, headers } = buildRequestConfig(model, validation.details);

    // Choose validation strategy based on API type
    if (model.apiType === "azure") {
        return validateAzureModel(url, headers, model.label.trim());
    }
    if (model.apiType === "bedrock") {
        return validateBedrockModel(headers, model.label.trim(), model.aws);
    }

    if (supportsDirectLookup.includes(model.apiType)) {
        return validateDirectModel(url, headers, model.label.trim());
    }

    return validateFallbackModel(url, headers, model.label.trim());
};

/**
 * Validate the base URL for a model
 * @param model - The model configuration to validate
 * @returns Validation result with base URL in details if successful
 */
const validateModelBaseUrl = (model: WaldiezNodeModelData): ValidationResult => {
    // Check if base URL is required but missing
    if (["azure", "other"].includes(model.apiType) && !model.baseUrl) {
        return { success: false, message: ValidationMessage.MissingBaseUrl };
    }

    // Determine base URL to use
    let baseUrl = model.baseUrl || baseUrlsMapping[model.apiType];
    if (["azure", "other"].includes(model.apiType) && model.baseUrl) {
        baseUrl = model.baseUrl;
    }

    // Validate base URL is not empty
    if (!baseUrl.trim()) {
        return { success: false, message: ValidationMessage.MissingBaseUrl };
    }

    return {
        success: true,
        message: ValidationMessage.ValidationSuccess,
        details: baseUrl,
    };
};

/**
 * Validate all required model inputs
 * @param model - The model configuration to validate
 * @returns Validation result
 */
const validateModelInputs = (model: WaldiezNodeModelData): ValidationResult => {
    // Validate base URL
    const { success, message, details } = validateModelBaseUrl(model);
    if (!success) {
        return { success, message, details };
    }

    // Validate API key
    if (!model.apiKey) {
        return { success: false, message: ValidationMessage.MissingApiKey };
    }

    // Validate model name
    if (!model.label.trim()) {
        return { success: false, message: ValidationMessage.MissingModelName };
    }

    // Validate Azure API version if needed
    if (model.apiType === "azure" && !model.apiVersion) {
        return { success: false, message: ValidationMessage.MissingApiVersion };
    }

    return { success: true, message, details };
};

/**
 * Build request configuration for API call
 * @param model - The model configuration
 * @param baseUrl - The validated base URL
 * @returns Request configuration with URL and headers
 */
const buildRequestConfig = (model: WaldiezNodeModelData, baseUrl: string) => {
    // Normalize base URL (remove trailing slash)
    const base = baseUrl.replace(/\/$/, "");

    // Build full URL
    let url = base + modelListPaths[model.apiType];

    // Prepare headers from model's default headers
    const headers: Record<string, string> = Object.fromEntries(
        Object.entries(model.defaultHeaders || {}).map(([key, value]) => [key, String(value)]),
    );

    // Add authentication headers based on API type
    if (model.apiType === "azure") {
        url += `?api-version=${model.apiVersion}`;
        headers["api-key"] = model.apiKey!;
    } else if (model.apiKey) {
        headers["Authorization"] = `Bearer ${model.apiKey}`;
    }

    return { url, headers };
};

/**
 * Validate an Azure model
 * @param url - API URL
 * @param headers - Request headers
 * @param modelName - Model name to validate
 * @returns Validation result
 */
const validateAzureModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    try {
        const res = await fetchWithTimeout(url, { method: "GET", headers });

        if (!res.ok) {
            return { success: false, message: ValidationMessage.AzureApiError };
        }

        const data = await res.json();
        const found = Array.isArray(data.data) && data.data.some((d: any) => d.id === modelName);

        return found
            ? { success: true, message: ValidationMessage.ValidationSuccess }
            : { success: false, message: ValidationMessage.ModelNotFound };
    } catch (error) {
        return handleFetchError(error);
    }
};
/**
 * Validate a bedrock model
 * @param additionalHeaders - Additional headers for the request
 * @param modelName - Model name to validate
 * @param aws - AWS configuration
 * @returns Validation result
 */
const validateBedrockModel = async (
    additionalHeaders: Record<string, string>,
    modelName: string,
    aws?: WaldiezModelAWS | null,
) => {
    const configValidation = validateAwsConfig(aws);
    if (!configValidation.success) {
        return configValidation;
    }
    const { region, accessKey, secretKey, sessionToken } = aws!;
    const service = "bedrock";
    const url = `https://${service}.${region}.amazonaws.com/foundation-models/${encodeURIComponent(modelName)}`;
    const method = "GET";
    try {
        const headers = await awsSignatureUtils.signRequest(
            method,
            url,
            region!,
            service,
            accessKey!,
            secretKey!,
            sessionToken,
            additionalHeaders,
        );
        const response = await fetchWithTimeout(url, {
            method,
            headers,
        });
        return await parseBedrockResponse(response, modelName, region!);
    } catch (error) {
        return handleFetchError(error);
    }
};

/**
 * Validate a model using direct lookup
 * @param url - API URL
 * @param headers - Request headers
 * @param modelName - Model name to validate
 * @returns Validation result
 */
const validateDirectModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    try {
        const modelUrl = `${url}/${encodeURIComponent(modelName)}`;
        const res = await fetchWithTimeout(modelUrl, { method: "GET", headers });

        if (!res.ok) {
            return parseErrorResponse(res);
        }

        return { success: true, message: ValidationMessage.ValidationSuccess };
    } catch (error) {
        return handleFetchError(error);
    }
};

/**
 * Validate a model using list endpoint and filtering
 * @param url - API URL
 * @param headers - Request headers
 * @param modelName - Model name to validate
 * @returns Validation result
 */

const validateFallbackModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    try {
        const res = await fetchWithTimeout(url, { method: "GET", headers });

        if (!res.ok) {
            return parseErrorResponse(res);
        }

        let data: { data: any[] } = { data: [] };

        try {
            data = await res.json();
        } catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                message: ValidationMessage.CouldNotFetchModel,
                details,
            };
        }

        const found = Array.isArray(data.data) && data.data.some((d: any) => d.id === modelName);

        return found
            ? { success: true, message: ValidationMessage.ValidationSuccess }
            : { success: false, message: ValidationMessage.ModelNotFound };
    } catch (error) {
        return handleFetchError(error);
    }
};

/**
 * Fetch with timeout
 * @param url - API URL
 * @param options - Fetch options
 * @returns Response
 */
const fetchWithTimeout = async (url: string, options: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

/**
 * Parse error response from API
 * @param res - Error response
 * @returns Validation result
 */
const parseErrorResponse = async (res: Response): Promise<ValidationResult> => {
    try {
        const errorBody = await res.json().catch(() => ({}));
        const errorDetails = errorBody?.error?.message || res.statusText || ValidationMessage.UnknownError;

        let errorMessage: ValidationMessage = ValidationMessage.ApiError;
        if (res.status === 404) {
            errorMessage = ValidationMessage.ModelNotFound;
        }

        return { success: false, message: errorMessage, details: errorDetails };
    } catch (error) {
        return handleFetchError(error);
    }
};

/**
 * Handle fetch errors
 * @param error - Error object
 * @returns Validation result
 */
const handleFetchError = (error: unknown): ValidationResult => {
    const isAbortError = error instanceof DOMException && error.name === "AbortError";
    const errorMessage = isAbortError
        ? ValidationMessage.CouldNotGetAResponse
        : ValidationMessage.UnknownError;

    const details = error instanceof Error ? error.message : String(error);

    return {
        success: false,
        message: errorMessage,
        details,
    };
};

/**
 * Validate AWS configuration
 * @param aws - AWS configuration
 * @returns Validation result
 */
const validateAwsConfig = (aws?: WaldiezModelAWS | null): ValidationResult => {
    if (!aws) {
        return {
            success: false,
            message: ValidationMessage.ModelFetchFailed,
            details: "Missing AWS configuration",
        };
    }

    const { region, accessKey, secretKey } = aws;

    if (!region || !accessKey || !secretKey) {
        return {
            success: false,
            message: ValidationMessage.ModelFetchFailed,
            details: "Missing required AWS credentials (region, accessKey, or secretKey)",
        };
    }

    return {
        success: true,
        message: ValidationMessage.ValidationSuccess,
    };
};

/**
 * Parse Bedrock API response
 */
const parseBedrockResponse = async (
    response: Response,
    modelName: string,
    region: string,
): Promise<ValidationResult> => {
    if (response.ok) {
        return {
            success: true,
            message: ValidationMessage.ValidationSuccess,
            details: `Model ${modelName} is available in region ${region}`,
        };
    }

    // Handle error responses
    if (response.status === 404) {
        return {
            success: false,
            message: ValidationMessage.ModelNotFound,
            details: `Model ${modelName} not found in region ${region}`,
        };
    } else if (response.status === 403) {
        return {
            success: false,
            message: ValidationMessage.ApiError,
            details: `Not authorized to access model ${modelName} in region ${region}`,
        };
    }

    // Try to get more details from the error response
    try {
        const errorData = await response.text();
        return {
            success: false,
            message: ValidationMessage.ApiError,
            details: `Error (${response.status}): ${errorData}`,
        };
    } catch (_) {
        return {
            success: false,
            message: ValidationMessage.ApiError,
            details: `Error (${response.status})`,
        };
    }
};
/*
|**Tested**| **Provider**     | **List Models Endpoint**                     | **Get Specific Model Endpoint**             | **Auth Header**             | **Documentation Link**                                                                 |
|----------|------------------|----------------------------------------------|---------------------------------------------|-----------------------------|----------------------------------------------------------------------------------------|
|---False--| **OpenAI**       | `/v1/models`                                 | `/v1/models/{model}`                        | `Authorization: Bearer`     | [OpenAI Models](https://platform.openai.com/docs/api-reference/models/list)            |
|---False--| **Azure**        | `/openai/deployments?api-version={version}   | N/A (uses deployment name)                  | `api-key`                   | [Azure OpenAI](https://learn.microsoft.com/en-us/azure/ai-services/openai/)            |
|---True---| **DeepSeek**     | `/models`                                    | N/A                                         | `Authorization: Bearer`     | [DeepSeek Docs](https://api-docs.deepseek.com/api/list-models)                                            |
|---False--| **Google**       | `/v1beta/models`                             | `/v1beta/models/{model}`                    | `Authorization: Bearer`     | [Google PaLM](https://developers.generativeai.google/api/rest/v1beta/models)           |
|---False--| **Anthropic**    | `/v1/models`                                 | N/A                                         | `Authorization: Bearer`     | [Anthropic API](https://docs.anthropic.com/)                                           |
|---False--| **Cohere**       | `/v1/models`                                 | `/v1/models/{model}`                        | `Authorization: Bearer`     | [Cohere List](https://docs.cohere.com/v2/reference/list-models), [Get](https://docs.cohere.com/v2/reference/get-model) |
|---False--| **Mistral**      | `/v1/models`                                 | `/v1/models/{model}`                        | `Authorization: Bearer`     | [Mistral API](https://docs.mistral.ai/)                                                |
|---False--| **Groq**         | `/openai/v1/models`                          | `/openai/v1/models/{model}`                 | `Authorization: Bearer`     | [Groq API](https://docs.groq.com/, https://console.groq.com/docs/api-reference#models-list, https://console.groq.com/docs/api-reference#models-retrieve, )                                                     |
|---False--| **Together**     | `/v1/models`                                 | N/A                                         | `Authorization: Bearer`     | [Together API](https://docs.together.ai/docs/openai-api-compatibility, https://docs.together.ai/reference/models-1)                                             |
|---False--| **NIM (NVIDIA)** | `/v1/models`                               | `/v1/models/{model}`                        | `Authorization: Bearer`     | [NVIDIA NIM](https://docs.nvidia.com/)                                                 |
|---False--| **Other**        | `/v1/models` (if OpenAI-compatible)          | `/v1/models/{model}` (if OpenAI-compatible) | `Authorization: Bearer`     | Depends on implementation                                                              |
*/
