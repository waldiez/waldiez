/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { defaultRetrieveConfig } from "@waldiez/models";
import { getRetrieveConfig } from "@waldiez/models/mappers/agent/utils/retrieveConfig";

const retrieveJson = {
    task: "code",
    vectorDb: "chroma",
    dbConfig: {
        model: "all-MiniLM-L6-v2",
        useMemory: false,
        useLocalStorage: false,
        localStoragePath: null,
        connectionUrl: null,
        waitUntilIndexReady: null,
        waitUntilDocumentReady: null,
        metadata: null,
    },
    docsPath: ["path"],
    newDocs: true,
    model: "model",
    chunkTokenSize: 10,
    contextMaxTokens: 100,
    chunkMode: "multi_lines",
    mustBreakAtEmptyLine: true,
    useCustomEmbedding: false,
    embeddingFunction: "function",
    customizedPrompt: "prompt",
    customizedAnswerPrefix: "prefix",
    updateContext: true,
    collectionName: "collection",
    getOrCreate: true,
    overwrite: false,
    useCustomTokenCount: false,
    customTokenCountFunction: "function",
    useCustomTextSplit: false,
    customTextSplitFunction: "function",
    customTextTypes: ["type"],
    recursive: true,
    distanceThreshold: 0.5,
    nResults: 10,
};

describe("getRetrieveConfig", () => {
    it("should return the default retrieve config if json is not an object", () => {
        const retrieveConfig = getRetrieveConfig(4 as any);
        expect(retrieveConfig).toEqual(defaultRetrieveConfig);
    });
    it("should return the default retrieve config if key not in json", () => {
        const retrieveConfig = getRetrieveConfig({});
        expect(retrieveConfig).toEqual(defaultRetrieveConfig);
    });
    it("should return the default retrieve config if data.retrieveConfig is not an object", () => {
        const retrieveConfig = getRetrieveConfig({
            data: { retrieveConfig: 4 },
        });
        expect(retrieveConfig).toEqual(defaultRetrieveConfig);
    });
    it("should return a retrieve config", () => {
        const retrieveConfig = getRetrieveConfig({
            retrieveConfig: retrieveJson,
        });
        expect(retrieveConfig).toEqual(retrieveJson);
    });
    it("should return a retrieve config if the key is in the data", () => {
        const retrieveConfig = getRetrieveConfig({
            data: { retrieveConfig: retrieveJson },
        });
        expect(retrieveConfig).toEqual(retrieveJson);
    });
    it("should include a localStoragePath if it is in the dbConfig", () => {
        const retrieveConfig = getRetrieveConfig({
            retrieveConfig: {
                ...retrieveJson,
                dbConfig: {
                    ...retrieveJson.dbConfig,
                    localStoragePath: "path",
                },
            },
        });
        expect(retrieveConfig).toEqual({
            ...retrieveJson,
            dbConfig: {
                ...retrieveJson.dbConfig,
                localStoragePath: "path",
            },
        });
    });
    it("should include a connectionUrl if it is in the dbConfig", () => {
        const retrieveConfig = getRetrieveConfig({
            retrieveConfig: {
                ...retrieveJson,
                dbConfig: {
                    ...retrieveJson.dbConfig,
                    connectionUrl: "url",
                },
            },
        });
        expect(retrieveConfig).toEqual({
            ...retrieveJson,
            dbConfig: {
                ...retrieveJson.dbConfig,
                connectionUrl: "url",
            },
        });
    });
});
