/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getCollectionName,
    getParsedDocsPath,
    getQueryEngine,
    getResetCollection,
} from "@waldiez/models/mappers/agent/utils/docAgent";

describe("getCollectionName", () => {
    it("should return null if collectionName not in data", () => {
        expect(getCollectionName({})).toEqual(null);
    });
    it("should return collectionName as string if it exists", () => {
        const collectionName = "testCollection";
        expect(getCollectionName({ collectionName })).toEqual(collectionName);
    });
});

describe("getParsedDocsPath", () => {
    it("should return null if parsedDocsPath not in data", () => {
        expect(getParsedDocsPath({})).toEqual(null);
    });
    it("should return parsedDocsPath as string if it exists", () => {
        const parsedDocsPath = "testParsedDocsPath";
        expect(getParsedDocsPath({ parsedDocsPath })).toEqual(parsedDocsPath);
    });
});

describe("getQueryEngine", () => {
    it("should return null if queryEngine not in data", () => {
        expect(getQueryEngine({})).toEqual(null);
    });
    it("should extract query engine configuration correctly", () => {
        const data = {
            queryEngine: {
                type: "VectorChromaQueryEngine",
                dbPath: "testDbPath",
                enableQueryCitations: true,
                citationChunkSize: 100,
            },
        };
        const result = getQueryEngine(data);
        expect(result).toEqual({
            type: "VectorChromaQueryEngine",
            dbPath: "testDbPath",
            enableQueryCitations: true,
            citationChunkSize: 100,
        });
    });
    it("should handle missing optional fields in query engine", () => {
        const data = {
            queryEngine: {
                type: "InMemoryQueryEngine",
            },
        };
        const result = getQueryEngine(data);
        expect(result).toEqual({
            type: "InMemoryQueryEngine",
            dbPath: null,
            enableQueryCitations: false,
            citationChunkSize: undefined,
        });
    });
    it("should handle invalid query engine type", () => {
        const data = {
            queryEngine: {
                type: "InvalidQueryEngineType",
                dbPath: "testDbPath",
            },
        };
        const result = getQueryEngine(data);
        expect(result).toEqual({
            type: "VectorChromaQueryEngine", // Default to first valid type
            dbPath: "testDbPath",
            enableQueryCitations: false,
            citationChunkSize: undefined,
        });
    });
});

describe("getResetCollection", () => {
    it("should return false if resetCollection not in data", () => {
        expect(getResetCollection({})).toEqual(false);
    });
    it("should return true if resetCollection is true", () => {
        expect(getResetCollection({ resetCollection: true })).toEqual(true);
    });
    it("should return false if resetCollection is false", () => {
        expect(getResetCollection({ resetCollection: false })).toEqual(false);
    });
    it("should handle string values for resetCollection", () => {
        expect(getResetCollection({ resetCollection: "true" })).toEqual(true);
        expect(getResetCollection({ resetCollection: "false" })).toEqual(false);
    });
});
