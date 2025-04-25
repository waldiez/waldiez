/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezModel,
    WaldiezModelAPIType,
    WaldiezModelData,
    WaldiezModelPrice,
    WaldiezNodeModel,
} from "@waldiez/models/Model";
import {
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getIdFromJSON,
    getNameFromJSON,
    getNodePositionFromJSON,
    getRequirementsFromJSON,
    getRestFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";
import { getId } from "@waldiez/utils";

export const modelMapper = {
    importModel: (json: unknown): WaldiezModel => {
        if (!json || typeof json !== "object") {
            return new WaldiezModel({
                id: "ws-" + getId(),
                name: "Model",
                description: "A new model",
                tags: [],
                requirements: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: new WaldiezModelData(),
            });
        }
        const jsonObject = json as Record<string, unknown>;

        const id = getIdFromJSON(jsonObject);
        const { name, description, tags, requirements, createdAt, updatedAt } = getNodeMeta(jsonObject);
        const jsonData = jsonObject.data || (jsonObject as any);
        const data = getModelData(jsonData);
        const rest = getRestFromJSON(jsonObject, [
            "id",
            "type",
            "name",
            "description",
            "tags",
            "requirements",
            "createdAt",
            "updatedAt",
            "data",
        ]);
        return new WaldiezModel({
            id,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data,
            rest,
        });
    },
    exportModel: (modelNode: WaldiezNodeModel, replaceSecrets: boolean) => {
        const defaultHeaders = { ...modelNode.data.defaultHeaders };
        if (replaceSecrets) {
            for (const key in defaultHeaders) {
                if (typeof defaultHeaders[key] === "string") {
                    defaultHeaders[key] = "REPLACE_ME";
                }
            }
        }
        const apiKey = modelNode.data.apiKey ? (replaceSecrets ? "REPLACE_ME" : modelNode.data.apiKey) : null;
        const rest = getRestFromJSON(modelNode, ["id", "type", "parentId", "data"]);
        return {
            id: modelNode.id,
            type: "model",
            name: modelNode.data.label,
            description: modelNode.data.description,
            tags: modelNode.data.tags,
            requirements: modelNode.data.requirements,
            createdAt: modelNode.data.createdAt,
            updatedAt: modelNode.data.updatedAt,
            data: {
                apiKey,
                apiType: modelNode.data.apiType,
                apiVersion: modelNode.data.apiVersion,
                baseUrl: modelNode.data.baseUrl,
                temperature: modelNode.data.temperature,
                topP: modelNode.data.topP,
                maxTokens: modelNode.data.maxTokens,
                defaultHeaders,
                price: modelNode.data.price,
            },
            ...rest,
        };
    },
    asNode: (model: WaldiezModel, position?: { x: number; y: number }): WaldiezNodeModel => {
        const nodePosition = getNodePositionFromJSON(model, position);
        const nodeData = {
            ...model.data,
            label: model.name,
            description: model.description,
            tags: model.tags,
            requirements: model.requirements,
            createdAt: model.createdAt,
            updatedAt: model.updatedAt,
        } as { [key: string]: unknown };
        nodeData.label = model.name;
        if (model.rest && "position" in model.rest) {
            delete model.rest.position;
        }
        const data = nodeData as WaldiezNodeModel["data"];
        return {
            id: model.id,
            type: "model",
            data,
            position: nodePosition,
            ...model.rest,
        };
    },
};
const getModelName = (name: string | null, json: Record<string, unknown>): string => {
    let modelName = name ?? "Model";
    if ("name" in json && typeof json.name === "string") {
        modelName = json.name;
    }
    return modelName;
};

const getBaseUrl = (json: Record<string, unknown>): string | null => {
    let baseUrl: string | null = null;
    if ("baseUrl" in json && typeof json.baseUrl === "string") {
        baseUrl = json.baseUrl;
    }
    return baseUrl;
};

const getApiKey = (json: Record<string, unknown>): string | null => {
    let apiKey: string | null = null;
    if ("apiKey" in json && typeof json.apiKey === "string") {
        apiKey = json.apiKey;
    }
    return apiKey;
};

const getApiType = (json: Record<string, unknown>): WaldiezModelAPIType => {
    let apiType: WaldiezModelAPIType = "openai";
    if (
        "apiType" in json &&
        typeof json.apiType === "string" &&
        [
            "openai",
            "azure",
            "deepseek",
            "google",
            "anthropic",
            "cohere",
            "mistral",
            "groq",
            "together",
            "nim",
            "other",
        ].includes(json.apiType)
    ) {
        apiType = json.apiType as WaldiezModelAPIType;
    }
    return apiType;
};

const getApiVersion = (json: Record<string, unknown>): string | null => {
    let apiVersion: string | null = null;
    if ("apiVersion" in json && typeof json.apiVersion === "string") {
        apiVersion = json.apiVersion;
    }
    return apiVersion;
};

const getTemperature = (json: Record<string, unknown>): number | null => {
    let temperature: number | null = null;
    if ("temperature" in json && typeof json.temperature === "number") {
        temperature = json.temperature;
    }
    return temperature;
};

const getTopP = (json: Record<string, unknown>): number | null => {
    let topP: number | null = null;
    if ("topP" in json && typeof json.topP === "number") {
        topP = json.topP;
    }
    return topP;
};

const getMaxTokens = (json: Record<string, unknown>): number | null => {
    let maxTokens: number | null = null;
    if ("maxTokens" in json && typeof json.maxTokens === "number") {
        maxTokens = json.maxTokens;
    }
    return maxTokens;
};

const getDefaultHeaders = (
    json: Record<string, unknown>,
): {
    [key: string]: string;
} => {
    let defaultHeaders: { [key: string]: string } = {};
    if ("defaultHeaders" in json && typeof json.defaultHeaders === "object") {
        defaultHeaders = json.defaultHeaders as {
            [key: string]: string;
        };
    }
    return defaultHeaders;
};

const getPrice = (json: Record<string, unknown>): WaldiezModelPrice => {
    const price: WaldiezModelPrice = {
        promptPricePer1k: null,
        completionTokenPricePer1k: null,
    };
    if ("price" in json && typeof json.price === "object" && json.price) {
        if ("promptPricePer1k" in json.price && typeof json.price.promptPricePer1k === "number") {
            price.promptPricePer1k = json.price.promptPricePer1k;
        }
        if (
            "completionTokenPricePer1k" in json.price &&
            typeof json.price.completionTokenPricePer1k === "number"
        ) {
            price.completionTokenPricePer1k = json.price.completionTokenPricePer1k;
        }
    }
    return price;
};
const getNodeMeta = (
    json: Record<string, unknown>,
): {
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
} => {
    const tmpName = getNameFromJSON(json, null);
    const name = getModelName(tmpName, json);
    const description = getDescriptionFromJSON(json, "A new model");
    const tags = getTagsFromJSON(json);
    const requirements = getRequirementsFromJSON(json);
    const createdAt = getCreatedAtFromJSON(json);
    const updatedAt = getUpdatedAtFromJSON(json);
    return { name, description, tags, requirements, createdAt, updatedAt };
};
const getModelData = (jsonData: Record<string, unknown>): WaldiezModelData => {
    const baseUrl = getBaseUrl(jsonData);
    const apiKey = getApiKey(jsonData);
    const apiType = getApiType(jsonData);
    const apiVersion = getApiVersion(jsonData);
    const temperature = getTemperature(jsonData);
    const topP = getTopP(jsonData);
    const maxTokens = getMaxTokens(jsonData);
    const defaultHeaders = getDefaultHeaders(jsonData);
    const price = getPrice(jsonData);
    const data = new WaldiezModelData({
        baseUrl,
        apiKey,
        apiType,
        apiVersion,
        temperature,
        topP,
        maxTokens,
        defaultHeaders,
        price,
    });
    return data;
};
