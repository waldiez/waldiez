/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezModelAPIType } from "@waldiez/models";

export { apiKeyEnvs, apiTypeOptions, getApiTypeLabel } from "@waldiez/containers/nodes/model/utils/display";
export { modelLinks, predefinedModels } from "@waldiez/containers/nodes/model/utils/predefined";
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
