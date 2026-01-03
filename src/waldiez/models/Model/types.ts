/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

export type { WaldiezModel } from "@waldiez/models/Model/Model";
export type { WaldiezModelData } from "@waldiez/models/Model/ModelData";

/**
 * WaldiezModelAPIType
 * Represents the type of API used for the model.
 * @param openai - OpenAI API
 * @param azure - Azure API
 * @param deepseek - DeepSeek API
 * @param bedrock - Bedrock API
 * @param google - Google API
 * @param anthropic - Anthropic API
 * @param cohere - Cohere API
 * @param mistral - Mistral API
 * @param groq - Groq API
 * @param together - Together API
 * @param nim - Nim API
 * @param other - Other API types
 */
export type WaldiezModelAPIType =
    | "openai"
    | "azure"
    | "deepseek"
    | "bedrock"
    | "google"
    | "anthropic"
    | "cohere"
    | "mistral"
    | "groq"
    | "together"
    | "nim"
    | "other";

/** AWS related fields
 * @param region - The AWS region
 * @param accessKey - The AWS access key
 * @param secretKey - The AWS secret key
 * @param sessionToken - The AWS session token
 * @param profileName - The AWS profile name
 */
export type WaldiezModelAWS = {
    region?: string | null;
    accessKey?: string | null;
    secretKey?: string | null;
    sessionToken?: string | null;
    profileName?: string | null;
};

/** Price related fields
 * @param promptPricePer1k - The price per 1000 tokens for the prompt
 * @param completionTokenPricePer1k - The price per 1000 tokens for the completion
 */
export type WaldiezModelPrice = {
    promptPricePer1k: number | null;
    completionTokenPricePer1k: number | null;
};

/** Common Model related fields
 * @param description - The description of the model
 * @param baseUrl - The base URL of the API
 * @param apiKey - The API key
 * @param apiType - The type of the API
 * @param apiVersion - The version of the API
 * @param temperature - The temperature
 * @param topP - The top P
 * @param maxTokens - The max tokens
 * @param aws - The AWS related fields
 * @param extras - Extra parameters to use in the LLM Config
 * @param defaultHeaders - The default headers
 * @param price - The price
 * @param requirements - The requirements of the model
 * @param tags - The tags of the model
 * @param createdAt - The creation date of the model
 * @param updatedAt - The last update date of the model
 */
export type WaldiezModelDataCommon = {
    description: string;
    baseUrl: string | null;
    apiKey: string | null;
    apiType: WaldiezModelAPIType;
    apiVersion: string | null;
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    aws?: WaldiezModelAWS | null;
    extras: { [key: string]: unknown };
    defaultHeaders: { [key: string]: unknown };
    price: WaldiezModelPrice;
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

/**
 * WaldiezNodeModelData
 * Represents the data of a node model.
 * @param label - The label of the model
 * @param description - The description of the model
 * @param baseUrl - The base URL of the API
 * @param apiKey - The API key
 * @param apiType - The type of the API
 * @param apiVersion - The version of the API
 * @param temperature - The temperature
 * @param topP - The top P
 * @param maxTokens - The max tokens
 * @param aws - The AWS related fields
 * @param extras - Extra parameters to use in the LLM Config
 * @param defaultHeaders - The default headers
 * @param price - The price
 * @param requirements - The requirements of the model
 * @param tags - The tags of the model
 * @param createdAt - The creation date of the model
 * @param updatedAt - The last update date of the model
 * @see {@link WaldiezModelDataCommon}
 */
export type WaldiezNodeModelData = WaldiezModelDataCommon & {
    label: string;
};

/**
 * WaldiezNodeModel
 * Represents a node model in the graph.
 * @param data - The data of the model
 * @param type - The type of the node (model)
 * @see {@link WaldiezNodeModelData}
 */
export type WaldiezNodeModel = Node<WaldiezNodeModelData, "model">;
