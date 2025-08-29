/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezModel,
    type WaldiezModelAPIType,
    type WaldiezModelAWS,
    WaldiezModelData,
    type WaldiezModelPrice,
    type WaldiezNodeModel,
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

/**
 * modelMapper is a utility object that provides methods to import and export models,
 * as well as convert them to and from node format.
 * It includes methods to import a model from JSON, export a model to JSON,
 * and convert a WaldiezModel instance to a WaldiezNodeModel instance.
 * @see {@link WaldiezModel}
 */
export const modelMapper = {
    /**
     * Imports a model from JSON.
     * If the JSON is invalid or missing, it creates a new model with default values.
     * @param json - The JSON representation of the model.
     * @returns A new instance of WaldiezModel.
     */
    importModel: (json: unknown): WaldiezModel => {
        if (!json || typeof json !== "object") {
            return new WaldiezModel({
                id: "wm-" + getId(),
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

    /**
     * Exports a model to JSON.
     * If replaceSecrets is true, it replaces sensitive information with "REPLACE_ME".
     * @param modelNode - The WaldiezNodeModel instance representing the model.
     * @param replaceSecrets - Whether to replace sensitive information with "REPLACE_ME".
     * @returns A JSON representation of the model.
     */
    exportModel: (modelNode: WaldiezNodeModel, replaceSecrets: boolean) => {
        const apiKey = modelNode.data.apiKey
            ? replaceSecrets
                ? "REPLACE_ME"
                : modelNode.data.apiKey
            : "REPLACE_ME";
        const rest = getRestFromJSON(modelNode, ["id", "type", "parentId", "data"]);
        const { defaultHeaders, extras, aws } = replaceSecrets
            ? replaceModelSecrets(modelNode)
            : modelNode.data;
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
                aws,
                extras,
                defaultHeaders,
                price: modelNode.data.price,
            },
            ...rest,
        };
    },

    /**
     * Converts a WaldiezModel instance to a WaldiezNodeModel instance.
     * It sets the position based on the provided coordinates or defaults to (0, 0).
     * @param model - The WaldiezModel instance to convert.
     * @param position - Optional position object with x and y coordinates.
     * @returns A new instance of WaldiezNodeModel representing the model.
     */
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

/**
 * Replaces sensitive information in the model node's data with "REPLACE_ME".
 * This is useful for exporting models without exposing sensitive information.
 * @param modelNode - The WaldiezNodeModel instance representing the model.
 * @returns An object containing the modified defaultHeaders, extras, and aws properties.
 */
// eslint-disable-next-line max-statements
const replaceModelSecrets = (modelNode: WaldiezNodeModel) => {
    const defaultHeaders = { ...modelNode.data.defaultHeaders };
    const extras = { ...modelNode.data.extras };
    const aws: { [key: string]: string | undefined | null } = {
        ...(modelNode.data.aws || {
            region: null,
            accessKey: null,
            secretKey: null,
            sessionToken: null,
            profileName: null,
        }),
    };
    for (const key in defaultHeaders) {
        if (typeof defaultHeaders[key] === "string" || !defaultHeaders[key]) {
            defaultHeaders[key] = "REPLACE_ME";
        }
    }
    for (const key in extras) {
        if (typeof extras[key] === "string" || !extras[key]) {
            extras[key] = "REPLACE_ME";
        }
    }
    if (modelNode.data.apiType === "bedrock") {
        for (const key in aws) {
            if (typeof aws[key] === "string" || !aws[key]) {
                aws[key] = "REPLACE_ME";
            }
        }
    } else {
        for (const key in aws) {
            if (typeof aws[key] === "string") {
                aws[key] = "REPLACE_ME";
            }
        }
    }
    return {
        defaultHeaders,
        extras,
        aws,
    };
};

/**
 * Utility functions to extract model metadata from a JSON object.
 * @param name - The name of the model.
 * @param json - The JSON object to extract the model name from.
 * @returns The model name.
 */
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
            "bedrock",
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

const getExtras = (json: Record<string, unknown>): { [key: string]: unknown } => {
    let extras: { [key: string]: unknown } = {};
    if ("extras" in json && typeof json.extras === "object") {
        extras = json.extras as { [key: string]: unknown };
    }
    return extras;
};

const getAWSRegion = (json: Record<string, unknown>): string | null => {
    let region: string | null = null;
    if ("region" in json && typeof json.region === "string") {
        region = json.region;
    }
    return region;
};
const getAWSAccessKey = (json: Record<string, unknown>): string | null => {
    let accessKey: string | null = null;
    if ("accessKey" in json && typeof json.accessKey === "string") {
        accessKey = json.accessKey;
    }
    return accessKey;
};
const getAWSSecretKey = (json: Record<string, unknown>): string | null => {
    let secretKey: string | null = null;
    if ("secretKey" in json && typeof json.secretKey === "string") {
        secretKey = json.secretKey;
    }
    return secretKey;
};

const getAWSSessionToken = (json: Record<string, unknown>): string | null => {
    let sessionToken: string | null = null;
    if ("sessionToken" in json && typeof json.sessionToken === "string") {
        sessionToken = json.sessionToken;
    }
    return sessionToken;
};

const getAWS = (json: Record<string, unknown>): WaldiezModelAWS | undefined | null => {
    const aws: WaldiezModelAWS | undefined | null = {
        region: null,
        accessKey: null,
        secretKey: null,
        sessionToken: null,
        profileName: null,
    };
    if ("aws" in json && typeof json.aws === "object" && json.aws) {
        aws.region = getAWSRegion(json.aws as Record<string, unknown>);
        aws.accessKey = getAWSAccessKey(json.aws as Record<string, unknown>);
        aws.secretKey = getAWSSecretKey(json.aws as Record<string, unknown>);
        aws.sessionToken = getAWSSessionToken(json.aws as Record<string, unknown>);
        aws.profileName = getAWSRegion(json.aws as Record<string, unknown>);
    }
    return aws;
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
    const aws = getAWS(jsonData);
    const extras = getExtras(jsonData);
    const defaultHeaders = getDefaultHeaders(jsonData);
    const price = getPrice(jsonData);
    return new WaldiezModelData({
        baseUrl,
        apiKey,
        apiType,
        apiVersion,
        temperature,
        topP,
        maxTokens,
        aws,
        extras,
        defaultHeaders,
        price,
    });
};
