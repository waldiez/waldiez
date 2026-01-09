/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentDocAgent } from "@waldiez/models/Agent/DocAgent/DocAgent";

export type { WaldiezAgentDocAgentData } from "@waldiez/models/Agent/DocAgent/DocAgentData";

/**
 * RAGQueryEngine
 * The configuration for the RAG query engine used by the document agent.
 * It can be one of the following:
 * @param type - The type of the query engine.
 *               Can be "VectorChromaQueryEngine", "VectorChromaCitationQueryEngine",
 *               or "InMemoryQueryEngine".
 * @param dbPath - The path to the database (not required for InMemoryQueryEngine).
 * @param enable_query_citations - Whether to enable query citations (only for VectorChromaCitationQueryEngine).
 * @param citation_chunk_size - The size of the citation chunks (only for VectorChromaCitationQueryEngine).
 **/
export type RAGQueryEngine = {
    type: "VectorChromaQueryEngine" | "VectorChromaCitationQueryEngine" | "InMemoryQueryEngine";
    dbPath?: string | null; // not required for InMemoryQueryEngine
    enableQueryCitations?: boolean; // only for VectorChromaCitationQueryEngine
    citationChunkSize?: number; // only for VectorChromaCitationQueryEngine
};

/**
 * WaldiezNodeAgentDocAgentData
 * The data for the document agent node.
 * @param label - The label of the node.
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
 * @param collectionName - The name of the collection for the document agent
 * @param resetCollection - Whether to reset the collection before adding new documents
 * @param parsedDocsPath - The path to the parsed documents
 * @param queryEngine - The query engine configuration for the document agent
 * @see {@link WaldiezAgentCommonData}
 * @see {@link RAGQueryEngine}
 * @see {@link WaldiezNodeAgentType}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentCommonData}
 */
export type WaldiezNodeAgentDocAgentData = WaldiezAgentCommonData & {
    label: string;
    collectionName: string | null;
    resetCollection: boolean;
    parsedDocsPath: string | null;
    queryEngine: RAGQueryEngine | null;
};

/**
 * WaldiezNodeAgentDocAgent
 * The document agent node.
 * @see {@link WaldiezNodeAgentDocAgentData}
 */
export type WaldiezNodeAgentDocAgent = Node<WaldiezNodeAgentDocAgentData, "agent">;
