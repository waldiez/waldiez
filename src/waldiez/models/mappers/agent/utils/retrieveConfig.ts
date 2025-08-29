/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type WaldiezRagUserRetrieveConfig, defaultRetrieveConfig } from "@waldiez/models/Agent/RagUser";

/**
 * getRetrieveConfig
 * Extracts the retrieval configuration from the provided JSON object.
 * If not found, returns a default configuration.
 * @param json - The JSON object to extract the retrieval configuration from.
 * @returns - The WaldiezRagUserRetrieveConfig object.
 */
export const getRetrieveConfig: (json: { [key: string]: any }) => WaldiezRagUserRetrieveConfig = json => {
    if (typeof json !== "object") {
        return defaultRetrieveConfig;
    }
    let jsonData = null;
    if ("retrieveConfig" in json && typeof json.retrieveConfig === "object" && json.retrieveConfig) {
        jsonData = json.retrieveConfig;
    } else if (
        "data" in json &&
        typeof json.data === "object" &&
        json.data &&
        "retrieveConfig" in json.data &&
        typeof json.data.retrieveConfig === "object" &&
        json.data.retrieveConfig
    ) {
        jsonData = json.data.retrieveConfig;
    }
    if (!jsonData) {
        return defaultRetrieveConfig;
    }
    return {
        task: getTask(jsonData),
        vectorDb: getVectorDb(jsonData),
        dbConfig: getDbConfig(jsonData),
        docsPath: getDocsPath(jsonData),
        newDocs: getNewDocs(jsonData),
        model: getModel(jsonData),
        chunkTokenSize: getChunkTokenSize(jsonData),
        contextMaxTokens: getContextMaxTokens(jsonData),
        chunkMode: getChunkMode(jsonData),
        mustBreakAtEmptyLine: getMustBreakAtEmptyLine(jsonData),
        useCustomEmbedding: getUseCustomEmbedding(jsonData),
        embeddingFunction: getEmbeddingFunction(jsonData),
        customizedPrompt: getCustomizedPrompt(jsonData),
        customizedAnswerPrefix: getCustomizedAnswerPrefix(jsonData),
        updateContext: getUpdateContext(jsonData),
        collectionName: getCollectionName(jsonData),
        getOrCreate: getGetOrCreate(jsonData),
        overwrite: getOverwrite(jsonData),
        useCustomTokenCount: getUseCustomTokenCount(jsonData),
        customTokenCountFunction: getCustomTokenCountFunction(jsonData),
        useCustomTextSplit: getUseCustomTextSplit(jsonData),
        customTextSplitFunction: getCustomTextSplitFunction(jsonData),
        customTextTypes: getCustomTextTypes(jsonData),
        recursive: getRecursive(jsonData),
        distanceThreshold: getDistanceThreshold(jsonData),
        nResults: getNResults(jsonData),
    };
};

/**
 * Utility functions to extract various configurations from a JSON object.
 * These functions are used to parse and validate the configuration settings for a retrieval system.
 * @param json - The JSON object containing the configuration settings.
 * @returns - The parsed configuration settings.
 */

const getTask = (json: { [key: string]: any }) => {
    let task: "code" | "qa" | "default" = "default";
    if ("task" in json && typeof json.task === "string" && ["code", "qa", "default"].includes(json.task)) {
        task = json.task as "code" | "qa" | "default";
    }
    return task;
};

const getVectorDb = (json: { [key: string]: any }) => {
    let vectorDb: "chroma" | "pgvector" | "mongodb" | "qdrant" = "chroma";
    if (
        "vectorDb" in json &&
        typeof json.vectorDb === "string" &&
        ["chroma", "pgvector", "mongodb", "qdrant"].includes(json.vectorDb)
    ) {
        vectorDb = json.vectorDb as "chroma" | "pgvector" | "mongodb" | "qdrant";
    }
    return vectorDb;
};

const getDbConfigModel = (json: { [key: string]: any }) => {
    let model = "all-MiniLM-L6-v2";
    if ("model" in json && typeof json.model === "string" && json.model.length > 0) {
        model = json.model;
    }
    return model;
};

const getDbConfigUseMemory = (json: { [key: string]: any }) => {
    let useMemory = false;
    if ("useMemory" in json && typeof json.useMemory === "boolean") {
        useMemory = json.useMemory;
    }
    return useMemory;
};

const getDbConfigUseLocalStorage = (json: { [key: string]: any }) => {
    let useLocalStorage = false;
    if ("useLocalStorage" in json && typeof json.useLocalStorage === "boolean") {
        useLocalStorage = json.useLocalStorage;
    }
    return useLocalStorage;
};

const getDbConfigLocalStoragePath = (json: { [key: string]: any }) => {
    let localStoragePath: string | null = null;
    if (
        "localStoragePath" in json &&
        typeof json.localStoragePath === "string" &&
        json.localStoragePath.length > 0
    ) {
        localStoragePath = json.localStoragePath;
    }
    return localStoragePath;
};

const getDbConfigConnectionUrl = (json: { [key: string]: any }) => {
    let connectionUrl: string | null = null;
    if ("connectionUrl" in json && typeof json.connectionUrl === "string" && json.connectionUrl.length > 0) {
        connectionUrl = json.connectionUrl;
    }
    return connectionUrl;
};

const getDbConfigWaitUntilIndexReady = (json: { [key: string]: any }) => {
    let waitUntilIndexReady = null;
    if ("waitUntilIndexReady" in json && typeof json.waitUntilIndexReady === "boolean") {
        waitUntilIndexReady = json.waitUntilIndexReady;
    }
    return waitUntilIndexReady;
};
const getDbConfigWaitUntilDocumentReady = (json: { [key: string]: any }) => {
    let waitUntilDocumentReady = null;
    if ("waitUntilDocumentReady" in json && typeof json.waitUntilDocumentReady === "boolean") {
        waitUntilDocumentReady = json.waitUntilDocumentReady;
    }
    return waitUntilDocumentReady;
};
const getDbConfigMetadata = (json: { [key: string]: any }) => {
    let metadata = null;
    if ("metadata" in json && typeof json.metadata === "object" && json.metadata) {
        metadata = json.metadata;
    }
    return metadata;
};

const getDbConfig = (json: { [key: string]: any }) => {
    let dbConfig = {
        model: "all-MiniLM-L6-v2",
        useMemory: false,
        useLocalStorage: false,
        localStoragePath: null as string | null,
        connectionUrl: null as string | null,
        waitUntilIndexReady: null as boolean | null,
        waitUntilDocumentReady: null as boolean | null,
        metadata: null as { [key: string]: unknown } | null,
    };
    if ("dbConfig" in json && typeof json.dbConfig === "object") {
        dbConfig = {
            model: getDbConfigModel(json.dbConfig),
            useMemory: getDbConfigUseMemory(json.dbConfig),
            useLocalStorage: getDbConfigUseLocalStorage(json.dbConfig),
            localStoragePath: getDbConfigLocalStoragePath(json.dbConfig),
            connectionUrl: getDbConfigConnectionUrl(json.dbConfig),
            waitUntilIndexReady: getDbConfigWaitUntilIndexReady(json.dbConfig),
            waitUntilDocumentReady: getDbConfigWaitUntilDocumentReady(json.dbConfig),
            metadata: getDbConfigMetadata(json.dbConfig),
        };
    }
    return dbConfig;
};

const getDocsPath = (json: { [key: string]: any }) => {
    let docsPath: string[] = [];
    if ("docsPath" in json && Array.isArray(json.docsPath) && json.docsPath.length > 0) {
        docsPath = json.docsPath.filter((d: any) => typeof d === "string" && d.length > 0) as string[];
    }
    return docsPath;
};

const getNewDocs = (json: { [key: string]: any }) => {
    let newDocs = true;
    if ("newDocs" in json && typeof json.newDocs === "boolean") {
        newDocs = json.newDocs;
    }
    return newDocs;
};

const getModel = (json: { [key: string]: any }) => {
    let model: string | null = null;
    if ("model" in json && typeof json.model === "string") {
        model = json.model;
    }
    return model;
};

const getChunkTokenSize = (json: { [key: string]: any }) => {
    let chunkTokenSize: number | null = null;
    if ("chunkTokenSize" in json && typeof json.chunkTokenSize === "number") {
        chunkTokenSize = json.chunkTokenSize;
    }
    return chunkTokenSize;
};

const getContextMaxTokens = (json: { [key: string]: any }) => {
    let contextMaxTokens: number | null = null;
    if ("contextMaxTokens" in json && typeof json.contextMaxTokens === "number") {
        contextMaxTokens = json.contextMaxTokens;
    }
    return contextMaxTokens;
};

const getChunkMode = (json: { [key: string]: any }) => {
    let chunkMode: "multi_lines" | "one_line" = "multi_lines";
    if (
        "chunkMode" in json &&
        typeof json.chunkMode === "string" &&
        ["multi_lines", "one_line"].includes(json.chunkMode)
    ) {
        chunkMode = json.chunkMode as "multi_lines" | "one_line";
    }
    return chunkMode;
};

const getMustBreakAtEmptyLine = (json: { [key: string]: any }) => {
    let mustBreakAtEmptyLine = true;
    if ("mustBreakAtEmptyLine" in json && typeof json.mustBreakAtEmptyLine === "boolean") {
        mustBreakAtEmptyLine = json.mustBreakAtEmptyLine;
    }
    return mustBreakAtEmptyLine;
};

const getUseCustomEmbedding = (json: { [key: string]: any }) => {
    let useCustomEmbedding = false;
    if ("useCustomEmbedding" in json && typeof json.useCustomEmbedding === "boolean") {
        useCustomEmbedding = json.useCustomEmbedding;
    }
    return useCustomEmbedding;
};

const getEmbeddingFunction = (json: { [key: string]: any }) => {
    let embeddingFunction: string | null = null;
    if ("embeddingFunction" in json && typeof json.embeddingFunction === "string") {
        embeddingFunction = json.embeddingFunction;
    }
    return embeddingFunction;
};

const getCustomizedPrompt = (json: { [key: string]: any }) => {
    let customizedPrompt: string | null = null;
    if ("customizedPrompt" in json && typeof json.customizedPrompt === "string") {
        customizedPrompt = json.customizedPrompt;
    }
    return customizedPrompt;
};

const getCustomizedAnswerPrefix = (json: { [key: string]: any }) => {
    let customizedAnswerPrefix: string | null = null;
    if ("customizedAnswerPrefix" in json && typeof json.customizedAnswerPrefix === "string") {
        customizedAnswerPrefix = json.customizedAnswerPrefix;
    }
    return customizedAnswerPrefix;
};

const getUpdateContext = (json: { [key: string]: any }) => {
    let updateContext = true;
    if ("updateContext" in json && typeof json.updateContext === "boolean") {
        updateContext = json.updateContext;
    }
    return updateContext;
};

const getCollectionName = (json: { [key: string]: any }) => {
    let collectionName: string | null = "autogen-docs";
    if ("collectionName" in json && typeof json.collectionName === "string") {
        collectionName = json.collectionName;
    }
    return collectionName;
};

const getGetOrCreate = (json: { [key: string]: any }) => {
    let getOrCreate = true;
    if ("getOrCreate" in json && typeof json.getOrCreate === "boolean") {
        getOrCreate = json.getOrCreate;
    }
    return getOrCreate;
};

const getOverwrite = (json: { [key: string]: any }) => {
    let overwrite = false;
    if ("overwrite" in json && typeof json.overwrite === "boolean") {
        overwrite = json.overwrite;
    }
    return overwrite;
};

const getUseCustomTokenCount = (json: { [key: string]: any }) => {
    let useCustomTokenCount = false;
    if ("useCustomTokenCount" in json && typeof json.useCustomTokenCount === "boolean") {
        useCustomTokenCount = json.useCustomTokenCount;
    }
    return useCustomTokenCount;
};

const getCustomTokenCountFunction = (json: { [key: string]: any }) => {
    let customTokenCountFunction: string | null = null;
    if ("customTokenCountFunction" in json && typeof json.customTokenCountFunction === "string") {
        customTokenCountFunction = json.customTokenCountFunction;
    }
    return customTokenCountFunction;
};

const getUseCustomTextSplit = (json: { [key: string]: any }) => {
    let useCustomTextSplit = false;
    if ("useCustomTextSplit" in json && typeof json.useCustomTextSplit === "boolean") {
        useCustomTextSplit = json.useCustomTextSplit;
    }
    return useCustomTextSplit;
};

const getCustomTextSplitFunction = (json: { [key: string]: any }) => {
    let customTextSplitFunction: string | null = null;
    if ("customTextSplitFunction" in json && typeof json.customTextSplitFunction === "string") {
        customTextSplitFunction = json.customTextSplitFunction;
    }
    return customTextSplitFunction;
};

const getCustomTextTypes = (json: { [key: string]: any }) => {
    let customTextTypes: string[] = [];
    if ("customTextTypes" in json && Array.isArray(json.customTextTypes) && json.customTextTypes.length > 0) {
        customTextTypes = json.customTextTypes.filter((d: any) => typeof d === "string" && d.length > 0);
    }
    return customTextTypes;
};

const getRecursive = (json: { [key: string]: any }) => {
    let recursive = true;
    if ("recursive" in json && typeof json.recursive === "boolean") {
        recursive = json.recursive;
    }
    return recursive;
};

const getDistanceThreshold = (json: { [key: string]: any }) => {
    let distanceThreshold = -1;
    if ("distanceThreshold" in json && typeof json.distanceThreshold === "number") {
        distanceThreshold = json.distanceThreshold;
    }
    return distanceThreshold;
};

const getNResults = (json: { [key: string]: any }) => {
    let nResults: number | null = null;
    if ("nResults" in json && typeof json.nResults === "number") {
        nResults = json.nResults;
    }
    return nResults;
};
