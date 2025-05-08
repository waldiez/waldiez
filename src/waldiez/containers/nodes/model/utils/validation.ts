/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType, WaldiezNodeModelData } from "@waldiez/models";

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
    ResponseParseError = "Failed to parse response",
    InvalidResponse = "Invalid response",
    CouldNotFetchModel = "Could not fetch model",
    CouldNotGetAResponse = "Could not get a response from the model's endpoint",
    UnknownError = "Unknown error",
}

type ValidationResult = {
    success: boolean;
    message: ValidationMessage;
    details?: string;
};

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
    azure: "",
    other: "",
};

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
};
const supportsDirectLookup: WaldiezModelAPIType[] = [
    "openai",
    "google",
    "groq",
    "anthropic",
    "cohere",
    "mistral",
    "nim",
    "other", // should be openai compat-i-ball
];
export const validateModel = async (model: WaldiezNodeModelData): Promise<ValidationResult> => {
    const validation = validateModelInputs(model);
    if (!validation.success || !validation.details) {
        return validation;
    }

    const { url, headers } = buildRequestConfig(model, validation.details);

    if (model.apiType === "azure") {
        return validateAzureModel(url, headers, model.label.trim());
    }

    if (supportsDirectLookup.includes(model.apiType)) {
        return validateDirectModel(url, headers, model.label.trim());
    }

    return validateFallbackModel(url, headers, model.label.trim());
};

const validateModelBaseUrl = (model: WaldiezNodeModelData): ValidationResult => {
    if (["azure", "other"].includes(model.apiType) && !model.baseUrl) {
        return { success: false, message: ValidationMessage.MissingBaseUrl };
    }
    let baseUrl = model.baseUrl || baseUrlsMapping[model.apiType];
    if (["azure", "other"].includes(model.apiType) && model.baseUrl) {
        baseUrl = model.baseUrl;
    }
    if (!baseUrl.trim()) {
        return { success: false, message: ValidationMessage.MissingBaseUrl };
    }
    return {
        success: true,
        message: ValidationMessage.ValidationSuccess,
        details: baseUrl,
    };
};

const validateModelInputs = (model: WaldiezNodeModelData): ValidationResult => {
    const { success, message, details } = validateModelBaseUrl(model);
    if (!success) {
        return { success, message, details };
    }
    if (!model.apiKey) {
        return { success: false, message: ValidationMessage.MissingApiKey };
    }
    if (!model.label.trim()) {
        return { success: false, message: ValidationMessage.MissingModelName };
    }
    if (model.apiType === "azure" && !model.apiVersion) {
        return { success: false, message: ValidationMessage.MissingApiVersion };
    }
    return { success: true, message, details };
};

const buildRequestConfig = (model: WaldiezNodeModelData, baseUrl: string) => {
    const base = baseUrl.replace(/\/$/, "");
    let url = base + modelListPaths[model.apiType];
    const headers: Record<string, string> = Object.fromEntries(
        Object.entries(model.defaultHeaders).map(([key, value]) => [key, String(value)]),
    );

    if (model.apiType === "azure") {
        url += `?api-version=${model.apiVersion}`;
        headers["api-key"] = model.apiKey!;
    } else {
        if (model.apiKey) {
            headers["Authorization"] = `Bearer ${model.apiKey}`;
        }
    }

    return { url, headers };
};

const validateAzureModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    const res = await fetchWithTimeout(url, { method: "GET", headers });
    /* v8 ignore next 3 */
    if (!res.ok) {
        return { success: false, message: ValidationMessage.AzureApiError };
    }

    const data = await res.json();
    const found = Array.isArray(data.data) && data.data.some((d: any) => d.id === modelName);
    return found
        ? { success: true, message: ValidationMessage.ValidationSuccess }
        : { success: false, message: ValidationMessage.ModelNotFound };
};

const validateDirectModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    const modelUrl = `${url}/${encodeURIComponent(modelName)}`;
    const res = await fetchWithTimeout(modelUrl, { method: "GET", headers });
    if (!res.ok) {
        return parseErrorResponse(res);
    }
    return { success: true, message: ValidationMessage.ValidationSuccess };
};

const validateFallbackModel = async (
    url: string,
    headers: Record<string, string>,
    modelName: string,
): Promise<ValidationResult> => {
    const res = await fetchWithTimeout(url, { method: "GET", headers });
    /* v8 ignore next 3 */
    if (!res.ok) {
        return parseErrorResponse(res);
    }
    let data = {
        data: [],
    };
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
};

const fetchWithTimeout = async (url: string, options: RequestInit): Promise<Response> => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    try {
        return await fetch(url, { ...options, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }
};

const parseErrorResponse = async (res: Response): Promise<ValidationResult> => {
    const errorBody = await res.json().catch(() => ({}));
    const errorDetails = errorBody?.error?.message || res.statusText || ValidationMessage.UnknownError;
    let errorMessage: ValidationMessage = ValidationMessage.ApiError;
    if (res.status === 404) {
        errorMessage = ValidationMessage.ModelNotFound;
    }
    return { success: false, message: errorMessage, details: errorDetails };
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
