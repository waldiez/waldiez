/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentRagUser } from "@waldiez/models/Agent/RagUser/RagUser";
export type { WaldiezAgentRagUserData } from "@waldiez/models/Agent/RagUser/RagUserData";

/**
 * WaldiezVectorDbConfig
 * Configuration for the vector database.
 * @param model - The model to use for the vector database.
 * @param useMemory - Whether to use memory for the vector database.
 * @param useLocalStorage - Whether to use local storage for the vector database.
 * @param localStoragePath - The path to the local storage for the vector database.
 * @param connectionUrl - The connection URL for the vector database.
 * @param waitUntilIndexReady - Whether to wait until the index is ready.
 * @param waitUntilDocumentReady - Whether to wait until the document is ready.
 * @param metadata - Metadata for the vector database.
 */
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

/**
 * WaldiezRagUserRetrieveConfig
 * Configuration for the RAG user.
 * @param task - The task to perform (code, qa, default).
 * @param vectorDb - The vector database to use (chroma, pgvector, mongodb, qdrant).
 * @param dbConfig - The configuration for the vector database.
 * @param docsPath - The path to the documents.
 * @param newDocs - Whether to use new documents.
 * @param model - The model to use.
 * @param chunkTokenSize - The size of the chunk in tokens.
 * @param contextMaxTokens - The maximum number of tokens in the context.
 * @param chunkMode - The mode for chunking (multi_lines, one_line).
 * @param mustBreakAtEmptyLine - Whether to break at empty lines.
 * @param useCustomEmbedding - Whether to use custom embedding.
 * @param embeddingFunction - The function for embedding.
 * @param customizedPrompt - The customized prompt.
 * @param customizedAnswerPrefix - The customized answer prefix.
 * @param updateContext - Whether to update the context.
 * @param collectionName - The name of the collection.
 * @param getOrCreate - Whether to get or create the collection.
 * @param overwrite - Whether to overwrite the collection.
 * @param useCustomTokenCount - Whether to use custom token count.
 * @param customTokenCountFunction - The function for custom token count.
 * @param useCustomTextSplit - Whether to use custom text split.
 * @param customTextSplitFunction - The function for custom text split.
 * @param customTextTypes - The types of custom text.
 * @param recursive - Whether to use recursive search.
 * @param distanceThreshold - The distance threshold for search results.
 * @param nResults - The number of results to return.
 */
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

/**
 * WaldiezNodeAgentRagUserData
 * Represents the data for the RAG user agent node.
 * @param label - The label of the node.
 * @param retrieveConfig - The configuration for the RAG user.
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param parentId - The parent id of the agent (if in a group)
 * @param agentType - The agent type
 * @param systemMessage - The system message
 * @param humanInputMode - The human input mode
 * @param codeExecutionConfig - The code execution configuration
 * @param agentDefaultAutoReply - The agent default auto reply
 * @param maxConsecutiveAutoReply - The max consecutive auto reply
 * @param termination - The termination message check
 * @param nestedChats - The nested chats
 * @param contextVariables - The context variables
 * @param updateAgentStateBeforeReply - Optional handler to update the agent state before replying
 * @param afterWork - The handoff transition after work
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @see {@link WaldiezNodeAgentType}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentCommonData}
 * @see {@link WaldiezRagUserRetrieveConfig}
 * @see {@link WaldiezVectorDbConfig}
 */
export type WaldiezNodeAgentRagUserData = WaldiezAgentCommonData & {
    label: string;
    retrieveConfig: WaldiezRagUserRetrieveConfig;
};

/**
 * WaldiezNodeAgentRagUser
 * The react-flow node component for a RAG user agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentRagUserData}
 */
export type WaldiezNodeAgentRagUser = Node<WaldiezNodeAgentRagUserData, "agent">;
