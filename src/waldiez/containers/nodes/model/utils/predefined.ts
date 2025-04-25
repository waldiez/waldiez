/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezModelAPIType } from "@waldiez/models";

// https://platform.openai.com/docs/models
const predefinedOpenAIModels = [
    {
        label: "GPT-4.1",
        value: "gpt-4.1",
    },
    {
        label: "GPT-4",
        value: "gpt-4",
    },
    {
        label: "GPT-4 Turbo",
        value: "gpt-4-turbo",
    },
    {
        label: "GPT-3.5 Turbo",
        value: "gpt-3.5-turbo",
    },
    {
        label: "GPT-4o",
        value: "gpt-4o",
    },
    {
        label: "o4-mini",
        value: "o4-mini",
    },
    {
        label: "o3",
        value: "o3",
    },
];

// https://docs.anthropic.com/en/docs/about-claude/models/all-models
const predefinedAnthropicModels = [
    {
        label: "Claude 3.7 Sonnet",
        value: "claude-3-7-sonnet-20250219",
    },
    {
        label: "Claude 3.5 Haiku",
        value: "claude-3-5-haiku-20241022",
    },
    {
        label: "Claude 3.5 Sonnet v2",
        value: "claude-3-5-sonnet-20241022",
    },
    {
        label: "Claude 3.5 Sonnet",
        value: "claude-3-5-sonnet-20240620",
    },
    {
        label: "Claude 3 Opus",
        value: "claude-3-opus-20240229",
    },
    {
        label: "Claude 3 Sonnet",
        value: "claude-3-sonnet-20240229",
    },
    {
        label: "Claude 3 Haiku",
        value: "claude-3-haiku-20240307",
    },
];

// https://ai.google.dev/gemini-api/docs/models
const commonGeminiModels = [
    {
        label: "Gemini 2.5 Flash Preview 04-17",
        value: "gemini-2.5-flash-preview-04-17",
    },
    {
        label: "Gemini 2.5 Pro Preview",
        value: "gemini-2.5-pro-preview-03-25",
    },
    {
        label: "Gemini 2.0 Flash",
        value: "gemini-2.0-flash",
    },
    {
        label: "Gemini 2.0 Flash-Lite",
        value: "gemini-2.0-flash-lite",
    },
    {
        label: "Gemini 1.5 Flash",
        value: "gemini-1.5-flash",
    },
    {
        label: "Gemini 1.5 Pro",
        value: "gemini-1.5-pro",
    },
];

// https://api-docs.deepseek.com/quick_start/pricing
const predefinedDeepSeekModels = [
    {
        label: "DeepSeek-V3",
        value: "deepseek-chat",
    },
    {
        label: "DeepSeek-R1",
        value: "deepseek-reasoner",
    },
];

// https://docs.cohere.com/v2/docs/models
const predefinedCohereModels = [
    {
        label: "Command-R",
        value: "command-r",
    },
    {
        label: "Command-R+",
        value: "command-r-plus",
    },
    {
        label: "Command Light Nightly",
        value: "command-light-nightly",
    },
    {
        label: "Command A",
        value: "command-a-03-2025",
    },
    {
        label: "Command Nightly",
        value: "command-nightly",
    },
    {
        label: "Command R7B",
        value: "command-r7b-12-2024",
    },
];

// https://docs.nvidia.com/nim/large-language-models/latest/models.html
const predefinedNIMModels = [
    {
        label: "Meta Llama 3 8B Instruct",
        value: "meta/llama3-8b-instruct",
    },
    {
        label: "Meta Llama 3 70B Instruct",
        value: "meta/llama3-70b-instruct",
    },
    {
        label: "Llama 3.3 70B Instruct",
        value: "llama/llama-3.3-70b-instruct",
    },
    {
        label: "Llama 3.1 Nemotron Ultra 253B v1",
        value: "nvidia/llama-3.1-nemotron-ultra-253b-v1",
    },
    {
        label: "Llama 3.1 Nemotron Super 49B v1",
        value: "nvidia/llama-3.3-nemotron-super-49b-v1",
    },
    {
        label: "Llama 3.1 Nemotron Nano 8B v1",
        value: "nvidia/llama-3.1-nemotron-nano-8b-v1",
    },
];

// https://docs.together.ai/docs/serverless-models
const predefinedTogetherIModels = [
    {
        label: "Llama 4 Maverick",
        value: "meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8",
    },
    {
        label: "Llama 4 Scout",
        value: "meta-llama/Llama-4-Scout-17B-16E-Instruct",
    },
    {
        label: "DeepSeek-R1",
        value: "deepseek-ai/DeepSeek-R1",
    },
    {
        label: "DeepSeek-R1 Distill Llama 70B",
        value: "deepseek-ai/DeepSeek-R1-Distill-Llama-70B",
    },
    {
        label: "DeepSeek-V3",
        value: "deepseek-ai/DeepSeek-V3",
    },
    {
        label: "Llama 3.3 70B Instruct Turbo",
        value: "meta-llama/Llama-3.3-70B-Instruct-Turbo",
    },
    {
        label: "Mistral Small 3 Instruct",
        value: "mistral-ai/Mistral-Small-3-Instruct",
    },
    {
        label: "Mistral (7B) Instruct v0.3",
        value: "mistralai/Mistral-7B-Instruct-v0.3",
    },
];

// https://docs.mistral.ai/getting-started/models/models_overview/
const predefinedMistralModels = [
    {
        label: "Codestral",
        value: "codestral-latest",
    },
    {
        label: "Mistral Large",
        value: "mistral-large-latest",
    },
    {
        label: "Pixtral Large",
        value: "pixtral-large-latest",
    },
    {
        label: "Mistral Saba",
        value: "mistral-saba-latest",
    },
    {
        label: "Ministral 3B",
        value: "ministral-3b-latest",
    },
    {
        label: "Ministral 8B",
        value: "ministral-8b-latest",
    },
];

export const predefinedModels: Record<WaldiezModelAPIType, { label: string; value: string }[]> = {
    openai: predefinedOpenAIModels,
    anthropic: predefinedAnthropicModels,
    google: commonGeminiModels,
    deepseek: predefinedDeepSeekModels,
    cohere: predefinedCohereModels,
    together: predefinedTogetherIModels,
    nim: predefinedNIMModels,
    mistral: predefinedMistralModels,
    azure: [],
    groq: [],
    other: [],
};
