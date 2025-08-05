/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType, WaldiezModelAWS } from "@waldiez/models";

export const createdAt = new Date().toISOString();
export const updatedAt = new Date().toISOString();

export const flowId = "wf-1";
export const modelId = "wm-1";

export const apiType = "other" as WaldiezModelAPIType;

export const modelData = {
    name: "test model",
    description: "test model description",
    baseUrl: "http://localhost:3000",
    apiType: apiType,
    apiKey: "test-api-key",
    apiVersion: "v1",
    temperature: 0.1,
    topP: 0.2,
    maxTokens: 200,
    extras: {} as { [key: string]: unknown },
    defaultHeaders: {} as { [key: string]: string },
    price: {
        promptPricePer1k: 0.05 as number | null,
        completionTokenPricePer1k: 0.1 as number | null,
    },
    tags: [] as string[],
    requirements: [] as string[],
    createdAt,
    updatedAt,
    aws: {
        region: null as WaldiezModelAWS["region"],
        accessKey: null as WaldiezModelAWS["accessKey"],
        secretKey: null as WaldiezModelAWS["secretKey"],
        sessionToken: null as WaldiezModelAWS["sessionToken"],
        profileName: null as WaldiezModelAWS["profileName"],
    } as Partial<WaldiezModelAWS>,
};

export const storedModels = [
    {
        id: modelId,
        type: "model",
        data: modelData,
        position: { x: 0, y: 0 },
    },
];
export const apiTypeOptions: { label: string; value: WaldiezModelAPIType }[] = [
    { label: "OpenAI", value: "openai" },
    { label: "Azure", value: "azure" },
    { label: "Gemini", value: "google" },
    { label: "DeepSeek", value: "deepseek" },
    { label: "Claude", value: "anthropic" },
    { label: "Cohere", value: "cohere" },
    { label: "Mistral", value: "mistral" },
    { label: "Groq", value: "groq" },
    { label: "Together", value: "together" },
    { label: "NIM", value: "nim" },
    { label: "Other", value: "other" },
];
