/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { RAGQueryEngine } from "@waldiez/models/Agent";

/**
 * Retrieves the collection name from the agent data.
 * @param data - The agent data object.
 * @returns The collection name or null if not specified.
 */
export const getCollectionName = (data: any): string | null => {
    return data.collectionName ? String(data.collectionName) : null;
};

/**
 * Checks if the collection should be reset based on the agent data.
 * @param data - The agent data object.
 * @returns True if the collection should be reset, false otherwise.
 */
export const getResetCollection = (data: any): boolean => {
    return data.resetCollection === true || String(data.resetCollection).toLowerCase() === "true";
};

/**
 * Retrieves the query engine configuration from the agent data.
 * @param data - The agent data object.
 * @returns The query engine configuration or null if not specified.
 */
export const getQueryEngine = (data: any): RAGQueryEngine | null => {
    if (!data.queryEngine) {
        return null;
    }
    let engineType = "VectorChromaQueryEngine" as
        | "VectorChromaQueryEngine"
        | "VectorChromaCitationQueryEngine"
        | "InMemoryQueryEngine";
    if (
        data.queryEngine.type &&
        typeof data.queryEngine.type === "string" &&
        ["VectorChromaQueryEngine", "VectorChromaCitationQueryEngine", "InMemoryQueryEngine"].includes(
            data.queryEngine.type,
        )
    ) {
        engineType = data.queryEngine.type as
            | "VectorChromaQueryEngine"
            | "VectorChromaCitationQueryEngine"
            | "InMemoryQueryEngine";
    }
    let dbPath: string | null = null;
    if (data.queryEngine.dbPath && typeof data.queryEngine.dbPath === "string") {
        dbPath = data.queryEngine.dbPath;
    }
    let enableQueryCitations = false;
    if (data.queryEngine.enableQueryCitations && typeof data.queryEngine.enableQueryCitations === "boolean") {
        enableQueryCitations = data.queryEngine.enableQueryCitations;
    }
    let citationChunkSize: number | undefined = undefined;
    if (
        data.queryEngine.citationChunkSize &&
        typeof data.queryEngine.citationChunkSize === "number" &&
        data.queryEngine.citationChunkSize > 0
    ) {
        citationChunkSize = data.queryEngine.citationChunkSize;
    }
    return {
        type: engineType,
        dbPath: dbPath,
        enableQueryCitations: enableQueryCitations,
        citationChunkSize: citationChunkSize,
    } as RAGQueryEngine;
};

/** * Retrieves the path to the parsed documents from the agent data.
 * @param data - The agent data object.
 * @returns The path to the parsed documents or null if not specified.
 */
export const getParsedDocsPath = (data: any): string | null => {
    return data.parsedDocsPath ? String(data.parsedDocsPath) : null;
};
