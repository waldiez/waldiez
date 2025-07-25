/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType } from "@waldiez/models";

export const getApiTypeLabel = (text: WaldiezModelAPIType) => {
    if (text === "anthropic") {
        return "Claude";
    }
    if (text === "deepseek") {
        return "DeepSeek";
    }
    if (text === "google") {
        return "Gemini";
    }
    if (text === "openai") {
        return "OpenAI";
    }
    if (text === "nim") {
        return "NIM";
    }
    if (!text || text.length === 0 || text === "other") {
        return "Other";
    }
    return text[0]!.toUpperCase() + text.slice(1);
};
export const apiTypeOptions: { label: string; value: WaldiezModelAPIType }[] = [
    { label: "OpenAI", value: "openai" },
    { label: "Claude", value: "anthropic" },
    { label: "NIM", value: "nim" },
    { label: "Gemini", value: "google" },
    { label: "Cohere", value: "cohere" },
    { label: "DeepSeek", value: "deepseek" },
    { label: "Mistral", value: "mistral" },
    { label: "Azure", value: "azure" },
    { label: "Groq", value: "groq" },
    { label: "Together", value: "together" },
    { label: "Bedrock", value: "bedrock" },
    { label: "Other", value: "other" },
];
export const apiKeyEnvs = {
    openai: "OPENAI_API_KEY",
    azure: "AZURE_API_KEY",
    bedrock: "BEDROCK_API_KEY", // not used (use AWS_...)
    deepseek: "DEEPSEEK_API_KEY",
    google: "GOOGLE_GEMINI_API_KEY",
    anthropic: "ANTHROPIC_API_KEY",
    cohere: "COHERE_API_KEY",
    mistral: "MISTRAL_API_KEY",
    groq: "GROQ_API_KEY",
    together: "TOGETHER_API_KEY",
    nim: "NIM_API_KEY",
    other: "OPENAI_API_KEY",
};
