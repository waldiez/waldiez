/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type WaldiezVectorDbConfig = {
    model: string;
    useMemory: boolean;
    useLocalStorage: boolean;
    localStoragePath: string | null;
    connectionUrl: string | null;
    waitUntilIndexReady?: boolean | null;
    waitUntilDocumentReady?: boolean | null;
    metadata?: { [key: string]: unknown } | null;
};

export type WaldiezRagUserRetrieveConfig = {
    task: "code" | "qa" | "default";
    vectorDb: "chroma" | "pgvector" | "mongodb" | "qdrant";
    dbConfig: WaldiezVectorDbConfig;
    docsPath: string[];
    newDocs: boolean;
    model: string | null;
    chunkTokenSize: number | null;
    contextMaxTokens: number | null;
    chunkMode: "multi_lines" | "one_line";
    mustBreakAtEmptyLine: boolean;
    useCustomEmbedding: boolean;
    embeddingFunction: string | null;
    customizedPrompt: string | null;
    customizedAnswerPrefix: string | null;
    updateContext: boolean;
    collectionName: string | null;
    getOrCreate: boolean;
    overwrite: boolean;
    useCustomTokenCount: boolean;
    customTokenCountFunction: string | null;
    useCustomTextSplit: boolean;
    customTextSplitFunction: string | null;
    customTextTypes: string[] | null;
    recursive: boolean;
    distanceThreshold: number | null;
    nResults: number | null;
};

export type WaldiezNodeAgentRagUserData = WaldiezAgentCommonData & {
    label: string;
    retrieveConfig: WaldiezRagUserRetrieveConfig;
};

export type WaldiezNodeAgentRagUser = Node<WaldiezNodeAgentRagUserData, "agent">;
