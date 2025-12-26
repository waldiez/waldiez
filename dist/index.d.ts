/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */

import { ActionMeta } from 'react-select';
import { Connection } from '@xyflow/react';
import { Dispatch } from 'react';
import { Edge } from '@xyflow/react';
import { EdgeChange } from '@xyflow/react';
import { FC } from 'react';
import { GroupBase } from 'react-select';
import { MouseEvent as MouseEvent_2 } from 'react';
import { MultiValue } from 'react-select';
import { Node as Node_2 } from '@xyflow/react';
import { NodeChange } from '@xyflow/react';
import { PropsWithChildren } from 'react';
import { ReactFlowInstance } from '@xyflow/react';
import { ReactFlowJsonObject } from '@xyflow/react';
import { RefObject } from 'react';
import { SingleValue } from 'react-select';
import { StoreApi } from 'zustand';
import { TemporalState } from 'zundo';
import { Viewport } from '@xyflow/react';
import { XYPosition } from '@xyflow/react';

export { ActionMeta }

export declare type AfterWorksTransitionContent = {
    source_agent: string;
    transition_target: string;
};

/**
 * Chat UI component props
 * @param messages - Array of chat messages
 * @param userParticipants - Set of user participants
 * @param activeRequest - Active request information (if any)
 * @param error - Error information (if any)
 * @param handlers - Chat-specific handlers
 * @param mediaConfig - Media handling configuration
 */
export declare type ChatUIProps = {
    messages: WaldiezChatMessage[];
    userParticipants: string[] | WaldiezChatParticipant[];
    isDarkMode: boolean;
    handlers?: WaldiezChatHandlers;
    activeRequest?: WaldiezActiveRequest;
    error?: WaldiezChatError;
    mediaConfig?: WaldiezMediaConfig;
};

/**
 * Waldiez Condition Category.
 * @param llm - LLM condition
 * @param context - Context condition
 */
export declare type ConditionCategory = "llm" | "context";

/**
 * Waldiez Condition Type.
 * @param string_llm - String LLM condition
 * @param context_str_llm - Context string LLM condition
 * @param string_context - String context condition
 * @param expression_context - Expression context condition
 */
export declare type ConditionType = "string_llm" | "context_str_llm" | "string_context" | "expression_context";

/**
 * Maps a UI-level control to the wire-level `response` string.
 */
export declare function controlToResponse(control: WaldiezDebugControl | string): string;

/**
 * createWaldiezStore
 * Creates a new Waldiez zustand store.
 * @param props - The props to create the store with
 * @see {@link WaldiezStoreProps}
 * @see {@link WaldiezState}
 * @returns A new Waldiez store
 */
export declare const createWaldiezStore: (props: WaldiezStoreProps) => Omit<StoreApi<WaldiezState>, "temporal"> & {
    temporal: StoreApi<TemporalState<    {
    flowId: string;
    nodes: Node_2[];
    edges: Edge[];
    name: string | undefined;
    description: string | undefined;
    requirements: string[] | undefined;
    tags: string[] | undefined;
    }>>;
};

/**
 * Default chat configuration
 */
export declare const defaultChatConfig: WaldiezChatConfig;

/**
 * Default configuration for group chat speakers.
 * @see {@link GroupChatSpeakerSelectionMethodOption}
 * @see {@link GroupChatSpeakerSelectionMode}
 * @see {@link GroupChatSpeakerTransitionsType}
 */
export declare const defaultGroupChatSpeakers: {
    selectionMethod: GroupChatSpeakerSelectionMethodOption;
    selectionCustomMethod: string;
    maxRetriesForSelecting: null;
    selectionMode: GroupChatSpeakerSelectionMode;
    allowRepeat: boolean;
    allowedOrDisallowedTransitions: {};
    transitionsType: GroupChatSpeakerTransitionsType;
    order: never[];
};

/**
 * Default configuration for Waldiez Reasoning Agent.
 * @see {@link WaldiezReasoningAgentReasonConfig}
 */
export declare const defaultReasonConfig: WaldiezReasoningAgentReasonConfig;

/**
 * Default configuration for Waldiez Rag User Retrieve.
 * @see {@link WaldiezRagUserRetrieveConfig}
 */
export declare const defaultRetrieveConfig: WaldiezRagUserRetrieveConfig;

/**
 * Creates a new WaldiezFlow instance with default values.
 * @returns A new instance of WaldiezFlow.
 */
export declare const emptyFlow: WaldiezFlow;

export declare type ErrorContent = string | Record<string, never>;

export declare type EventBase<TType extends string, TContent> = {
    id?: string;
    type: TType;
    content: TContent;
    sender?: string;
    recipient?: string;
    timestamp?: string;
};

export declare type ExecutedFunctionContent = {
    func_name?: string;
    is_exec_success?: boolean;
    recipient?: string;
    content?: any;
};

export declare type ExecuteFunctionContent = {
    func_name: string;
    recipient: string;
    arguments?: unknown;
};

/**
 * Export a flow to a JSON object.
 * @param data - The flow to export
 * @param hideSecrets - Whether to hide secrets in the exported flow
 * @param skipLinks - Whether to skip links in the exported flow
 * @returns The exported JSON object
 * @see {@link Waldiez}
 * @see {@link WaldiezFlow}
 */
export declare const exportFlow: (data: any, hideSecrets?: boolean, skipLinks?: boolean) => WaldiezFlow;

export declare type GenerateCodeExecutionReplyContent = Record<string, never>;

export { GroupBase }

export declare type GroupChatResumeContent = Record<string, never>;

export declare type GroupChatRunChatContent = {
    speaker: string;
};

/**
 * The method used to select the speaker in a group chat.
 * @param default - The default method (the connections and their orders are specified by the user).
 * @param auto - The automatic method (the connections and their orders are automatically generated by the group manager).
 * @param manual - The manual method (the user is asked to select the next speaker).
 * @param random - The random method (the next speaker is selected randomly).
 * @param round_robin - The round robin method (the next speaker is selected in a round robin fashion).
 */
export declare type GroupChatSpeakerSelectionMethodOption = "default" | "auto" | "manual" | "random" | "round_robin";

/**
 * The mode used to select the speaker in a group chat.
 * It can be one "repeat" or "transition".
 * @param repeat - Specified by whether repetition is allowed or not (or who is allowed to be selected again).
 * @param transition - Custom rules for the transitions between speakers.
 */
export declare type GroupChatSpeakerSelectionMode = "repeat" | "transition";

/**
 * GroupChatSpeakerTransitionsType
 * The type of transitions for the speaker in a group chat.
 * It can be "allowed" or "disallowed".
 * @param allowed - The transitions are allowed.
 * @param disallowed - The transitions are disallowed.
 */
export declare type GroupChatSpeakerTransitionsType = "allowed" | "disallowed";

/**
 * ImportedFlow
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 * @param tags - The tags of the flow
 * @param nodes - The nodes of the flow
 * @param edges - The edges of the flow
 */
export declare type ImportedFlow = {
    name: string;
    description: string;
    requirements: string[];
    createdAt?: string;
    updatedAt?: string;
    isAsync?: boolean;
    cacheSeed?: number | null;
    skipDeps?: boolean | null;
    tags: string[];
    nodes: Node_2[];
    edges: Edge[];
};

/**
 * Import a flow from a JSON object.
 * @param data - The JSON object to import
 * @returns The imported flow
 * @see {@link Waldiez}
 * @see {@link WaldiezFlowProps}
 */
export declare const importFlow: (data: any) => WaldiezFlowProps;

export declare type InfoContent = string | Record<string, never>;

export declare type InputRequestContent = {
    prompt?: string;
    /** Your backend should use this to route the response back to the pending request */
    request_id?: string;
    /** Provide a responder for local mock, else use onRespond prop */
    respond?: (text: string) => void;
};

export declare interface IWaldiezAgentStore {
    /**
     * Get the stored agents.
     * @returns An array of agents.
     * @see {@link WaldiezNodeAgent}
     */
    getAgents: () => WaldiezNodeAgent[];
    /**
     * Get a specific agent by its ID.
     * @param id - The ID of the agent.
     * @returns The agent with the specified ID, or null if not found.
     * @see {@link WaldiezNodeAgent}
     */
    getAgentById: (id: string) => WaldiezNodeAgent | null;
    /** Add a new agent to the store.
     * @param agentType - The type of the agent.
     * @param position - The position of the agent in the flow.
     * @param parentId - The ID of the parent agent, if any.
     * @returns The newly added agent.
     * @see {@link WaldiezNodeAgent}
     */
    addAgent: (agentType: WaldiezNodeAgentType, position: {
        x: number;
        y: number;
    }, parentId: string | undefined) => WaldiezNodeAgent;
    /**
     * Clone an existing agent.
     * @param id - The ID of the agent to clone.
     * @returns The cloned agent, or null if the agent was not found.
     * @see {@link WaldiezNodeAgent}
     */
    cloneAgent: (id: string) => WaldiezNodeAgent | null;
    /**
     * Update the data of a specific agent.
     * @param id - The ID of the agent to update.
     * @param data - The new data for the agent.
     * @see {@link WaldiezNodeAgentData}
     */
    updateAgentData: (id: string, data: Partial<WaldiezNodeAgentData>) => void;
    /**
     * Delete a specific agent from the store.
     * @param id - The ID of the agent to delete.
     */
    deleteAgent: (id: string) => void;
    /**
     * Import an agent into the store.
     * @param agent - The agent data to import.
     * @param agentId - The ID of the agent.
     * @param skipLinks - Whether to skip links.
     * @param position - The position of the agent in the flow.
     * @param save - Whether to save the changes.
     * @returns The imported agent.
     * @see {@link WaldiezNodeAgent}
     */
    importAgent: (agent: {
        [key: string]: unknown;
    }, agentId: string, skipLinks: boolean, position: {
        x: number;
        y: number;
    } | undefined, save: boolean) => WaldiezNodeAgent;
    /**
     * Export a specific agent from the store.
     * @param agentId - The ID of the agent to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported agent data.
     */
    exportAgent: (agentId: string, hideSecrets: boolean) => {
        [key: string]: unknown;
    };
    /**
     * Get the connections of a specific agent.
     * @param nodeId - The ID of the agent.
     * @param options - Options to filter the connections.
     * @returns An object containing sources and targets with their respective nodes and edges.
     */
    getAgentConnections: (nodeId: string, options?: {
        sourcesOnly?: boolean;
        targetsOnly?: boolean;
    }) => WaldiezAgentConnections;
    /**
     * Get the members of a specific group.
     * @param groupId - The ID of the group.
     * @returns An array of agents in the group.
     * @see {@link WaldiezNodeAgent}
     */
    getGroupMembers: (groupId: string) => WaldiezNodeAgent[];
    /**
     * Add a member to a specific group.
     * @param groupId - The ID of the group.
     * @param agentId - The ID of the agent to add.
     * @param position - The position of the agent in the group.
     */
    addGroupMember: (groupId: string, agentId: string, position?: XYPosition) => void;
    /**
     * Remove a member from a specific group.
     * @param groupId - The ID of the group.
     * @param memberId - The ID of the member to remove.
     */
    removeGroupMember: (groupId: string, memberId: string) => void;
    /**
     * Set the group of a specific agent.
     * @param agentId - The ID of the agent.
     * @param groupId - The ID of the group.
     * @param position - The position of the agent in the group.
     */
    setAgentGroup: (agentId: string, groupId: string, position?: XYPosition) => void;
    /**
     * Get the first available group manager agent node
     * @returns The first group manager found if any
     * @see {@link WaldiezNodeAgent}
     */
    getGroupManager: () => WaldiezNodeAgent | undefined;
}

export declare interface IWaldiezChatParticipantsStore {
    setActiveParticipants: (sender: string | null, recipient: string | null) => void;
    resetActiveParticipants: () => void;
    setActiveEventType: (activeEventType: string | null) => void;
    resetActiveEventType: () => void;
}

export declare interface IWaldiezEdgeStore {
    /**
     * Get the stored edges.
     * @returns An array of edges.
     * @see {@link WaldiezEdge}
     */
    getEdges: () => WaldiezEdge[];
    /**
     * Get a specific edge by its ID.
     * @param id - The ID of the edge.
     * @returns The edge with the specified ID, or undefined if not found.
     * @see {@link WaldiezEdge}
     */
    getEdgeById: (id: string) => WaldiezEdge | undefined;
    /**
     * Add a new edge to the store.
     * @param params - The parameters for the new edge.
     * @param params.flowId - The ID of the flow.
     * @param params.connection - The connection data for the edge.
     * @param params.hidden - Whether the edge is hidden.
     * @returns The newly added edge, or null if not added.
     * @see {@link WaldiezEdge}
     */
    addEdge: (params: {
        flowId: string;
        connection: Connection;
        hidden: boolean;
    }) => WaldiezEdge | null;
    /**
     * Delete a specific edge from the store.
     * @param id - The ID of the edge to delete.
     * @see {@link WaldiezEdge}
     */
    deleteEdge: (id: string) => void;
    /**
     * Callback function to handle edge changes.
     * @param changes - An array of edge changes.
     */
    onEdgesChange: (changes: EdgeChange[]) => void;
    /**
     * Update the data of a specific edge.
     * @param id - The ID of the edge to update.
     * @param data - The new data for the edge.
     * @see {@link WaldiezEdgeData}
     */
    updateEdgeData: (id: string, data: Partial<WaldiezEdgeData>) => void;
    /**
     * Update the path of a specific edge.
     * @param id - The ID of the edge to update.
     * @param agentType - The type of the agent.
     */
    updateEdgePath: (id: string, agentType: WaldiezNodeAgentType) => void;
    /**
     * Get the source agent of a specific edge.
     * @param edge - The edge to get the source agent from.
     * @returns The source agent of the edge, or undefined if not found.
     * @see {@link WaldiezNodeAgent}
     */
    getEdgeSourceAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    /**
     * Get the target agent of a specific edge.
     * @param edge - The edge to get the target agent from.
     * @returns The target agent of the edge, or undefined if not found.
     * @see {@link WaldiezNodeAgent}
     */
    getEdgeTargetAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    /**
     * Update the type of a specific edge.
     * @param id - The ID of the edge to update.
     * @param type - The new type for the edge.
     * @see {@link WaldiezEdgeType}
     */
    updateEdgeType: (id: string, type: WaldiezEdgeType) => void;
    /**
     * Callback function to handle edge double-click events.
     * @param event - The double-click event.
     * @param edge - The edge that was double-clicked.
     */
    onEdgeDoubleClick: (event: MouseEvent_2, edge: WaldiezEdge) => void;
    /**
     * Callback function to handle edge connection events.
     * @param oldEdge - The old edge before the connection.
     * @param newConnection - The new connection data.
     */
    onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
}

export declare interface IWaldiezFlowStore {
    /**
     * Get the Viewport of the flow.
     * @returns The Viewport of the flow if available, otherwise undefined.
     */
    getViewport: () => Viewport | undefined;
    /**
     * Get the ReactFlowInstance of the flow.
     * @returns The ReactFlowInstance of the flow if available, otherwise undefined.
     */
    getRfInstance: () => ReactFlowInstance | undefined;
    /**
     * Set the ReactFlowInstance of the flow.
     * @param rfInstance - The ReactFlowInstance to set.
     */
    setRfInstance: (rfInstance: ReactFlowInstance) => void;
    /**
     * Get the flow information.
     * @returns The flow information.
     * @see {@link WaldiezFlowInfo}
     */
    getFlowInfo: () => WaldiezFlowInfo;
    /** Callback function to handle flow changes.
     * @returns The current flow.
     * @see {@link WaldiezFlow}
     */
    onFlowChanged: () => WaldiezFlow;
    /**
     * Callback function to handle viewport changes.
     * @param viewport - The new viewport data.
     * @param nodeType - The type of the node.
     * @see {@link WaldiezNodeType}
     */
    onViewportChange: (viewport: {
        x: number;
        y: number;
        zoom: number;
    }, nodeType: WaldiezNodeType) => void;
    /**
     * Save the current flow.
     * @returns The saved flow.
     * @see {@link WaldiezFlow}
     */
    saveFlow: () => void;
    /**
     * Get the flow edges.
     * @returns An object containing used and remaining edges.
     * @see {@link WaldiezEdge}
     */
    getFlowEdges: () => {
        used: WaldiezEdge[];
        remaining: WaldiezEdge[];
    };
    /**
     * Import a flow into the store.
     * @param items - The items to import.
     * @param flowData - The flow data to import.
     * @param typeShown - The type of the node to show.
     * @see {@link ThingsToImport}
     * @see {@link ImportedFlow}
     * @see {@link WaldiezNodeType}
     */
    importFlow: (items: ThingsToImport, flowData: ImportedFlow, typeShown: WaldiezNodeType) => void;
    /**
     * Export the current flow.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @param skipLinks - Whether to skip links in the exported data.
     * @returns The exported flow.
     * @see {@link WaldiezFlow}
     */
    exportFlow: (hideSecrets: boolean, skipLinks: boolean) => WaldiezFlow;
    /**
     * Update the flow order.
     * @param data - An array of objects containing the ID and order of the flow.
     * @param data.id - The ID of the flow.
     * @param data.order - The order of the flow.
     */
    updateFlowOrder: (data: {
        id: string;
        order: number;
    }[]) => void;
    /**
     * Update the flow prerequisites.
     * @param edges - An array of edges to update the prerequisites.
     * @see {@link WaldiezEdge}
     */
    updateFlowPrerequisites: (edges: WaldiezEdge[]) => void;
    /**
     * Update the flow information.
     * @param data - The new flow information.
     * @param data.name - The name of the flow.
     * @param data.description - The description of the flow.
     * @param data.tags - An array of tags for the flow.
     * @param data.requirements - An array of requirements for the flow.
     * @param data.isAsync - Whether the flow is asynchronous.
     * @param data.cacheSeed - The cache seed for the flow.
     * @param data.skipDeps - Skip installing dependencies.
     */
    updateFlowInfo: (data: {
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        isAsync: boolean;
        cacheSeed?: number | null;
        skipDeps?: boolean | null;
    }) => void;
}

export declare interface IWaldiezModelStore {
    /**
     * Get the stored models.
     * @returns An array of models.
     * @see {@link WaldiezNodeModel}
     */
    getModels: () => WaldiezNodeModel[];
    /**
     * Get a specific model by its ID.
     * @param id - The ID of the model.
     * @returns The model with the specified ID, or null if not found.
     * @see {@link WaldiezNodeModel}
     */
    getModelById: (id: string) => WaldiezNodeModel | null;
    /**
     * Add a new model to the store.
     * @returns The newly added model.
     * @see {@link WaldiezNodeModel}
     */
    addModel: () => WaldiezNodeModel;
    /**
     * Clone an existing model.
     * @param id - The ID of the model to clone.
     * @returns The cloned model, or null if the model was not found.
     * @see {@link WaldiezNodeModel}
     */
    cloneModel: (id: string) => WaldiezNodeModel | null;
    /**
     * Update the data of a specific model.
     * @param id - The ID of the model to update.
     * @param data - The new data for the model.
     * @see {@link WaldiezNodeModelData}
     */
    updateModelData: (id: string, data: Partial<WaldiezNodeModelData>) => void;
    /**
     * Delete a specific model from the store.
     * @param id - The ID of the model to delete.
     */
    deleteModel: (id: string) => void;
    /**
     * Import a model into the store.
     * @param model - The model data to import.
     * @param modelId - The ID of the model.
     * @param position - The position of the model in the flow.
     * @param save - Whether to save the changes.
     * @returns The imported model.
     * @see {@link WaldiezNodeModel}
     */
    importModel: (model: {
        [key: string]: unknown;
    }, modelId: string, position: {
        x: number;
        y: number;
    } | undefined, save: boolean) => WaldiezNodeModel;
    /**
     * Export a model from the store.
     * @param modelId - The ID of the model to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported model data.
     */
    exportModel: (modelId: string, hideSecrets: boolean) => {
        [key: string]: unknown;
    };
}

export declare interface IWaldiezNodeStore {
    /**
     * Callback function to handle node changes.
     * @param changes - An array of node changes.
     */
    onNodesChange: (changes: NodeChange[]) => void;
    /**
     * Show nodes of a specific type. (hide the others)
     * @param nodeType - The type of the nodes to show.
     * @see {@link WaldiezNodeType}
     */
    showNodes: (nodeType: WaldiezNodeType) => void;
    /**
     * Re select a node by its ID.
     * @param id - The ID of the node to reselect.
     */
    reselectNode: (id: string) => void;
    /**
     * Callback function to handle node double-click events.
     * @param event - The double-click event.
     * @param node - The node that was double-clicked.
     */
    onNodeDoubleClick: (event: any, node: Node_2) => void;
    /**
     * Highlight a node by its ID.
     * @param id - The ID of the node to highlight.
     */
    highlightNode: (id: string) => void;
    /**
     * Get the highlighted node.
     * @returns The highlighted node, or null if no node is highlighted.
     */
    clearNodeHighlight: () => void;
}

export declare interface IWaldiezToolStore {
    /**
     * Get the stored tools.
     * @returns An array of tools.
     * @see {@link WaldiezNodeTool}
     */
    getTools: () => WaldiezNodeTool[];
    /**
     * Get a tool by its ID.
     * @param id - The ID of the tool.
     * @returns The tool with the specified ID, or null if not found.
     * @see {@link WaldiezNodeTool}
     */
    getToolById: (id: string) => WaldiezNodeTool | null;
    /**
     * Add a new tool to the store.
     * @returns The newly added tool.
     * @see {@link WaldiezNodeTool}
     */
    addTool: () => WaldiezNodeTool;
    /**
     * Clone an existing tool.
     * @param id - The ID of the tool to clone.
     * @returns The cloned tool, or null if the tool was not found.
     * @see {@link WaldiezNodeTool}
     */
    cloneTool: (id: string) => WaldiezNodeTool | null;
    /**
     * Update the data of a tool.
     * @param id - The ID of the tool to update.
     * @param data - The new data for the tool.
     * @see {@link WaldiezNodeToolData}
     */
    updateToolData: (id: string, data: Partial<WaldiezNodeToolData>) => void;
    /**
     * Delete a tool from the store.
     * @param id - The ID of the tool to delete.
     */
    deleteTool: (id: string) => void;
    /**
     * Import a tool into the store.
     * @param tool - The tool data to import.
     * @param toolId - The ID of the tool.
     * @param position - The position of the tool in the flow.
     * @param save - Whether to save the changes.
     * @returns The imported tool.
     * @see {@link WaldiezNodeTool}
     */
    importTool: (tool: {
        [key: string]: unknown;
    }, toolId: string, position: {
        x: number;
        y: number;
    } | undefined, save: boolean) => WaldiezNodeTool;
    /**
     * Export a tool from the store.
     * @param toolId - The ID of the tool to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported tool data.
     */
    exportTool: (toolId: string, hideSecrets: boolean) => {
        [key: string]: unknown;
    };
}

export { MultiValue }

export declare type OnConditionLLMTransitionContent = {
    source_agent: string;
    transition_target: string;
};

export declare type OnContextConditionTransitionContent = {
    source_agent: string;
    transition_target: string;
};

export declare type PostCarryoverContent = {
    sender: string;
    recipient: string;
    message: string;
};

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
export declare type RAGQueryEngine = {
    type: "VectorChromaQueryEngine" | "VectorChromaCitationQueryEngine" | "InMemoryQueryEngine";
    dbPath?: string | null;
    enableQueryCitations?: boolean;
    citationChunkSize?: number;
};

/**
 * reasonConfigAnswerApproach
 * The approach used for answering.
 * It can be "pool" or "best".
 * @param pool - The pool approach.
 * @param best - The best approach.
 * @see {@link WaldiezReasoningAgentReasonConfig}
 */
export declare type reasonConfigAnswerApproach = "pool" | "best";

/**
 * reasonConfigMethod
 * The method used for reasoning.
 * It can be "beam_search", "mcts", "lats", or "dfs".
 * @param beam_search - The beam search method.
 * @param mcts - The Monte Carlo Tree Search method.
 * @param lats - The LATS method.
 * @param dfs - The depth-first search method.
 * @see {@link WaldiezReasoningAgentReasonConfig}
 */
export declare type reasonConfigMethod = "beam_search" | "mcts" | "lats" | "dfs";

export declare type ReplyResultTransitionContent = {
    source_agent: string;
    transition_target: string;
};

export declare type RunCompletionContent = Record<string, never>;

/**
 * Show a snackbar notification.
 * @param props - The properties of the snackbar to show
 * @param props.flowId - The ID of the flow associated with the snackbar
 * @param props.message - The message to display in the snackbar
 * @param props.level - The level of the snackbar (default: "info")
 * @param props.details - Additional details to display in the snackbar
 * @param props.duration - The duration in milliseconds for which the snackbar should be visible (default: 3000)
 * @param props.withCloseButton - Whether to show a close button in the snackbar (default: true)
 * @see {@link ShowSnackbarProps}
 */
export declare const showSnackbar: (props: {
    flowId?: string;
    message: string;
    level?: "info" | "success" | "warning" | "error";
    details?: string | Error | object | null;
    duration?: number;
    withCloseButton?: boolean;
}) => void;

export declare type ShowSnackbarProps = {
    flowId?: string;
    message: string;
    level?: SnackbarLevel;
    details?: SnackbarDetails;
    duration?: number;
    withCloseButton?: boolean;
};

export { SingleValue }

export declare type SnackbarContextType = {
    enqueueSnackbar: (props: ShowSnackbarProps) => void;
};

export declare type SnackbarDetails = string | Error | object | null;

export declare type SnackbarItem = ShowSnackbarProps & {
    id: string;
};

export declare type SnackbarLevel = "info" | "warning" | "error" | "success";

export declare type SnackbarQueue = SnackbarItem[];

export declare type TerminationAndHumanReplyNoInputContent = {
    no_human_input_msg: string;
    sender: string;
    recipient: string;
};

export declare type TerminationContent = {
    termination_reason?: string;
};

export declare type TextContent = {
    sender: string;
    recipient: string;
    content: any;
};

/**
 * ThingsToImport
 * @param override - Whether to override the existing flow
 * @param everything - Whether to import everything
 * @param name - Whether to import the name
 * @param description - Whether to import the description
 * @param tags - Whether to import the tags
 * @param requirements - Whether to import the requirements
 * @param isAsync - Whether to import the async property
 * @param cacheSeed - Whether to import the cache seed
 * @param nodes - The nodes to import
 * @param edges - The edges to import
 */
export declare type ThingsToImport = {
    override: boolean;
    everything: boolean;
    name: boolean;
    description: boolean;
    tags: boolean;
    requirements: boolean;
    isAsync: boolean;
    cacheSeed?: boolean | null;
    skipDeps?: boolean | null;
    nodes: {
        models: Node_2[];
        tools: Node_2[];
        agents: Node_2[];
    };
    edges: Edge[];
};

export declare type ToolCall = {
    function: {
        name: string;
        arguments?: string;
    };
};

export declare type ToolCallContent = {
    sender: string;
    recipient: string;
    tool_calls: ToolCall[];
};

export declare type ToolResponseContent = {
    content: string;
    sender: string;
    recipient: string;
};

declare type TransitionEvent_2 = EventBase<"on_context_condition_transition", OnContextConditionTransitionContent> | EventBase<"after_works_transition", AfterWorksTransitionContent> | EventBase<"on_condition_llm_transition", OnConditionLLMTransitionContent> | EventBase<"on_condition_l_l_m_transition", OnConditionLLMTransitionContent> | EventBase<"reply_result_transition", ReplyResultTransitionContent>;
export { TransitionEvent_2 as TransitionEvent }

/**
 * The types of targets that can be used in a handoff.
 * These can be used in either an `OnCondition` transition or an `AfterWork` transition.
 * Possible values are:
 * - `AgentTarget`: A specific agent target.
 * - `RandomAgentTarget`: A random agent target.
 * - `GroupChatTarget`: A group chat target.
 * - `NestedChatTarget`: A nested chat target.
 * - `AskUserTarget`: Ask the user for input.
 * - `GroupManagerTarget`: A group manager target.
 * - `RevertToUserTarget`: Revert to the user.
 * - `StayTarget`: Stay in the current state.
 * - `TerminateTarget`: Terminate the conversation.
 * @param AgentTarget - A specific agent target.
 * @param RandomAgentTarget - A random agent target.
 * @param GroupChatTarget - A group chat target.
 * @param NestedChatTarget - A nested chat target.
 * @param AskUserTarget - Ask the user for input.
 * @param GroupManagerTarget - A group manager target.
 * @param RevertToUserTarget - Revert to the user.
 * @param StayTarget - Stay in the current state.
 * @param TerminateTarget - Terminate the conversation.
 * @see {@link WaldiezTransitionTarget}
 */
export declare type TransitionTargetType = "AgentTarget" | "RandomAgentTarget" | "GroupChatTarget" | "NestedChatTarget" | "AskUserTarget" | "GroupManagerTarget" | "RevertToUserTarget" | "StayTarget" | "TerminateTarget";

/**
 * typeOfGet
 * @see {@link WaldiezState}
 */
export declare type typeOfGet = () => WaldiezState;

/**
 * typeOfSet
 * @param partial - The partial state to set
 * @param replace - Whether to replace the state or not
 * @see {@link WaldiezState}
 */
export declare type typeOfSet = {
    (partial: WaldiezState | Partial<WaldiezState> | ((state: WaldiezState) => WaldiezState | Partial<WaldiezState>), replace?: false): void;
};

/**
 * useWaldiezChat hook.
 */
export declare const useWaldiezChat: (props: {
    initialConfig?: Partial<WaldiezChatConfig>;
    handlers?: Partial<WaldiezChatHandlers>;
    preprocess?: (message: any) => {
        handled: boolean;
        updated?: any;
    };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
}) => {
    chat: WaldiezChatConfig;
    dispatch: Dispatch<WaldiezChatAction>;
    process: (message: any) => void;
    reset: () => void;
    setActive: (active: boolean) => void;
    setShow: (show: boolean) => void;
    setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
    setError: (error: WaldiezChatError | undefined) => void;
    setTimeline: (timeline: WaldiezTimelineData | undefined) => void;
    setParticipants: (participants: WaldiezChatParticipant[]) => void;
    addMessage: (message: WaldiezChatMessage) => void;
    removeMessage: (messageId: string) => void;
    clearMessages: () => void;
};

export declare const useWaldiezMessaging: (props: {
    flowId: string;
    onSave?: (contents: string, path?: string | null, force?: boolean) => void | Promise<void>;
    onConvert?: (contents: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>;
    onRun?: (contents: string, path?: string | null) => void | Promise<void>;
    onStepRun?: (contents: string, breakpoints?: (string | WaldiezBreakpoint)[], path?: string | null) => void | Promise<void>;
    preprocess?: (message: any) => {
        handled: boolean;
        updated?: any;
    };
    chat?: {
        initialConfig?: Partial<WaldiezChatConfig>;
        handlers?: Partial<WaldiezChatHandlers>;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
    };
    stepByStep?: {
        initialConfig?: Partial<WaldiezStepByStep>;
        handlers?: Partial<WaldiezStepHandlers>;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
    };
}) => {
    save: (contents: string) => Promise<void>;
    convert: (contents: string, to: "py" | "ipynb", path?: string | null) => Promise<void>;
    run: (contents: string, path?: string | null) => Promise<void>;
    stepRun: (contents: string, breakpoints?: (string | WaldiezBreakpoint)[], path?: string | null) => Promise<void>;
    getRunningMode: () => "chat" | "step" | undefined;
    setRunningMode: (mode: "chat" | "step" | undefined) => void;
    process: (data: any) => void;
    reset: () => void;
    dispatch: {
        chat: Dispatch<WaldiezChatAction>;
        step: Dispatch<WaldiezStepByStepAction>;
    };
    chat: WaldiezChatConfig;
    stepByStep: WaldiezStepByStep;
    actions: {
        chat: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (request: WaldiezActiveRequest | undefined, message?: WaldiezChatMessage) => void;
            setError: (error: WaldiezChatError | undefined) => void;
            setTimeline: (timeline: WaldiezTimelineData | undefined) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addMessage: (message: WaldiezChatMessage, isEndOfWorkflow?: boolean) => void;
            removeMessage: (id: string) => void;
            clearMessages: () => void;
        };
        step: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
            setPendingControl: (controlInput: {
                request_id: string;
                prompt: string;
            } | undefined) => void;
            setBreakpoints: (breakpoints: (string | WaldiezBreakpoint)[]) => void;
            setError: (error: string) => void;
            setTimeline: (timeline: WaldiezTimelineData) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addEvent: (event: Record<string, unknown>) => void;
            removeEvent: (id: string) => void;
            clearEvents: () => void;
        };
    };
};

/**
 * useWaldiezChat hook.
 */
export declare const useWaldiezStepByStep: (props: {
    initialConfig?: Partial<WaldiezStepByStep>;
    handlers?: Partial<WaldiezStepHandlers>;
    preprocess?: (message: any) => {
        handled: boolean;
        updated?: any;
    };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
}) => {
    stepByStep: WaldiezStepByStep;
    dispatch: Dispatch<WaldiezStepByStepAction>;
    process: (data: any) => void;
    reset: () => void;
    setActive: (active: boolean) => void;
    setShow: (show: boolean) => void;
    setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
    setPendingControl: (controlInput: {
        request_id: string;
        prompt: string;
    } | undefined) => void;
    setBreakpoints: (breakpoints: (string | WaldiezBreakpoint)[]) => void;
    setError: (error: string | undefined) => void;
    setTimeline: (timeline: WaldiezTimelineData) => void;
    setParticipants: (participants: WaldiezChatParticipant[]) => void;
    addEvent: (event: Record<string, unknown>) => void;
    removeEvent: (id: string) => void;
    clearEvents: () => void;
};

export declare const useWaldiezWs: (props: {
    wsUrl: string;
    protocols?: string | string[] | undefined;
    onError?: (error: any) => void;
    onWsMessage?: WaldiezWsMessageHandler;
    autoPingMs?: number;
}) => {
    wsRef: RefObject<WebSocket | undefined>;
    send: (data: unknown) => boolean;
    connected: boolean;
    setMessageHandler: (fn?: WaldiezWsMessageHandler) => void;
    getConnectionState: () => number;
    reconnect: () => void;
    disconnect: () => void;
};

export declare const useWaldiezWsChat: (props: {
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
    };
    chat?: {
        initialConfig?: Partial<WaldiezChatConfig>;
        handlers?: Partial<WaldiezChatHandlers>;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
    };
}) => {
    chat: WaldiezChatConfig;
    dispatch: Dispatch<WaldiezChatAction>;
    reset: () => void;
    connected: boolean;
    getConnectionState: () => number;
    send: (msg: unknown) => boolean | void;
    reconnect: () => void;
};

export declare const useWaldiezWsMessaging: (props: {
    flowId: string;
    onSave?: (contents: string, path?: string | null) => void | Promise<void>;
    onConvert?: (contents: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>;
    onRun?: (contents: string, path?: string | null) => void | Promise<void>;
    onStepRun?: (contents: string, breakpoints?: (string | WaldiezBreakpoint)[], checkpoint?: string | null, path?: string | null) => void | Promise<void>;
    preprocess?: (message: any) => {
        handled: boolean;
        updated?: any;
    };
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
        rpcTimeout?: number;
    };
    chat?: {
        initialConfig?: Partial<WaldiezChatConfig>;
        handlers?: Partial<WaldiezChatHandlers>;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
    };
    stepByStep?: {
        initialConfig?: Partial<WaldiezStepByStep>;
        handlers?: WaldiezStepHandlers;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
    };
}) => {
    save: (contents: string, path?: string | null) => Promise<void>;
    convert: (contents: string, to: "py" | "ipynb", path?: string | null) => Promise<void>;
    run: (contents: string, path?: string | null) => Promise<void>;
    stepRun: (contents: string, breakpoints?: (string | WaldiezBreakpoint)[], path?: string | null) => Promise<void>;
    getRunningMode: () => "chat" | "step" | undefined;
    setRunningMode: (mode: "chat" | "step" | undefined) => void;
    reset: () => void;
    actions: {
        chat: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (request: WaldiezActiveRequest | undefined, message?: WaldiezChatMessage) => void;
            setError: (error: WaldiezChatError | undefined) => void;
            setTimeline: (timeline: WaldiezTimelineData | undefined) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addMessage: (message: WaldiezChatMessage, isEndOfWorkflow?: boolean) => void;
            removeMessage: (id: string) => void;
            clearMessages: () => void;
        };
        step: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
            setPendingControl: (controlInput: {
                request_id: string;
                prompt: string;
            } | undefined) => void;
            setBreakpoints: (breakpoints: (string | WaldiezBreakpoint)[]) => void;
            setError: (error: string) => void;
            setTimeline: (timeline: WaldiezTimelineData) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addEvent: (event: Record<string, unknown>) => void;
            removeEvent: (id: string) => void;
            clearEvents: () => void;
        };
    };
    dispatch: {
        chat: Dispatch<WaldiezChatAction>;
        step: Dispatch<WaldiezStepByStepAction>;
    };
    chat: WaldiezChatConfig;
    stepByStep: WaldiezStepByStep;
    connected: boolean;
    getConnectionState: () => number;
    send: (message: any) => void;
    reconnect: () => void;
    disconnect: () => void;
    request: <T = any>(type: string, payload?: any) => Promise<T>;
};

export declare const useWaldiezWsStepByStep: (props: {
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
    };
    stepByStep?: {
        initialConfig?: Partial<WaldiezStepByStep>;
        handlers?: Partial<WaldiezStepHandlers>;
        preprocess?: (message: any) => {
            handled: boolean;
            updated?: any;
        };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
    };
}) => {
    stepByStep: WaldiezStepByStep;
    dispatch: Dispatch<WaldiezStepByStepAction>;
    reset: () => void;
    connected: boolean;
    getConnectionState: () => number;
    send: (msg: unknown) => boolean | void;
    reconnect: () => void;
};

export declare type UsingAutoReplyContent = {
    sender: string;
    recipient: string;
};

/**
 * Possible Condition categories.
 * Split the condition types into 2 main categories:
 * - `llm`: LLM conditions (e.g. string_llm, context_str_llm)
 * - `context`: Context conditions (e.g. string_context, expression_context)
 */
export declare const ValidConditionCategories: ConditionCategory[];

/**
 * Possible Condition types
 * These are the possible values for the `conditionType` field in a handoff condition.
 */
export declare const ValidConditionTypes: ConditionType[];

/**
 * Possible Transition target types
 * These are the possible values for the `targetType` field in a handoff transition.
 */
export declare const ValidTransitionTargetTypes: TransitionTargetType[];

/**
 * Waldiez component
 * @param props - The props of the component
 * @primaryExport
 * @category Component
 * @example
 ```tsx
 import React from "react";
 import ReactDOM from "react-dom/client";

 import { Edge, Node, Viewport } from "@xyflow/react";

 import { Waldiez, importFlow } from "@waldiez/react";
 import "@waldiez/react/dist/@waldiez.css";

 // starting with an empty flow
 const nodes: Node[] = []
 const edges: Edge[] = []
 const viewport: Viewport = { x: 0, y: 0, zoom: 1 }

 ReactDOM.createRoot(document.getElementById("root")!).render(
 <React.StrictMode>
 <Waldiez
 flowId="flow-0"
 storageId="storage-0"
 name="My Flow"
 description="A sample flow"
 tags={["example"]}
 requirements={[]}
 nodes={nodes}
 edges={edges}
 viewport={viewport}
 />
 </React.StrictMode>
 ```
 * @example
 ```tsx
 import { Waldiez, importFlow, WaldiezProps } from "@waldiez/react";

 // Import flow from an existing .waldiez file
 // could be loaded from a backend or local storage
 const flowJson = {
 // existing data
 };

 const flowData = importFlow(flowJson);

 // Override specific properties
 const overrides: Partial<WaldiezProps> = {
 onSave: (flow) => saveToBackend(flow),
 readOnly: isViewMode,
 skipImport: true,
 };

 function ExistingFlow() {
 return (
 <Waldiez
 {...flowData}
 {...overrides}
 />
 );
 }
 ```
 * @see {@link WaldiezProps}
 */
declare const Waldiez: FC<Partial<WaldiezProps>>;
export { Waldiez }
export default Waldiez;

/**
 * Active request information
 * @param request_id - ID of the request
 * @param prompt - Prompt associated with the request
 * @param acceptedMediaTypes - Accepted media types for the request
 */
export declare type WaldiezActiveRequest = {
    request_id: string;
    prompt: string;
    password?: boolean;
    acceptedMediaTypes?: WaldiezMediaType[];
};

/**
 * Waldiez Agent.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("user_proxy" | "assistant" | "rag_user_proxy" | "reasoning" | "captain" | "group_manager")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentData}
 */
export declare class WaldiezAgent {
    id: string;
    type: string;
    agentType: WaldiezNodeAgentType;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezAgentData;
    rest?: {
        [key: string]: unknown;
    };
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentData;
        rest?: {
            [key: string]: unknown;
        };
    });
    static create(agentType: WaldiezAgentType): WaldiezAgent;
}

/**
 * Waldiez Agent Assistant.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("assistant")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentAssistantData}
 * @param rest - Any other data
 * @see {@link WaldiezAgent}
 */
export declare class WaldiezAgentAssistant extends WaldiezAgent {
    data: WaldiezAgentAssistantData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentAssistantData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Assistant Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param isMultimodal - The multimodal flag of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentAssistantData extends WaldiezAgentData {
    isMultimodal: boolean;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs: string[];
        isMultimodal: boolean;
    });
}

/**
 * WaldiezAgentCaptain
 * @param id - The id of the captain agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (captain)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentCaptainData}
 * @param rest - Any other data
 */
export declare class WaldiezAgentCaptain extends WaldiezAgent {
    data: WaldiezAgentCaptainData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentCaptainData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Captain Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param toolLib - The tool library of the agent
 * @param maxRound - The maximum round of the agent
 * @param maxTurns - The maximum turns of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentCaptainData extends WaldiezAgentData {
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs: string[];
        agentLib: WaldiezCaptainAgentLibEntry[];
        toolLib: "default" | null;
        maxRound: number;
        maxTurns: number;
    });
}

/**
 * Code execution configuration.
 * either a {@link WaldiezAgentCodeExecutionConfigDict} or false (to disable)
 */
export declare type WaldiezAgentCodeExecutionConfig = WaldiezAgentCodeExecutionConfigDict | false;

/**
 * Code execution configuration.
 * @param workDir - The working directory
 * @param useDocker - Either boolean (to enable/disable) or string (to specify the images)
 * @param timeout - The timeout
 * @param lastNMessages - The last N messages
 * @param functions - The functions (tool ids) to use
 */
export declare type WaldiezAgentCodeExecutionConfigDict = {
    workDir?: string;
    useDocker?: string | string[] | boolean | null;
    timeout?: number;
    lastNMessages?: number | "auto";
    functions?: string[];
};

/**
 * Waldiez agent common (for all agent types) data.
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
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param afterWork - The handoff transition after work
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 */
export declare type WaldiezAgentCommonData = {
    name: string;
    description: string;
    parentId: string | undefined | null;
    agentType: WaldiezNodeAgentType;
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
    codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
    agentDefaultAutoReply: string | null;
    maxConsecutiveAutoReply: number | null;
    termination: WaldiezAgentTerminationMessageCheck;
    nestedChats: WaldiezAgentNestedChat[];
    contextVariables?: {
        [key: string]: unknown;
    };
    updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
    handoffs: string[];
    afterWork: WaldiezTransitionTarget | null;
    modelIds: string[];
    tools: WaldiezAgentLinkedTool[];
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
};

/**
 * WaldiezAgentConnections
 * Represents the connections of an agent in terms of its source and target nodes.
 * It contains two properties:
 * @param sources - An object containing nodes and edges that the agent is a source for.
 * @param targets - An object containing nodes and edges that the agent is a target for.
 * Each property has the following structure:
 * - nodes: An array of WaldiezNodeAgent objects representing the nodes.
 * - edges: An array of WaldiezEdge objects representing the edges connecting the nodes.
 */
export declare type WaldiezAgentConnections = {
    sources: {
        nodes: WaldiezNodeAgent[];
        edges: WaldiezEdge[];
    };
    targets: {
        nodes: WaldiezNodeAgent[];
        edges: WaldiezEdge[];
    };
};

/**
 * Waldiez Agent data
 * @param systemMessage - System message
 * @param humanInputMode - Human input mode
 * @param codeExecutionConfig - Code execution configuration
 * @param agentDefaultAutoReply - Default auto reply
 * @param maxConsecutiveAutoReply - Maximum consecutive auto reply
 * @param termination - Termination message check
 * @param modelIds - The agent's model ids
 * @param tools - Tools available to the agent
 * @param parentId - Parent id
 * @param nestedChats - Nested chats
 * @param contextVariables - Context variables
 * @param updateAgentStateBeforeReply - Update agent state before reply
 * @param afterWork - Handoff transition after work
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentData {
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
    codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
    agentDefaultAutoReply: string | null;
    maxConsecutiveAutoReply: number | null;
    termination: WaldiezAgentTerminationMessageCheck;
    modelIds: string[];
    tools: WaldiezAgentLinkedTool[];
    parentId?: string | null;
    nestedChats: WaldiezAgentNestedChat[];
    contextVariables: Record<string, any>;
    updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
    afterWork: WaldiezTransitionTarget | null;
    handoffs: string[];
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs?: string[];
    });
}

/**
 * Waldiez Agent Document Agent.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("doc_agent")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentDocAgentData}
 * @param rest - Any other data
 * @see {@link WaldiezAgent}
 */
export declare class WaldiezAgentDocAgent extends WaldiezAgent {
    data: WaldiezAgentDocAgentData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentDocAgentData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Assistant Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param collectionName - The name of the collection for the agent
 * @param resetCollection - Whether the collection should be reset or not
 * @param parsedDocsPath - The path to the parsed documents for the agent
 * @param queryEngine - The query engine configuration for the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link RAGQueryEngine}
 */
export declare class WaldiezAgentDocAgentData extends WaldiezAgentData {
    collectionName: string | null;
    resetCollection: boolean;
    parsedDocsPath: string | null;
    queryEngine: RAGQueryEngine | null;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs?: string[];
        collectionName?: string | null;
        resetCollection?: boolean;
        parsedDocsPath?: string | null;
        queryEngine?: RAGQueryEngine | null;
    });
}

/**
 * Waldiez Agent Group Manager.
 * @param id - The id of the agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent ("group_manager")
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentGroupManagerData}
 * @param rest - Any other data
 * @see {@link WaldiezAgent}
 */
export declare class WaldiezAgentGroupManager extends WaldiezAgent {
    data: WaldiezAgentGroupManagerData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentGroupManagerData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Group Manager Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param groupName - The name of the group that the agent manages
 * @param maxRound - The maximum number of rounds for the group chat this agent manages
 * @param adminName - The admin name of the agent
 * @param speakers - The speakers of the agent
 * @param enableClearHistory - The enable clear history of the agent
 * @param sendIntroductions - The send introductions of the agent
 * @param initialAgentId - The id of the initial agent in the group
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentGroupManagerSpeakers}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentGroupManagerData extends WaldiezAgentData {
    maxRound: number;
    adminName: string | null;
    speakers: WaldiezAgentGroupManagerSpeakers;
    enableClearHistory?: boolean;
    sendIntroductions?: boolean;
    groupName?: string;
    initialAgentId?: string;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs: string[];
        maxRound: number;
        adminName: string | null;
        speakers: WaldiezAgentGroupManagerSpeakers;
        enableClearHistory?: boolean;
        sendIntroductions?: boolean;
        groupName?: string;
        initialAgentId?: string;
    });
}

/**
 * WaldiezAgentGroupManagerSpeakers
 * @param selectionMethod - The method for selecting speakers
 * @param selectionCustomMethod - The custom method for selecting speakers
 * @param maxRetriesForSelecting - The maximum number of retries for selecting speakers
 * @param selectionMode - The mode for selecting speakers
 * @param allowRepeat - Whether to allow repeat speakers
 * @param allowedOrDisallowedTransitions - The allowed or disallowed transitions for speakers
 * @param transitionsType - The type of transitions for speakers
 * @see {@link GroupChatSpeakerSelectionMethodOption}
 * @see {@link GroupChatSpeakerSelectionMode}
 * @see {@link GroupChatSpeakerTransitionsType}
 * @see {@link defaultGroupChatSpeakers}
 */
export declare class WaldiezAgentGroupManagerSpeakers {
    selectionMethod: GroupChatSpeakerSelectionMethodOption;
    selectionCustomMethod: string;
    maxRetriesForSelecting: number | null;
    selectionMode: GroupChatSpeakerSelectionMode;
    allowRepeat: boolean | string[];
    allowedOrDisallowedTransitions: {
        [key: string]: string[];
    };
    transitionsType: GroupChatSpeakerTransitionsType;
    order: string[];
    constructor(props?: {
        selectionMethod: GroupChatSpeakerSelectionMethodOption;
        selectionCustomMethod: string;
        maxRetriesForSelecting: number | null;
        selectionMode: GroupChatSpeakerSelectionMode;
        allowRepeat: boolean | string[];
        allowedOrDisallowedTransitions: {
            [key: string]: string[];
        };
        transitionsType: GroupChatSpeakerTransitionsType;
        order: string[];
    });
}

/**
 * Human input mode.
 * @param ALWAYS - Always ask for human input
 * @param NEVER - Never ask for human input
 * @param TERMINATE - Ask for human input only when the turn is terminated (no more actions)
 */
export declare type WaldiezAgentHumanInputMode = "ALWAYS" | "NEVER" | "TERMINATE";

/**
 * Waldiez agent linked tools.
 * @param id - The tools id
 * @param executorId - The executor (agent) id
 */
export declare type WaldiezAgentLinkedTool = {
    id: string;
    executorId: string;
};

/**
 * Waldiez agent nested chat.
 * @param triggeredBy - The agent ids that trigger the nested chat
 * @param messages - The messages to include in the chat queue
 * @param condition - The condition for the nested chat (if used as handoff)
 * @param available - The availability of the nested chat (if used as handoff)
 * @see {@link WaldiezHandoffCondition}
 * @see {@link WaldiezHandoffAvailability}
 */
export declare type WaldiezAgentNestedChat = {
    triggeredBy: string[];
    messages: {
        id: string;
        isReply: boolean;
    }[];
    condition: WaldiezHandoffCondition;
    available: WaldiezHandoffAvailability;
};

/**
 * WaldiezAgentRagUser
 * @param id - The id of the rag user agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (rag_user_proxy)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent.
 * @param rest - Any other data
 * @see {@link WaldiezAgentRagUserData}
 */
export declare class WaldiezAgentRagUser extends WaldiezAgent {
    data: WaldiezAgentRagUserData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentRagUserData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Rag User Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model id
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param retrieveConfig - The retrieve configuration of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezRagUserRetrieveConfig}
 * @see {@link defaultRetrieveConfig}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentRagUserData extends WaldiezAgentData {
    retrieveConfig: WaldiezRagUserRetrieveConfig;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        handoffs: string[];
        afterWork: WaldiezTransitionTarget | null;
        retrieveConfig: WaldiezRagUserRetrieveConfig;
    });
}

/**
 * WaldiezAgentReasoning
 * @param id - The id of the reasoning agent
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the node in a graph (reasoning)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentReasoningData}
 * @param rest - Any other data
 */
export declare class WaldiezAgentReasoning extends WaldiezAgent {
    data: WaldiezAgentReasoningData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        agentType: WaldiezNodeAgentType;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        data: WaldiezAgentReasoningData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Reasoning Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param verbose - The verbose flag of the agent
 * @param reasonConfig - The reasoning configuration of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezReasoningAgentReasonConfig}
 * @see {@link defaultReasonConfig}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentReasoningData extends WaldiezAgentData {
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs: string[];
        verbose: boolean;
        reasonConfig: WaldiezReasoningAgentReasonConfig;
    });
}

/**
 * Termination criterion (if the termination type is "keyword").
 * @param found - Termination when the message contains the keyword
 * @param ending - Termination when the message ends with the keyword
 * @param starting - Termination when the message starts with the keyword
 * @param exact - Termination when the message is exactly the keyword
 */
export declare type WaldiezAgentTerminationCriterionOption = "found" | "ending" | "starting" | "exact";

/**
 * Waldiez agent termination message check.
 * @param type - The termination type option {@link WaldiezAgentTypeTerminationTypeOption}
 * @param keywords - The keywords (if the termination type is "keyword")
 * @param criterion - The criterion (if the termination type is "keyword") {@link WaldiezAgentTerminationCriterionOption}
 * @param methodContent - The method content (if the termination type is "method")
 */
export declare type WaldiezAgentTerminationMessageCheck = {
    type: WaldiezAgentTypeTerminationTypeOption;
    keywords: string[];
    criterion: WaldiezAgentTerminationCriterionOption | null;
    methodContent: string | null;
};

/**
 * Waldiez agent type.
 * @param user_proxy - User proxy
 * @param assistant - Assistant
 * @param rag_user_proxy - RAG user proxy
 * @param reasoning - Reasoning
 * @param captain - Captain
 * @param group_manager - Group manager
 */
export declare type WaldiezAgentType = "user_proxy" | "assistant" | "rag_user_proxy" | "reasoning" | "captain" | "group_manager" | "doc_agent";

/**
 * Termination type.
 * @param none - No termination
 * @param keyword - Termination by keyword
 * @param method - Termination by method
 */
export declare type WaldiezAgentTypeTerminationTypeOption = "none" | "keyword" | "method";

/**
 * System message for agent update.
 * @param type - The type of the system message {@link WaldiezAgentUpdateSystemMessageType}
 * @param content - The content of the system message
 */
export declare type WaldiezAgentUpdateSystemMessage = {
    type: WaldiezAgentUpdateSystemMessageType;
    content: string;
};

/**
 * System message type.
 * @param string - String
 * @param callable - Callable
 */
export declare type WaldiezAgentUpdateSystemMessageType = "string" | "callable";

/**
 * Waldiez User Proxy Agent.
 * @param id - The id of the user proxy
 * @param type - The type of the node in a graph (agent)
 * @param agentType - The type of the agent (user)
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param tags - The tags of the agent
 * @param requirements - The requirements of the agent
 * @param createdAt - The creation date of the agent
 * @param updatedAt - The update date of the agent
 * @param data - The data of the agent. See {@link WaldiezAgentUserProxyData}
 */
export declare class WaldiezAgentUserProxy extends WaldiezAgent {
    data: WaldiezAgentUserProxyData;
    agentType: WaldiezNodeAgentType;
    constructor(props: {
        id: string;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        agentType: WaldiezNodeAgentType;
        data: WaldiezAgentUserProxyData;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez User Proxy Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param rest - The rest of the agent data
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezAgentUserProxyData extends WaldiezAgentData {
    constructor(props?: {
        humanInputMode: WaldiezAgentHumanInputMode;
        systemMessage: string | null;
        codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
        agentDefaultAutoReply: string | null;
        maxConsecutiveAutoReply: number | null;
        termination: WaldiezAgentTerminationMessageCheck;
        modelIds: string[];
        tools: WaldiezAgentLinkedTool[];
        parentId?: string | null;
        nestedChats: WaldiezAgentNestedChat[];
        contextVariables: Record<string, any>;
        updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
        afterWork: WaldiezTransitionTarget | null;
        handoffs: string[];
    });
}

/**
 * Breakpoint definition.
 */
export declare type WaldiezBreakpoint = {
    type: WaldiezBreakpointType;
    event_type?: string;
    agent?: string;
    description?: string;
};

export declare type WaldiezBreakpointType = "event" | "agent" | "agent_event" | "all";

export declare class WaldiezBreakpointUtils {
    /**
     * Parse breakpoint from string format
     */
    static fromString(breakpointStr: string): WaldiezBreakpoint;
    /**
     * Convert breakpoint to string representation
     */
    static toString(breakpoint: WaldiezBreakpoint): string;
    /**
     * Check if breakpoint matches an event
     */
    static matches(breakpoint: WaldiezBreakpoint, event: Record<string, unknown>): boolean;
    /**
     * Normalize breakpoint input (string or object) to WaldiezBreakpoint
     */
    static normalize(input: string | WaldiezBreakpoint): WaldiezBreakpoint;
    /**
     * Get display name for breakpoint
     */
    static getDisplayName(breakpoint: WaldiezBreakpoint): string;
}

/**
 * WaldiezCaptainAgentLibEntry
 * Represents an entry in the agent library for the captain agent.
 * @param name - The name of the agent.
 * @param description - The description of the agent.
 * @param systemMessage - The system message for the agent.
 */
export declare type WaldiezCaptainAgentLibEntry = {
    name: string;
    description: string;
    systemMessage: string;
};

/**
 * Waldiez Chat
 * @param id - The ID
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezChatData}
 */
export declare class WaldiezChat {
    id: string;
    type: WaldiezEdgeType;
    source: string;
    target: string;
    data: WaldiezChatData;
    rest?: {
        [key: string]: unknown;
    };
    constructor(props: {
        id: string;
        data: WaldiezChatData;
        type: WaldiezEdgeType;
        source: string;
        target: string;
        rest?: {
            [key: string]: unknown;
        };
    });
    /**
     * Creates a new WaldiezChat instance with default values.
     * @returns A new instance of WaldiezChat.
     */
    static create(props: {
        type: WaldiezEdgeType;
        source: string;
        target: string;
    }): WaldiezChat;
}

declare type WaldiezChatAction = {
    type: "RESET";
    config?: WaldiezChatConfig;
} | {
    type: "SET_ACTIVE";
    active: boolean;
} | {
    type: "SET_SHOW";
    show: boolean;
} | {
    type: "SET_ERROR";
    error?: WaldiezChatError;
} | {
    type: "ADD_MESSAGE";
    message: WaldiezChatMessage;
    isEndOfWorkflow?: boolean;
} | {
    type: "REMOVE_MESSAGE";
    id: string;
} | {
    type: "CLEAR_MESSAGES";
} | {
    type: "SET_TIMELINE";
    timeline?: WaldiezTimelineData;
} | {
    type: "SET_PARTICIPANTS";
    participants: WaldiezChatParticipant[];
} | {
    type: "SET_ACTIVE_REQUEST";
    request?: WaldiezActiveRequest;
    message?: WaldiezChatMessage;
} | {
    type: "SET_CHAT_HANDLERS";
    handlers?: Partial<WaldiezChatHandlers> | undefined;
} | {
    type: "SET_STATE";
    state: Partial<WaldiezChatConfig>;
} | {
    type: "DONE";
};

/**
 * Base message data structure
 * This is the common structure for all message types.
 * It includes the type of message, an optional ID, and a timestamp.
 * @param type - The type of the message (e.g., "input_request", "print", etc.)
 * @param id - An optional unique identifier for the message.
 * @param timestamp - An optional timestamp indicating when the message was created.
 */
export declare type WaldiezChatBaseMessageData = {
    type: string;
    id?: string;
    uuid?: string;
    timestamp?: string;
};

/**
 * Code execution reply data.
 * @param type - The type of the message: "generate_code_execution_reply"
 * @param content - The content of the code execution reply message.
 * @param content.uuid - A unique identifier for the code execution reply.
 * @param content.code_blocks - Optional. An array of code blocks returned by the execution.
 * @param content.sender - The sender of the code execution reply.
 * @param content.recipient - The recipient of the code execution reply.
 */
export declare type WaldiezChatCodeExecutionReplyData = WaldiezChatBaseMessageData & {
    type: "generate_code_execution_reply";
    content: {
        uuid: string;
        code_blocks?: string[];
        sender: string;
        recipient: string;
    };
};

/**
 * Chat configuration type
 * @param show - Whether to display the chat UI
 * @param active - Whether the flow has running
 * @param messages - Array of chat messages
 * @param userParticipants - Set of user participants
 * @param activeRequest - Active request information (if any)
 * @param error - Error information (if any)
 * @param handlers - Chat-specific handlers
 * @param mediaConfig - Media handling configuration
 */
export declare type WaldiezChatConfig = {
    show: boolean;
    active: boolean;
    messages: WaldiezChatMessage[];
    userParticipants: string[] | WaldiezChatParticipant[];
    activeRequest?: WaldiezActiveRequest;
    error?: WaldiezChatError;
    handlers?: WaldiezChatHandlers;
    timeline?: WaldiezTimelineData;
    mediaConfig?: WaldiezMediaConfig;
};

/**
 * WaldiezChatContent structure
 * This type can be a single media content, an array of media contents,
 * or a string. It is used to represent the content of a chat message.
 * @see {@link WaldiezMediaContent}
 */
export declare type WaldiezChatContent = WaldiezMediaContent | WaldiezMediaContent[] | {
    content: WaldiezMediaContent | WaldiezMediaContent[] | string;
} | string;

/**
 * Waldiez Chat Data
 * @param name - The name of the chat
 * @param description - The description of the chat
 * @param clearHistory - Clear history
 * @param maxTurns - The maximum turns
 * @param summary - The summary
 * @param position - The position
 * @param order - The order
 * @param message - The message
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param available - The available for handoff condition
 * @param condition - The handoff condition
 * @param afterWork - The after work transition
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezHandoffCondition}
 * @see {@link WaldiezHandoffAvailability}
 * @see {@link WaldiezTransitionTarget}
 */
export declare class WaldiezChatData {
    sourceType: WaldiezAgentType;
    targetType: WaldiezAgentType;
    name: string;
    description: string;
    position: number;
    order: number;
    clearHistory: boolean;
    message: WaldiezMessage;
    maxTurns: number | null;
    summary: WaldiezChatSummary;
    nestedChat: {
        message: WaldiezMessage | null;
        reply: WaldiezMessage | null;
    };
    prerequisites: string[];
    realSource: string | null;
    realTarget: string | null;
    available: WaldiezHandoffAvailability;
    condition: WaldiezHandoffCondition;
    afterWork: WaldiezTransitionTarget | null;
    silent?: boolean;
    constructor(props?: {
        sourceType: WaldiezAgentType;
        targetType: WaldiezAgentType;
        name: string;
        description: string;
        clearHistory: boolean;
        maxTurns: number | null;
        summary: WaldiezChatSummary;
        position: number;
        order: number;
        message: WaldiezMessage;
        nestedChat: WaldiezNestedChat;
        prerequisites: string[];
        condition: WaldiezHandoffCondition;
        available: WaldiezHandoffAvailability;
        afterWork: WaldiezTransitionTarget | null;
        realSource: string | null;
        realTarget: string | null;
        silent?: boolean;
    });
}

/**
 * Waldiez Chat Data Common
 * @param description - The description of the chat
 * @param position - The position of the chat
 * @param order - The order of the chat
 * @param clearHistory - Clear history
 * @param message - The message used in the chat
 * @param summary - The summary of the chat
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param maxTurns - The maximum turns
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @param sourceType - The source type
 * @param targetType - The target type
 * @param condition - The handoff condition
 * @param available - The available for handoff condition
 * @param afterWork - The after work transition
 * @param silent - The silent mode
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezHandoffCondition}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezHandoffAvailability}
 */
export declare type WaldiezChatDataCommon = {
    description: string;
    position: number;
    order: number;
    clearHistory: boolean;
    message: WaldiezMessage;
    summary: WaldiezChatSummary;
    nestedChat: WaldiezNestedChat;
    prerequisites: string[];
    maxTurns: number | null;
    realSource: string | null;
    realTarget: string | null;
    sourceType: WaldiezAgentType;
    targetType: WaldiezAgentType;
    condition: WaldiezHandoffCondition;
    available: WaldiezHandoffAvailability;
    afterWork: WaldiezTransitionTarget | null;
    silent?: boolean;
};

/**
 * Error information structure
 * @param message - Error message
 * @param code - Optional error code
 */
export declare type WaldiezChatError = {
    message: string;
    code?: string;
};

/**
 * Group chat run data.
 * @param type - The type of the message: "group_chat_run_chat"
 * @param content - The content of the group chat run message.
 * @param content.uuid - A unique identifier for the group chat run.
 * @param content.speaker - The speaker of the message.
 * @param content.silent - Optional. If true, indicates that the message is silent.
 */
export declare type WaldiezChatGroupChatRunData = WaldiezChatBaseMessageData & {
    type: "group_chat_run_chat";
    content: {
        uuid: string;
        speaker: string;
        silent?: boolean;
    };
};

/**
 * Chat handlers type
 * @param onUserInput - Callback for user input
 * @param onMediaUpload - Callback for media uploads
 * @param onChatError - Callback for chat errors
 * @param onInterrupt - Callback for interrupt events
 * @param onMessageStreamEvent - Callback for message stream events
 */
export declare type WaldiezChatHandlers = {
    onUserInput?: (input: WaldiezChatUserInput) => void | Promise<void> | boolean | Promise<boolean>;
    onMediaUpload?: (media: WaldiezMediaContent) => Promise<string>;
    onChatError?: (error: WaldiezChatError) => void | Promise<void>;
    onMessageStreamEvent?: (event: WaldiezStreamEvent) => void | Promise<void>;
    onInterrupt?: () => void | Promise<void>;
    onClose?: () => void | Promise<void>;
};

/**
 * Input request data.
 * @param type - The type of the message: "input_request"
 * @param request_id - A unique identifier for the request.
 * @param prompt - The prompt text that the user is expected to respond to.
 * @param password - Optional. If true, indicates that the input is a password field.
 */
export declare type WaldiezChatInputRequestData = WaldiezChatBaseMessageData & {
    type: "input_request";
    request_id: string;
    prompt: string;
    password?: boolean | string;
};

/**
 * WaldiezChatLlmSummaryMethod
 * Represents the method used to summarize the chat.
 * @param reflectionWithLlm - Reflection with LLM (Language Model)
 * @param lastMsg - Last message
 * @param null - No method
 * @param custom - Custom user-defined method
 * @see {@link WaldiezMessage}
 */
export declare type WaldiezChatLlmSummaryMethod = "reflectionWithLlm" | "lastMsg" | "custom" | null;

/**
 * WaldiezChatMessage structure
 * @param id - Unique identifier for the message
 * @param timestamp - Timestamp of the message
 * @param type - Type of the message (e.g., user, agent, system)
 * @param content - Content of the message (text, image, audio, etc.)
 * @param sender - Sender of the message (optional)
 * @param recipient - Recipient of the message (optional)
 * @param request_id - ID of the request associated with the message (optional)
 * @param metadata - Additional metadata associated with the message (optional)
 * @see {@link WaldiezChatMessageCommon}
 * @see {@link WaldiezMediaContent}
 */
export declare type WaldiezChatMessage = WaldiezChatMessageCommon & {
    content: WaldiezChatContent;
};

/**
 * WaldiezChatMessage structure
 * @param id - Unique identifier for the message
 * @param timestamp - Timestamp of the message
 * @param type - Type of the message (e.g., user, agent, system)
 * @param content - Content of the message (text, image, audio, etc.)
 * @param sender - Sender of the message (optional)
 * @param recipient - Recipient of the message (optional)
 * @param request_id - ID of the request associated with the message (optional)
 * @param metadata - Additional metadata associated with the message (optional)
 */
export declare type WaldiezChatMessageCommon = {
    id: string;
    timestamp: string | number;
    type: WaldiezChatMessageType;
    sender?: string;
    recipient?: string;
    request_id?: string;
} & {
    [key: string]: any;
};

/**
 * Options for message deduplication
 */
declare type WaldiezChatMessageDeduplicationOptions = {
    enabled?: boolean;
    keyGenerator?: (message: WaldiezChatMessage) => string;
    maxCacheSize?: number;
};

/**
 * Message handler interface.
 * This interface defines the methods that a message handler must implement.
 */
export declare type WaldiezChatMessageHandler = {
    canHandle(type: string): boolean;
    handle(data: any, context: WaldiezChatMessageProcessingContext): WaldiezChatMessageProcessingResult | undefined;
};

/**
 * Context for processing messages.
 * This context is passed to message handlers during processing.
 * It can include an optional request ID and an optional image URL.
 * @param requestId - An optional request ID associated with the message.
 * @param imageUrl - An optional image URL associated with the message.
 */
export declare type WaldiezChatMessageProcessingContext = {
    requestId?: string | null;
    imageUrl?: string;
};

/**
 * Waldiez chat message type.
 * This is the main type used to represent a chat message in Waldiez.
 * It includes the ID, timestamp, type, content, sender, recipient, and request ID.
 * @param message - The processed chat message if available.
 * @param request_id - An optional request ID associated with the message.
 * @param participants - Optional. An object containing participants' data.
 * @param isWorkflowEnd - Optional. If true, indicates that the workflow has ended.
 * @see {@link WaldiezChatMessage}
 */
export declare type WaldiezChatMessageProcessingResult = {
    message?: WaldiezChatMessage;
    requestId?: string | null;
    isWorkflowEnd?: boolean;
    timeline?: WaldiezTimelineData;
    runCompletion?: WaldiezChatRunCompletionResults;
    participants?: WaldiezChatParticipant[];
};

export declare class WaldiezChatMessageProcessor {
    private static _handlers;
    private static get handlers();
    /**
     * Process a raw message and return the result
     * @param rawMessage - The raw message to process
     * @param requestId - Optional request ID for the message
     * @param imageUrl - Optional image URL associated with the message
     */
    static process(rawMessage: any, requestId?: string | null, imageUrl?: string): WaldiezChatMessageProcessingResult | undefined;
    /**
     * Parses a raw message string into a BaseMessageData object.
     * Returns null if the message cannot be parsed.
     * @param message - The raw message string to parse
     * @returns WaldiezChatBaseMessageData | null
     */
    private static parseMessage;
    /**
     * Finds a handler that can process the given message type.
     * @param type - The type of the message to find a handler for
     * @returns WaldiezChatMessageHandler | undefined
     */
    static findHandler(type: string, data: any): WaldiezChatMessageHandler | undefined;
}

/**
 * Supported message types
 * @param user - User message
 * @param agent - Agent message
 * @param system - System message
 * @param input_request - Input request message
 * @param input_response - Input response message
 * @param run_completion - Run completion indication
 * @param error - Error message
 * @param print - Print message
 * @param text - Text message
 */
export declare type WaldiezChatMessageType = "user" | "agent" | "system" | "input_request" | "input_response" | "run_completion" | "error" | "print" | "text" | (string & {});

/**
 * Chat participant data.
 * @param id - The unique identifier for the participant.
 * @param name - The name of the participant.
 * @param isUser - Indicates if the participant is a user.
 */
export declare type WaldiezChatParticipant = {
    id: string;
    name: string;
    isUser: boolean;
};

/**
 * Participants data structure.
 * This structure is used to represent the participants in a chat.
 * It includes an array of participant objects, each with a name and additional properties.
 * @param participants - An array of participant objects.
 * @param participants.name - The name of the participant.
 */
export declare type WaldiezChatParticipantsData = {
    participants: Array<{
        name: string;
        [key: string]: any;
    }>;
};

export declare type WaldiezChatParticipantsState = {
    activeSenderId: string | null;
    activeRecipientId: string | null;
    activeEventType: string | null;
};

/**
 * Print message data.
 * @param type - The type of the message: "print"
 * @param content - The content of the print message, which can be a string or an object.
 * @param content.data - The data that was printed, which can be a string, an array, or an object.
 */
export declare type WaldiezChatPrintMessageData = WaldiezChatBaseMessageData & {
    type: "print";
    content: {
        data: string;
    };
};

/**
 * Run completion results.
 * @param summary - A summary of the run completion.
 * @param history - The history of messages exchanged during the run.
 * @param cost - The cost associated with the run.
 */
export declare type WaldiezChatRunCompletionResults = {
    summary: string;
    history: {
        content: string;
        role: string;
        name?: string;
    }[];
    cost: any;
};

/**
 * Speaker selection data.
 * @param type - The type of the message: "select_speaker" or "select_speaker_invalid_input"
 * @param content - The content of the speaker selection message.
 * @param content.uuid - A unique identifier for the speaker selection.
 * @param content.agents - An array of agent names available for selection.
 */
export declare type WaldiezChatSpeakerSelectionData = WaldiezChatBaseMessageData & {
    type: "select_speaker" | "select_speaker_invalid_input";
    content: {
        uuid: string;
        agents: string[];
    };
};

/**
 * Waldiez Chat Summary
 * @param method - The method used to summarize the chat
 * @param prompt - The prompt used to summarize the chat
 * @param args - The arguments used to summarize the chat
 * @param content - The content of the custom method if applicable
 * @see {@link WaldiezChatLlmSummaryMethod}
 * @see {@link WaldiezMessage}
 */
export declare type WaldiezChatSummary = {
    method: WaldiezChatLlmSummaryMethod;
    prompt: string;
    args: {
        [key: string]: any;
    };
    content?: string;
};

/**
 * Termination message data.
 * @param type - The type of the message: "termination"
 * @param content - The content of the termination message.
 * @param content.termination_reason - The reason for the termination.
 */
export declare type WaldiezChatTerminationMessageData = WaldiezChatBaseMessageData & {
    type: "termination";
    content?: {
        termination_reason: string;
    };
    termination_reason?: string;
};

/**
 * Text message data.
 * @param type - The type of the message: "text" or "tool_call"
 * @param content - The content of the text message.
 * @param content.content - The media content of the message, which can include text, images, etc.
 * @param content.sender - The sender of the message.
 * @param content.recipient - The recipient of the message.
 */
export declare type WaldiezChatTextMessageData = WaldiezChatBaseMessageData & {
    type: "text" | "tool_call";
    content: {
        content: WaldiezMediaContent;
        sender: string;
        recipient: string;
    };
};

/**
 * User input response to a specific request
 * @param id - Unique identifier for the message
 * @param timestamp - Timestamp of the message
 * @param type - Type of the message (input_response)
 * @param data - The data of the message (text, image, etc.)
 * @param sender - Sender of the message (optional)
 * @param recipient - Recipient of the message (optional)
 * @param request_id - ID of the request associated with the message (optional)
 * @param metadata - Additional metadata associated with the message (optional)
 */
export declare type WaldiezChatUserInput = WaldiezChatMessageCommon & {
    type: "input_response";
    data: string | {
        content: WaldiezMediaContent;
    } | {
        content: WaldiezMediaContent;
    }[];
};

/**
 * Waldiez context condition
 * A condition that can be evaluated against context variables.
 * @param conditionType - Type of the condition (in any of the cases)
 * @param variable_name - Name of the context variable (in case of string context condition)
 * @param expression - Expression to be evaluated (in case of expression context condition)
 * @param data - Additional data (in case of string context condition)
 * @see {@link WaldiezStringContextCondition}
 * @see {@link WaldiezExpressionContextCondition}
 */
export declare type WaldiezContextBasedCondition = WaldiezStringContextCondition | WaldiezExpressionContextCondition;

/**
 * Condition wrapper for context conditions.
 * Matches the Python WaldiezContextBasedCondition class.
 * @param target - Target of the handoff
 * @param condition - Context condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezContextBasedCondition}
 */
export declare type WaldiezContextBasedTransition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezContextBasedCondition;
    available: WaldiezHandoffAvailability;
};

/**
 * Waldiez ContextStr LLM condition
 * A `ContextStr` object with context variable placeholders that
 will be substituted before being evaluated by an LLM.
 * @param conditionType - Type of the condition
 * @param context_str - The context string
 * @param data - Additional data
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezLLMBasedCondition}
 */
export declare type WaldiezContextStrLLMCondition = {
    conditionType: "context_str_llm";
    context_str: string;
    data?: Record<string, any>;
};

export declare type WaldiezDebugBreakpointAdded = {
    type: "debug_breakpoint_added" | "breakpoint_added";
    breakpoint: string | WaldiezBreakpoint;
};

export declare type WaldiezDebugBreakpointCleared = {
    type: "debug_breakpoint_cleared" | "breakpoint_cleared";
    message: string;
};

export declare type WaldiezDebugBreakpointRemoved = {
    type: "debug_breakpoint_removed" | "breakpoint_removed";
    breakpoint: string | WaldiezBreakpoint;
};

export declare type WaldiezDebugBreakpointsList = {
    type: "debug_breakpoints_list" | "breakpoints_list";
    breakpoints: Array<string | WaldiezBreakpoint>;
};

/**
 * Outgoing control commands from UI to the runner.
 */
export declare type WaldiezDebugControl = {
    kind: "continue";
} | {
    kind: "step";
} | {
    kind: "run";
} | {
    kind: "quit";
} | {
    kind: "info";
} | {
    kind: "help";
} | {
    kind: "stats";
} | {
    kind: "add_breakpoint";
} | {
    kind: "remove_breakpoint";
} | {
    kind: "list_breakpoints";
} | {
    kind: "clear_breakpoints";
} | {
    kind: "raw";
    value: string;
};

/**
 * `debug_error` message (backend - client)
 */
export declare type WaldiezDebugError = {
    type: "debug_error" | "error";
    error: string;
};

/**
 * `debug_event_info` message (backend - client)
 * Contains the raw event payload emitted by the runner.
 */
export declare type WaldiezDebugEventInfo = {
    type: "debug_event_info" | "event_info";
    event: Record<string, unknown>;
};

/**
 * Help command info (match Python `WaldiezDebugHelpCommand`).
 */
export declare type WaldiezDebugHelpCommand = {
    /** List of command aliases, e.g., ["continue","c"] */
    cmds?: string[];
    /** Description */
    desc: string;
};

/**
 * Grouped help commands (match Python `WaldiezDebugHelpCommandGroup`).
 */
export declare type WaldiezDebugHelpCommandGroup = {
    title: string;
    commands: WaldiezDebugHelpCommand[];
};

/**
 * `debug_help` message (backend - client)
 */
export declare type WaldiezDebugHelpMessage = {
    type: "debug_help" | "help";
    help: WaldiezDebugHelpCommandGroup[];
};

/**
 * `debug_input_request` message (sent by backend when waiting for a command/input)
 */
export declare type WaldiezDebugInputRequest = {
    type: "debug_input_request" | "input_request";
    prompt: string;
    request_id: string;
};

/**
 * `debug_input_response` message (client - backend). Prefer sending this
 * structured form over raw strings so the backend can validate `request_id`.
 */
export declare type WaldiezDebugInputResponse = {
    type: "debug_input_response" | "input_response";
    request_id: string;
    data: WaldiezDebugResponseCode | string;
};

/**
 * Discriminated union of all step-by-step debug messages.
 * (Matches Python `WaldiezDebugMessage` union, discriminator `type`).
 */
export declare type WaldiezDebugMessage = WaldiezDebugPrint | WaldiezDebugInputRequest | WaldiezDebugInputResponse | WaldiezDebugBreakpointsList | WaldiezDebugBreakpointAdded | WaldiezDebugBreakpointRemoved | WaldiezDebugBreakpointCleared | WaldiezDebugEventInfo | WaldiezDebugStatsMessage | WaldiezDebugHelpMessage | WaldiezDebugError;

/**
 * `debug_print` message
 */
export declare type WaldiezDebugPrint = {
    type: "debug_print" | "print";
    content: any;
};

/**
 * Explicit response codes allowed by the backend for step control.
 */
export declare type WaldiezDebugResponseCode = "" | "c" | "s" | "r" | "q" | "i" | "h" | "st" | "ab" | "rb" | "lb" | "cb";

export declare type WaldiezDebugStats = {
    events_processed: number;
    total_events: number;
    step_mode: boolean;
    auto_continue: boolean;
    breakpoints: string[];
    event_history_count: number;
    [k: string]: unknown;
};

/**
 * `debug_stats` message (backend - client)
 */
export declare type WaldiezDebugStatsMessage = {
    type: "debug_stats" | "stats";
    stats: WaldiezDebugStats;
};

/**
 * Waldiez Edge
 * The react-flow edge component for a chat.
 * @param data - The data of the edge
 * @param type - The type of the edge
 * @see {@link WaldiezEdgeData}
 * @see {@link WaldiezEdgeType}
 */
export declare type WaldiezEdge = Edge<WaldiezEdgeData, WaldiezEdgeType>;

/**
 * Waldiez Edge Data
 * @param label - The label of the edge
 * @param description - The description of the chat
 * @param position - The position of the chat
 * @param order - The order of the chat
 * @param clearHistory - Clear history
 * @param message - The message used in the chat
 * @param summary - The summary of the chat
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param maxTurns - The maximum turns
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @param sourceType - The source type
 * @param targetType - The target type
 * @param condition - The handoff condition
 * @param available - The available for handoff condition
 * @param afterWork - The after work transition
 * @param silent - The silent mode
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezChatDataCommon}
 * @see {@link WaldiezHandoffCondition}
 */
export declare type WaldiezEdgeData = WaldiezChatDataCommon & {
    label: string;
};

/**
 * Waldiez Edge Type
 * @param chat - Chat type
 * @param nested - Nested type
 * @param group - Group type
 * @param hidden - Hidden type
 */
export declare type WaldiezEdgeType = "chat" | "nested" | "group" | "hidden";

export declare type WaldiezEvent = EventBase<"text", TextContent> | EventBase<"post_carryover_processing", PostCarryoverContent> | EventBase<"group_chat_run_chat", GroupChatRunChatContent> | EventBase<"using_auto_reply", UsingAutoReplyContent> | EventBase<"tool_call", ToolCallContent> | EventBase<"execute_function", ExecuteFunctionContent> | EventBase<"executed_function", ExecutedFunctionContent> | EventBase<"input_request", InputRequestContent> | EventBase<"tool_response", ToolResponseContent> | EventBase<"termination", TerminationContent> | EventBase<"run_completion", RunCompletionContent> | EventBase<"generate_code_execution_reply", GenerateCodeExecutionReplyContent> | EventBase<"group_chat_resume", GroupChatResumeContent> | EventBase<"info", InfoContent> | EventBase<"error", ErrorContent> | EventBase<"empty", TextContent> | EventBase<"termination_and_human_reply_no_input", TerminationAndHumanReplyNoInputContent> | TransitionEvent_2 | EventBase<string, any>;

/**
 * Waldiez Expression context condition
 *  This condition evaluates a ContextExpression against the context variables.
 * @param conditionType - Type of the condition
 * @param expression - Expression to be evaluated
 * @param data - Additional data
 * @see {@link WaldiezContextBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export declare type WaldiezExpressionContextCondition = {
    conditionType: "expression_context";
    expression: string;
    data?: Record<string, any>;
};

/**
 * Waldiez Flow
 * @param type - The type (flow)
 * @param version - The version of waldiez used to create this flow
 * @param id - The ID
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param tags - The tags
 * @param requirements - The requirements
 * @param data - The data
 * @param storageId - The storage ID
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param rest - Any additional properties
 * @see {@link WaldiezFlowData}
 */
export declare class WaldiezFlow {
    type: string;
    version: string;
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    data: WaldiezFlowData;
    storageId: string;
    createdAt: string;
    updatedAt: string;
    rest?: {
        [key: string]: unknown;
    };
    constructor(props: {
        id: string;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        data: WaldiezFlowData;
        storageId: string;
        createdAt: string;
        updatedAt: string;
        rest?: {
            [key: string]: unknown;
        };
    });
}

/**
 * Waldiez Flow Data
 * @param nodes - The nodes
 * @param edges - The edges
 * @param agents - The agents
 * @param models - The models
 * @param tools - The tools
 * @param chats - The chats
 * @param isAsync - Is async
 * @param cacheSeed - The cache seed
 * @param skipDeps - Skip installing the dependencies
 * @param viewport - The viewport
 * @see {@link WaldiezAgentUserProxy}
 * @see {@link WaldiezAgentAssistant}
 * @see {@link WaldiezAgentRagUser}
 * @see {@link WaldiezModel}
 * @see {@link WaldiezTool}
 * @see {@link WaldiezChat}
 * @see {@link WaldiezFlowData}
 */
export declare class WaldiezFlowData {
    nodes: Node_2[];
    edges: Edge[];
    viewport: Viewport;
    agents: {
        userProxyAgents?: WaldiezAgentUserProxy[];
        assistantAgents?: WaldiezAgentAssistant[];
        ragUserProxyAgents?: WaldiezAgentRagUser[];
        reasoningAgents?: WaldiezAgentReasoning[];
        captainAgents?: WaldiezAgentCaptain[];
        groupManagerAgents?: WaldiezAgentGroupManager[];
        docAgents?: WaldiezAgentDocAgent[];
    };
    models: WaldiezModel[];
    tools: WaldiezTool[];
    chats: WaldiezChat[];
    isAsync?: boolean;
    cacheSeed?: number | null;
    silent?: boolean;
    skipDeps?: boolean | null;
    constructor(props?: {
        nodes: Node_2[];
        edges: Edge[];
        viewport: Viewport;
        agents: {
            userProxyAgents?: WaldiezAgentUserProxy[];
            assistantAgents?: WaldiezAgentAssistant[];
            ragUserProxyAgents?: WaldiezAgentRagUser[];
            reasoningAgents?: WaldiezAgentReasoning[];
            captainAgents?: WaldiezAgentCaptain[];
            groupManagerAgents?: WaldiezAgentGroupManager[];
            docAgents?: WaldiezAgentDocAgent[];
        };
        models: WaldiezModel[];
        tools: WaldiezTool[];
        chats: WaldiezChat[];
        isAsync?: boolean;
        cacheSeed?: number | null;
        silent?: boolean;
        skipDeps?: boolean | null;
    });
}

/**
 * WaldiezFlowInfo
 * @param flowId - The ID of the flow
 * @param path - The path of the flow file
 * @param storageId - The ID of the storage
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param tags - The tags of the flow
 * @param requirements - The requirements of the flow
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 * @param skipDeps - Skip installing dependencies
 */
export declare type WaldiezFlowInfo = {
    flowId: string;
    path?: string | null;
    storageId: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    isAsync: boolean;
    cacheSeed: number | null;
    skipDeps?: boolean | null;
};

/**
 * WaldiezFlowProps
 * @param flowId - The id of the flow
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 * @param silent - Whether the flow is silent or not
 * @param storageId - The id of the storage
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param tags - The tags of the flow
 * @param requirements - The requirements of the flow
 * @param skipDeps - Skip installing the dependencies
 * @param viewport - The viewport of the flow
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 */
export declare type WaldiezFlowProps = ReactFlowJsonObject & {
    flowId: string;
    isAsync?: boolean;
    cacheSeed?: number | null;
    silent?: boolean;
    storageId: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    skipDeps?: boolean | null;
    viewport?: Viewport;
    createdAt?: string;
    updatedAt?: string;
};

/**
 * Waldiez Group Chat Type
 * @param toManager - To manager type
 * @param nested - Nested type
 * @param handoff - Handoff type
 * @param fromManager - From manager type
 * @param none - None type
 */
export declare type WaldiezGroupChatType = "toManager" | "nested" | "handoff" | "fromManager" | "none";

export declare type WaldiezHandoffAvailability = {
    type: "string" | "expression" | "none";
    value: string;
};

/**
 * Waldiez Handoff condition
 * A condition that can be evaluated by an LLM or against context variables.
 * @param condition - LLM or context condition to be evaluated
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export declare type WaldiezHandoffCondition = WaldiezLLMBasedCondition | WaldiezContextBasedCondition;

/**
 * Waldiez handoff condition
 * A condition that can be evaluated by an LLM or against context variables.
 * This matches the Python WaldiezHandoffCondition union type.
 * @param target - Target of the handoff
 * @param condition - LLM or context condition to be evaluated
 * @param available - Availability for the handoff condition
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export declare type WaldiezHandoffTransition = WaldiezLLMBasedTransition | WaldiezContextBasedTransition;

/**
 * Waldiez LLM condition
 * A condition that can be evaluated by an LLM.
 * @param conditionType - Type of the condition (in any of the cases)
 * @param prompt - Prompt string (in case of string LLM condition)
 * @param context_str - The context string (in case of context string LLM condition)
 * @param data - Additional data (in any of the cases)
 * @see {@link WaldiezStringLLMCondition}
 * @see {@link WaldiezContextStrLLMCondition}
 */
export declare type WaldiezLLMBasedCondition = WaldiezStringLLMCondition | WaldiezContextStrLLMCondition;

/**
 * Condition wrapper for LLM conditions.
 * Matches the Python WaldiezLLMBasedCondition class.
 * @param target - Target of the handoff
 * @param condition - LLM condition to be evaluated
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezLLMBasedCondition}
 */
export declare type WaldiezLLMBasedTransition = {
    target: WaldiezTransitionTarget;
    condition: WaldiezLLMBasedCondition;
    available: WaldiezHandoffAvailability;
};

/**
 * Chat media configuration
 * @param allowedTypes - Allowed media types for upload
 * @param maxFileSize - Maximum file size for uploads (in bytes)
 * @param processAudio - Whether to process audio files
 * @param transcribeAudio - Whether to transcribe audio files
 * @param previewDocuments - Whether to preview document files
 * @param acceptedMimeTypes - Accepted MIME types for each media type
 */
export declare type WaldiezMediaConfig = {
    allowedTypes: WaldiezMediaType[];
    maxFileSize?: number;
    processAudio?: boolean;
    transcribeAudio?: boolean;
    previewDocuments?: boolean;
    acceptedMimeTypes?: Record<WaldiezMediaType, string[]>;
};

/**
 * Media content wrapper
 * @param type - Type of the media content (text, image, video, audio, file)
 * @param text - Text content (if type is "text")
 * @param image - Image content (if type is "image")
 * @param video - Video content (if type is "video")
 * @param audio - Audio content (if type is "audio")
 * @param file - File content (if type is "file")
 * @param url - URL of the media content
 * @param file - File object of the media content
 * @param alt - Alt text for the image
 * @param duration - Duration of the video or audio content
 * @param mimeType - MIME type of the video or audio content
 * @param name - Name of the file
 * @param size - Size of the file
 */
export declare type WaldiezMediaContent = {
    type: "text";
    text: string;
} | {
    type: "image";
    image: {
        url?: string;
        file?: File;
        alt?: string;
    };
} | {
    type: "image_url";
    image_url: {
        url?: string;
        file?: File;
        alt?: string;
    };
} | {
    type: "video";
    video: {
        url?: string;
        file?: File;
        duration?: number;
        thumbnailUrl?: string;
        mimeType?: string;
    };
} | {
    type: "audio";
    audio: {
        url?: string;
        file?: File;
        duration?: number;
        transcript?: string;
    };
} | {
    type: "file";
    file: {
        url?: string;
        file?: File;
        name: string;
        size?: number;
        type?: string;
        previewUrl?: string;
    };
} | string;

/**
 * Supported media types
 * @param text - Text content
 * @param image - Image content
 * @param video - Video content
 * @param audio - Audio content
 * @param file - File content
 * @param document - Document content
 * @param string - Other string types
 */
export declare type WaldiezMediaType = "text" | "image" | "video" | "audio" | "file" | (string & {});

/**
 * WaldiezMessage
 * Represents a message in the Waldiez chat system.
 * @param type - The type of the message
 * @param content - The content of the message
 * @param useCarryover - Whether to use carryover for the message
 * @param context - The context of the message
 * @see {@link WaldiezMessageType}
 */
export declare class WaldiezMessage {
    type: WaldiezMessageType;
    content: string | null;
    useCarryover?: boolean;
    context: {
        [key: string]: unknown;
    };
    constructor(props?: {
        type: WaldiezMessageType;
        useCarryover?: boolean;
        content: string | null;
        context?: {
            [key: string]: string;
        };
    });
}

/**
 * WaldiezMessageType
 * Represents the type of message used in the chat.
 * @param string - A string message
 * @param method - A method message
 * @param rag_message_generator - A message generator for RAG (Retrieval-Augmented Generation)
 * @param none - No message
 * @see {@link WaldiezMessage}
 */
export declare type WaldiezMessageType = "string" | "method" | "rag_message_generator" | "none";

/**
 * Waldiez Model
 * @param type - The type (model)
 * @param id - The ID
 * @param name - The name of the model
 * @param description - The description of the model
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezModelData}
 */
export declare class WaldiezModel {
    type: string;
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezModelData;
    rest?: {
        [key: string]: unknown;
    };
    constructor(props: {
        id: string;
        data: WaldiezModelData;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        rest?: {
            [key: string]: unknown;
        };
    });
    /**
     * Creates a new WaldiezModel instance with default values.
     * @returns A new instance of WaldiezModel.
     */
    static create(): WaldiezModel;
}

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
export declare type WaldiezModelAPIType = "openai" | "azure" | "deepseek" | "bedrock" | "google" | "anthropic" | "cohere" | "mistral" | "groq" | "together" | "nim" | "other";

/** AWS related fields
 * @param region - The AWS region
 * @param accessKey - The AWS access key
 * @param secretKey - The AWS secret key
 * @param sessionToken - The AWS session token
 * @param profileName - The AWS profile name
 */
export declare type WaldiezModelAWS = {
    region?: string | null;
    accessKey?: string | null;
    secretKey?: string | null;
    sessionToken?: string | null;
    profileName?: string | null;
};

/**
 * ModelData
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
 */
export declare class WaldiezModelData {
    baseUrl: string | null;
    apiKey: string | null;
    apiType: WaldiezModelAPIType;
    apiVersion: string | null;
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    aws?: WaldiezModelAWS | null;
    extras: {
        [key: string]: unknown;
    };
    defaultHeaders: {
        [key: string]: unknown;
    };
    price: WaldiezModelPrice;
    constructor(props?: {
        baseUrl: string | null;
        apiKey: string | null;
        apiType: WaldiezModelAPIType;
        apiVersion: string | null;
        temperature: number | null;
        topP: number | null;
        maxTokens: number | null;
        aws?: WaldiezModelAWS | null;
        extras: {
            [key: string]: unknown;
        };
        defaultHeaders: {
            [key: string]: unknown;
        };
        price: WaldiezModelPrice;
    });
}

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
export declare type WaldiezModelDataCommon = {
    description: string;
    baseUrl: string | null;
    apiKey: string | null;
    apiType: WaldiezModelAPIType;
    apiVersion: string | null;
    temperature: number | null;
    topP: number | null;
    maxTokens: number | null;
    aws?: WaldiezModelAWS | null;
    extras: {
        [key: string]: unknown;
    };
    defaultHeaders: {
        [key: string]: unknown;
    };
    price: WaldiezModelPrice;
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

/** Price related fields
 * @param promptPricePer1k - The price per 1000 tokens for the prompt
 * @param completionTokenPricePer1k - The price per 1000 tokens for the completion
 */
export declare type WaldiezModelPrice = {
    promptPricePer1k: number | null;
    completionTokenPricePer1k: number | null;
};

/**
 * Waldiez Nested Chat
 * @param message - The message used in the nested chat
 * @param reply - The reply used in the nested chat
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 */
export declare type WaldiezNestedChat = {
    message: WaldiezMessage | null;
    reply: WaldiezMessage | null;
};

/**
 * WaldiezNodeAgent
 * The react-flow node component for an agent.
 * It can be one of the following:
 * @param WaldiezNodeAgentAssistant - A assistant agent node.
 * @param WaldiezNodeAgentUserProxy - A user proxy agent node.
 * @param WaldiezNodeAgentRagUser - A RAG user agent node.
 * @param WaldiezNodeAgentReasoning - A reasoning agent node.
 * @param WaldiezNodeAgentCaptain - A captain agent node.
 * @param WaldiezNodeAgentGroupManager - A group manager agent node.
 * @param WaldiezNodeAgentDocAgent - A document agent node.
 * @see {@link WaldiezNodeAgentAssistant}
 * @see {@link WaldiezNodeAgentUserProxy}
 * @see {@link WaldiezNodeAgentRagUser}
 * @see {@link WaldiezNodeAgentReasoning}
 * @see {@link WaldiezNodeAgentCaptain}
 * @see {@link WaldiezNodeAgentGroupManager}
 * @see {@link WaldiezNodeAgentDocAgent}
 */
export declare type WaldiezNodeAgent = WaldiezNodeAgentAssistant | WaldiezNodeAgentRagUser | WaldiezNodeAgentReasoning | WaldiezNodeAgentUserProxy | WaldiezNodeAgentCaptain | WaldiezNodeAgentGroupManager | WaldiezNodeAgentDocAgent;

/**
 * WaldiezNodeAgentAssistant
 * The react-flow node component for an agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentAssistantData}
 */
export declare type WaldiezNodeAgentAssistant = Node_2<WaldiezNodeAgentAssistantData, "agent">;

/**
 * WaldiezNodeAgentAssistantData
 * The data for the agent node.
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentCommonData}
 */
export declare type WaldiezNodeAgentAssistantData = WaldiezAgentCommonData & {
    label: string;
    isMultimodal: boolean;
};

/**
 * WaldiezNodeAgentCaptain
 * Represents a node in the flow for the captain agent.
 * @param data - The data for the node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentCaptainData}
 */
export declare type WaldiezNodeAgentCaptain = Node_2<WaldiezNodeAgentCaptainData, "agent">;

/**
 * WaldiezNodeAgentCaptainData
 * Represents the data for the captain agent node.
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentCommonData}
 */
export declare type WaldiezNodeAgentCaptainData = WaldiezAgentCommonData & {
    label: string;
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;
};

/**
 * WaldiezNodeAgentData
 * It can be one of the following:
 * @param WaldiezNodeAgentAssistantData - The data for the assistant agent.
 * @param WaldiezNodeAgentUserProxyData - The data for the user proxy agent.
 * @param WaldiezNodeAgentRagUserData - The data for the RAG user agent.
 * @param WaldiezNodeAgentReasoningData - The data for the reasoning agent.
 * @param WaldiezNodeAgentCaptainData - The data for the captain agent.
 * @param WaldiezNodeAgentGroupManagerData - The data for the group manager agent.
 * @param WaldiezNodeDocAgentData - The data for the document agent.
 * @see {@link WaldiezNodeAgentAssistantData}
 * @see {@link WaldiezNodeAgentUserProxyData}
 * @see {@link WaldiezNodeAgentRagUserData}
 * @see {@link WaldiezNodeAgentReasoningData}
 * @see {@link WaldiezNodeAgentCaptainData}
 * @see {@link WaldiezNodeAgentGroupManagerData}
 * @see {@link WaldiezNodeAgentDocAgentData}
 */
export declare type WaldiezNodeAgentData = WaldiezNodeAgentAssistantData | WaldiezNodeAgentUserProxyData | WaldiezNodeAgentRagUserData | WaldiezNodeAgentReasoningData | WaldiezNodeAgentCaptainData | WaldiezNodeAgentGroupManagerData | WaldiezNodeAgentDocAgentData;

/**
 * WaldiezNodeAgentDocAgent
 * The document agent node.
 * @see {@link WaldiezNodeAgentDocAgentData}
 */
export declare type WaldiezNodeAgentDocAgent = Node_2<WaldiezNodeAgentDocAgentData, "agent">;

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
export declare type WaldiezNodeAgentDocAgentData = WaldiezAgentCommonData & {
    label: string;
    collectionName: string | null;
    resetCollection: boolean;
    parsedDocsPath: string | null;
    queryEngine: RAGQueryEngine | null;
};

/**
 * WaldiezNodeAgentGroupManager
 * The react-flow node component for a group manager agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentGroupManagerData}
 */
export declare type WaldiezNodeAgentGroupManager = Node_2<WaldiezNodeAgentGroupManagerData, "agent">;

/**
 * WaldiezNodeAgentGroupManagerData
 * The data for the group manager agent.
 * @param maxRound - The maximum number of rounds.
 * @param adminName - The name of the admin.
 * @param speakers - The speakers in the group chat.
 * @param enableClearHistory - Whether to enable clear history.
 * @param sendIntroductions - Whether to send introductions.
 * @param groupName - The name of the group.
 * @param initialAgentId - The ID of the initial agent.
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentGroupManagerSpeakers}
 * @see {@link WaldiezAgentCommonData}
 */
export declare type WaldiezNodeAgentGroupManagerData = WaldiezAgentCommonData & {
    maxRound: number;
    adminName: string | null;
    speakers: WaldiezAgentGroupManagerSpeakers;
    enableClearHistory?: boolean;
    sendIntroductions?: boolean;
    groupName?: string;
    initialAgentId?: string;
    label: string;
};

/**
 * WaldiezNodeAgentRagUser
 * The react-flow node component for a RAG user agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentRagUserData}
 */
export declare type WaldiezNodeAgentRagUser = Node_2<WaldiezNodeAgentRagUserData, "agent">;

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
export declare type WaldiezNodeAgentRagUserData = WaldiezAgentCommonData & {
    label: string;
    retrieveConfig: WaldiezRagUserRetrieveConfig;
};

/**
 * WaldiezNodeAgentReasoning
 * The react-flow node component for a reasoning agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentReasoningData}
 */
export declare type WaldiezNodeAgentReasoning = Node_2<WaldiezNodeAgentReasoningData, "agent">;

/**
 * WaldiezNodeAgentReasoningData
 * The data for the reasoning agent.
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
 * @see {@link WaldiezReasoningAgentReasonConfig}
 * @see {@link WaldiezAgentCommonData}
 */
export declare type WaldiezNodeAgentReasoningData = WaldiezAgentCommonData & {
    label: string;
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;
};

/**
 * Waldiez node agent type (alias for WaldiezAgentType).
 * @param user_proxy - User proxy
 * @param assistant - Assistant
 * @param rag_user_proxy - RAG user proxy (deprecated, use "doc_agent")
 * @param reasoning - Reasoning
 * @param captain - Captain
 * @param group_manager - Group manager
 * @param doc_agent - Document agent
 */
export declare type WaldiezNodeAgentType = WaldiezAgentType;

/**
 * WaldiezNodeAgentUserProxy
 * The react-flow node component for a user proxy agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentUserProxyData}
 */
export declare type WaldiezNodeAgentUserProxy = Node_2<WaldiezNodeAgentUserProxyData, "agent">;

/**
 * WaldiezNodeAgentUserProxyData
 * The data for the user proxy agent node.
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
 */
export declare type WaldiezNodeAgentUserProxyData = WaldiezAgentCommonData & {
    label: string;
};

/**
 * WaldiezNodeModel
 * Represents a node model in the graph.
 * @param data - The data of the model
 * @param type - The type of the node (model)
 * @see {@link WaldiezNodeModelData}
 */
export declare type WaldiezNodeModel = Node_2<WaldiezNodeModelData, "model">;

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
export declare type WaldiezNodeModelData = WaldiezModelDataCommon & {
    label: string;
};

/**
 * WaldiezNodeTool
 * Represents a node tool in the graph.
 * @param data - The data of the tool
 * @param type - The type of the node (tool)
 * @see {@link WaldiezNodeToolData}
 */
export declare type WaldiezNodeTool = Node_2<WaldiezNodeToolData, "tool">;

/**
 * WaldiezNodeToolData
 * Represents the data of a node tool.
 * @param label - The label of the tool
 * @param content - The content of the tool
 * @param toolType - The type of tool
 * @param description - The description of the tool
 * @param secrets - The secrets associated with the tool
 * @param requirements - The requirements for the tool
 * @param tags - The tags associated with the tool
 * @param createdAt - The creation date of the tool
 * @param updatedAt - The last update date of the tool
 * @see {@link WaldiezToolDataCommon}
 */
export declare type WaldiezNodeToolData = WaldiezToolDataCommon & {
    label: string;
};

/**
 * WaldiezNodeType
 * A react-flow node type.
 * It can be one of the following:
 * @param agent - An agent node.
 * @param model - A model node.
 * @param tool - A tool node.
 */
export declare type WaldiezNodeType = "agent" | "model" | "tool";

/**
 * WaldiezProps
 * @param nodes - The nodes of the flow
 * @param edges - The edges of the flow
 * @param viewport - The viewport of the flow
 * @param monacoVsPath - The path to the monaco vs code editor
 * @param chat - The chat configuration
 * @param stepByStep - The step-by-step configuration
 * @param readOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip import or not
 * @param skipExport - Whether to skip export or not
 * @param skipHub - Whether to skip hub or not
 * @param onUpload - The function to call when uploading files
 * @param onChange - The function to call when changing the flow
 * @param onRun - The function to call when running the flow
 * @param onConvert - The function to call when converting the flow
 * @param onSave - The function to call when saving the flow
 * @see {@link WaldiezFlowProps}
 * @see {@link WaldiezChatConfig}
 */
export declare type WaldiezProps = WaldiezFlowProps & {
    nodes: Node_2[];
    edges: Edge[];
    viewport?: Viewport;
    monacoVsPath?: string;
    chat?: WaldiezChatConfig;
    stepByStep?: WaldiezStepByStep;
    readOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
    onUpload?: (files: File[]) => Promise<string[]>;
    onChange?: (flow: string) => void;
    onRun?: (flow: string, path?: string | null) => void;
    onStepRun?: (flow: string, breakpoints?: (string | WaldiezBreakpoint)[], checkpoint?: string | null, path?: string | null) => void;
    onConvert?: (flow: string, to: "py" | "ipynb", path?: string | null) => void;
    onSave?: (flow: string, path?: string | null) => void;
    checkpoints?: {
        get: (flowName: string) => Promise<Record<string, any> | null>;
        set?: (flowName: string, checkpoint: Record<string, any>) => Promise<void>;
        delete?: (flowName: string, checkpoint: string, index?: number) => Promise<void>;
    };
};

/**
 * WaldiezProviderProps
 * @param children - The children of the provider
 * @param flowId - The ID of the flow
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param skipDeps - Skip installing the dependencies
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onStepRun - The handler for step run events (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 * @param monacoVsPath - The path to the monaco vs code editor
 */
export declare type WaldiezProviderProps = PropsWithChildren<WaldiezStoreProps>;

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
export declare type WaldiezRagUserRetrieveConfig = {
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
 * WaldiezReasoningAgentReasonConfig
 * The configuration for the reasoning agent.
 * @param method - The method used for reasoning.
 * @param maxDepth - The maximum depth of the reasoning tree.
 * @param forestSize - The size of the reasoning forest.
 * @param ratingScale - The rating scale for the reasoning.
 * @param beamSize - The size of the beam for beam search.
 * @param answerApproach - The approach used for answering.
 * @param nsim - The number of simulations for MCTS.
 * @param explorationConstant - The exploration constant for MCTS.
 * @see {@link reasonConfigMethod}
 * @see {@link reasonConfigAnswerApproach}
 */
export declare type WaldiezReasoningAgentReasonConfig = {
    method: reasonConfigMethod;
    maxDepth: number;
    forestSize: number;
    ratingScale: number;
    beamSize: number;
    answerApproach: reasonConfigAnswerApproach;
    nsim: number;
    explorationConstant: number;
};

/**
 * WaldiezState
 * @param flowId - The ID of the flow
 * @param path - The path of the flow
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param skipDeps - Skip installing the dependencies
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 * @param monacoVsPath - The path to the monaco vs code editor
 * @see {@link WaldiezStoreProps}
 * @see {@link IWaldiezToolStore}
 * @see {@link IWaldiezEdgeStore}
 * @see {@link IWaldiezModelStore}
 * @see {@link IWaldiezAgentStore}
 * @see {@link IWaldiezNodeStore}
 * @see {@link IWaldiezFlowStore}
 * @see {@link IWaldiezChatParticipantsStore}
 */
export declare type WaldiezState = WaldiezStoreProps & IWaldiezToolStore & IWaldiezEdgeStore & IWaldiezModelStore & IWaldiezAgentStore & IWaldiezNodeStore & IWaldiezFlowStore & WaldiezChatParticipantsState & IWaldiezChatParticipantsStore;

/**
 * UI state slice for step-by-step mode.
 * @param show - Whether to show the related view
 * @param active - If true, step-by-step mode is active (a flow is running)
 * @param stepMode - Whether step mode is enabled
 * @param autoContinue - Whether auto continue is enabled
 * @param breakpoints - The list of event types to break on
 * @param stats - Last stats snapshot (from `debug_stats`)
 * @param eventHistory - Raw event history accumulated client-side (optional, for UI display)
 * @param currentEvent - The most recent `debug_event_info` payload
 * @param help - Debug help content (from `debug_help`)
 * @param lastError - Last error (from `debug_error`)
 * @param pendingControlInput - Pending input (if backend is waiting). Mirrors `debug_input_request`.
 * @param handlers - Step-by-step specific handlers for UI actions
 */
export declare type WaldiezStepByStep = {
    show: boolean;
    /** If true, step-by-step mode is active (a flow is running) */
    active: boolean;
    /** If true, runner will pause at breakpoints */
    stepMode: boolean;
    /** If true, backend auto-continues without user input */
    autoContinue: boolean;
    /** Event types to break on (empty means break on all) */
    breakpoints: (string | WaldiezBreakpoint)[];
    /**Last stats snapshot (from `debug_stats`).*/
    stats?: WaldiezDebugStats;
    /** Raw event history accumulated client-side */
    eventHistory: Array<Record<string, unknown>>;
    /** The most recent `debug_event_info` payload */
    currentEvent?: Record<string, unknown>;
    /** Debug help content (from `debug_help`) */
    help?: WaldiezDebugHelpCommandGroup[];
    /** Last error (from `debug_error`) */
    lastError?: string;
    /** List of participants in the chat */
    participants?: WaldiezChatParticipant[];
    /** Timeline of events */
    timeline?: WaldiezTimelineData;
    /**
     * Pending control action input. For replying to messages
     * of type `debug_input_request`.
     * Separate from the normal chat's `activeRequest`s.
     */
    pendingControlInput?: {
        request_id: string;
        prompt: string;
    } | null;
    /**
     * Active user's input request. For replying to messages
     * of type `input_request` (Not for control messages)
     */
    activeRequest?: WaldiezActiveRequest | null;
    /** Handlers for step-specific actions */
    handlers?: WaldiezStepHandlers;
};

declare type WaldiezStepByStepAction = {
    type: "RESET";
    config?: WaldiezStepByStep;
} | {
    type: "SET_SHOW";
    show: boolean;
} | {
    type: "SET_ACTIVE";
    active: boolean;
} | {
    type: "SET_STEP_MODE";
    mode: boolean;
} | {
    type: "SET_AUTO_CONTINUE";
    autoContinue: boolean;
} | {
    type: "SET_ERROR";
    error?: string;
    markInactive?: boolean;
} | {
    type: "SET_BREAKPOINTS";
    breakpoints: (string | WaldiezBreakpoint)[];
} | {
    type: "SET_STATS";
    stats: WaldiezDebugStats | undefined;
} | {
    type: "SET_HELP";
    help: WaldiezDebugHelpCommandGroup[] | undefined;
} | {
    type: "SET_PARTICIPANTS";
    participants: WaldiezChatParticipant[];
} | {
    type: "SET_TIMELINE";
    timeline?: WaldiezTimelineData;
} | {
    type: "SET_CURRENT_EVENT";
    event?: Record<string, unknown>;
} | {
    type: "SET_PENDING_CONTROL_INPUT";
    controlInput?: {
        request_id: string;
        prompt: string;
    } | null;
} | {
    type: "SET_ACTIVE_REQUEST";
    request?: WaldiezActiveRequest;
} | {
    type: "SET_STEP_HANDLERS";
    handlers?: WaldiezStepHandlers;
} | {
    type: "ADD_EVENT";
    event: Record<string, unknown>;
    makeItCurrent?: boolean;
} | {
    type: "ADD_EVENTS";
    events: Record<string, unknown>[];
    makeLastCurrent?: boolean;
} | {
    type: "REMOVE_EVENT";
    id: string;
} | {
    type: "CLEAR_EVENTS";
} | {
    type: "SET_STATE";
    state: Partial<WaldiezStepByStep>;
} | {
    type: "DONE";
};

/**
 * Control actions that the UI should perform in response to debug messages
 */
export declare type WaldiezStepByStepControlAction = {
    type: "debug_input_request_received";
    requestId: string;
    prompt: string;
} | {
    type: "show_notification";
    message: string;
    severity: "info" | "warning" | "error" | "success";
} | {
    type: "update_breakpoints";
    breakpoints: Array<string | WaldiezBreakpoint>;
} | {
    type: "workflow_ended";
    reason?: string;
} | {
    type: "scroll_to_latest";
};

/**
 * Handler interface for processing specific debug message types
 */
export declare type WaldiezStepByStepHandler = {
    /**
     * Check if this handler can process the given message type
     */
    canHandle(type: string): boolean;
    /**
     * Process the debug message data
     */
    handle(data: WaldiezDebugMessage, context: WaldiezStepByStepProcessingContext): WaldiezStepByStepProcessingResult | undefined;
};

/**
 * Options for message deduplication
 */
declare type WaldiezStepByStepMessageDeduplicationOptions = {
    enabled?: boolean;
    keyGenerator?: (event: Record<string, unknown>) => string;
    maxCacheSize?: number;
};

/**
 * Processing context passed to handlers
 */
export declare type WaldiezStepByStepProcessingContext = {
    /** Optional request ID for correlation */
    requestId?: string;
    /** Flow ID being debugged */
    flowId?: string;
    /** Message timestamp */
    timestamp?: string;
    /** Current UI state (for handlers that need context) */
    currentState?: Partial<WaldiezStepByStep>;
};

/**
 * Result of processing a debug message
 */
export declare type WaldiezStepByStepProcessingResult = {
    /** The parsed debug message (if valid) */
    debugMessage?: WaldiezDebugMessage;
    /** Partial state updates to apply to WaldiezStepByStep */
    stateUpdate?: Partial<WaldiezStepByStep>;
    /** Control action for the UI to perform */
    controlAction?: WaldiezStepByStepControlAction;
    /** Whether this indicates workflow end */
    isWorkflowEnd?: boolean;
    /** Error information if processing failed */
    error?: {
        message: string;
        code?: string;
        originalData?: any;
    };
};

export declare class WaldiezStepByStepProcessor {
    private static _handlers;
    private static get handlers();
    /**
     * Process a raw debug message and return the result
     * @param rawMessage - The raw message string to process (JSON from Python backend)
     * @param context - Processing context with request ID, flow ID, etc.
     */
    static process(rawMessage: any, context?: WaldiezStepByStepProcessingContext): WaldiezStepByStepProcessingResult | undefined;
    private static _doProcess;
    private static _chatResultToStepResult;
    private static earlyError;
    /**
     * Parse a raw message
     */
    private static parseMessage;
    /**
     * Find a handler that can process the given message type
     */
    static findHandler(type: string): WaldiezStepByStepHandler | undefined;
    /**
     * Check if the parsed data is a valid debug message
     */
    private static isValidDebugMessage;
}

export declare class WaldiezStepByStepUtils {
    /**
     * Extract participants (sender/recipient) from an event
     */
    static extractEventParticipants(event: Record<string, unknown>): {
        sender?: string;
        recipient?: string;
        eventType?: string;
    };
    /**
     * Format event content for display (truncate if too long)
     */
    static formatEventContent(event: Record<string, unknown>, maxLength?: number): string;
    /**
     * Extract workflow end reason from debug_print content
     */
    static extractWorkflowEndReason(content: string): "completed" | "user_stopped" | "error" | "unknown";
    /**
     * Create a response for debug control commands
     */
    static createControlResponse(requestId: string, command: string): {
        type: "debug_input_response";
        request_id: string;
        data: string;
    };
}

/**
 * Step-by-step specific handlers for the UI layer.
 * These are distinct from the chat handlers to keep concerns separated.
 * @param sendControl - Send a control command to the backend.
 * @param respond - Respond to an input request (in chat, not control)
 * @param close - Close the panel view.
 */
export declare type WaldiezStepHandlers = {
    /** optional action to perform when the run starts (like select breakpoints or checkpoint) */
    onStart?: () => void | Promise<void>;
    /** Send a control command (e.g., Continue/Run/Step/Quit/Info/Help/Stats...). */
    sendControl: (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => void | Promise<void>;
    /** Send a user input response (not a control command). */
    respond: (response: WaldiezChatUserInput) => void | Promise<void>;
    /** Close the step-by-step session.*/
    close?: () => void | Promise<void>;
};

/**
 * typeOfGetState
 * @see {@link WaldiezState}
 */
export declare type WaldiezStore = ReturnType<typeof createWaldiezStore>;

/**
 * WaldiezStoreProps
 * @param flowId - The ID of the flow
 * @param path - The path of the flow file
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onStepRun - The handler for step run events (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 */
export declare type WaldiezStoreProps = {
    flowId: string;
    path?: string | null;
    edges: Edge[];
    nodes: Node_2[];
    isAsync?: boolean;
    isReadOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    cacheSeed?: number | null;
    name?: string;
    description?: string;
    requirements?: string[];
    skipDeps?: boolean | null;
    storageId?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
    rfInstance?: ReactFlowInstance;
    viewport?: Viewport;
    previousViewport?: Viewport;
    onRun?: ((flow: string, path?: string | null) => void | Promise<void>) | null;
    onStepRun?: ((flow: string, breakpoints?: (string | WaldiezBreakpoint)[], checkpoint?: string | null, path?: string | null) => void | Promise<void>) | null;
    onConvert?: ((flow: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>) | null;
    onUpload?: ((files: File[], path?: string | null) => string[] | Promise<string[]>) | null;
    onChange?: ((content: string, path?: string | null) => void | Promise<void>) | null;
    onSave?: ((flow: string, path?: string | null) => void | Promise<void>) | null;
    checkpoints?: {
        get: (flowName: string) => Promise<Record<string, any> | null>;
        set?: (flowName: string, checkpoint: Record<string, any>) => Promise<void>;
        delete?: (flowName: string, checkpoint: string, index?: number) => Promise<void>;
    } | null;
};

/**
 * Streaming event structure
 * @param type - Type of the event (start, chunk, end)
 * @param messageId - ID of the message associated with the event
 * @param chunk - Optional chunk of data (for chunk events)
 */
export declare type WaldiezStreamEvent = {
    type: "start";
    messageId: string;
} | {
    type: "chunk";
    messageId: string;
    chunk: string;
} | {
    type: "end";
    messageId: string;
};

/**
 * Waldiez String context condition
 *  This condition checks if a named context variable exists and is truthy.
 * @param conditionType - Type of the condition
 * @param variable_name - Name of the context variable
 * @see {@link WaldiezContextBasedCondition}
 * @see {@link WaldiezContextBasedCondition}
 */
export declare type WaldiezStringContextCondition = {
    conditionType: "string_context";
    variable_name: string;
};

/**
 * Waldiez String LLM condition
 * A static string prompt to be evaluated by an LLM.
 * @param conditionType - Type of the condition
 * @param prompt - Prompt string
 * @param data - Additional data
 * @see {@link WaldiezLLMBasedCondition}
 * @see {@link WaldiezLLMBasedCondition}
 */
export declare type WaldiezStringLLMCondition = {
    conditionType: "string_llm";
    prompt: string;
    data?: Record<string, any>;
};

export declare type WaldiezTimelineAgentInfo = {
    name: string;
    class: string;
    color: string;
};

export declare type WaldiezTimelineCostPoint = {
    time: number;
    cumulative_cost: number;
    session_cost: number;
    session_id: number | string;
};

export declare type WaldiezTimelineData = {
    timeline: WaldiezTimelineItem[];
    cost_timeline: WaldiezTimelineCostPoint[];
    summary: {
        total_sessions: number;
        total_time: number;
        total_cost: number;
        total_agents: number;
        total_events: number;
        total_tokens: number;
        avg_cost_per_session: number;
        compression_info: {
            gaps_compressed: number;
            time_saved: number;
        };
    };
    metadata: {
        time_range: [number, number];
        cost_range: [number, number];
        colors?: Record<string, string>;
    };
    agents: WaldiezTimelineAgentInfo[];
};

export declare type WaldiezTimelineItem = {
    id: string;
    type: "session" | "gap";
    start: number;
    end: number;
    duration: number;
    agent?: string;
    cost?: number;
    color: string;
    label: string;
    gap_type?: string;
    real_duration?: number;
    compressed?: boolean;
    prompt_tokens?: number;
    completion_tokens?: number;
    tokens?: number;
    agent_class?: string;
    is_cached?: boolean;
    llm_model?: string;
    y_position?: number;
    session_id?: string;
    real_start_time?: string;
};

/**
 * Waldiez Tool
 * @param type - The type (tool)
 * @param id - The ID
 * @param name - The name of the tool
 * @param description - The description of the tool
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezToolData}
 */
export declare class WaldiezTool {
    type: string;
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezToolData;
    rest?: {
        [key: string]: unknown;
    };
    constructor(props: {
        id: string;
        data: WaldiezToolData;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        rest?: {
            [key: string]: unknown;
        };
    });
    /**
     * Creates a new WaldiezTool instance with default values.
     * @returns A new instance of WaldiezTool.
     */
    static create(): WaldiezTool;
}

/**
 * Tool data.
 * @param content - The content of the tool
 * @param toolType - The type of the tool: shared, custom, langchain, crewai
 * @param secrets - The secrets (environment variables) of the tool
 */
export declare class WaldiezToolData {
    content: string;
    toolType: WaldiezToolType;
    secrets: {
        [key: string]: unknown;
    };
    kwargs?: {
        [key: string]: unknown;
    };
    constructor(props?: {
        content: string;
        toolType: WaldiezToolType;
        secrets: {
            [key: string]: unknown;
        };
        kwargs?: {
            [key: string]: unknown;
        };
    });
}

/**
 * WaldiezToolDataCommon
 * Represents the common data structure for all tools in Waldiez.
 * @param content - The content of the tool
 * @param toolType - The type of tool
 * @param description - The description of the tool
 * @param secrets - The secrets associated with the tool
 * @param kwargs - Additional keyword arguments for the tool initialization
 * @param requirements - The requirements for the tool
 * @param tags - The tags associated with the tool
 * @param createdAt - The creation date of the tool
 * @param updatedAt - The last update date of the tool
 */
export declare type WaldiezToolDataCommon = {
    content: string;
    toolType: WaldiezToolType;
    description: string;
    secrets: {
        [key: string]: unknown;
    };
    kwargs?: {
        [key: string]: unknown;
    };
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

/**
 * WaldiezToolType
 * Represents the type of tool used in Waldiez.
 * @param shared - Shared tool
 * @param custom - Custom tool
 * @param langchain - LangChain tool
 * @param crewai - CrewAI tool
 * @param predefined - Predefined tool
 */
export declare type WaldiezToolType = "shared" | "custom" | "langchain" | "crewai" | "predefined";

/**
 * The type of target in a handoff transition.
 * @param AgentTarget - A specific agent target.
 * @param RandomAgentTarget - A random agent target.
 * @param GroupChatTarget - A group chat target.
 * @param NestedChatTarget - A nested chat target.
 * @param AskUserTarget - Ask the user for input.
 * @param GroupManagerTarget - A group manager target.
 * @param RevertToUserTarget - Revert to the user.
 * @param StayTarget - Stay in the current state.
 * @param TerminateTarget - Terminate the conversation.
 * @param targetType - Type of the target
 * @param value - Value of the target, which is an array of strings representing agent IDs or chat IDs.
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentNestedChat}
 */
export declare type WaldiezTransitionTarget = {
    targetType: "AgentTarget";
    value: string[];
} | {
    targetType: "RandomAgentTarget";
    value: string[];
} | {
    targetType: "GroupChatTarget" | "NestedChatTarget";
    value: string[];
} | {
    targetType: "AskUserTarget" | "GroupManagerTarget" | "RevertToUserTarget" | "StayTarget" | "TerminateTarget";
    value: string[];
};

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
export declare type WaldiezVectorDbConfig = {
    model: string;
    useMemory: boolean;
    useLocalStorage: boolean;
    localStoragePath: string | null;
    connectionUrl: string | null;
    waitUntilIndexReady?: boolean | null;
    waitUntilDocumentReady?: boolean | null;
    metadata?: {
        [key: string]: unknown;
    } | null;
};

export declare type WaldiezWsMessageHandler = (event: MessageEvent) => void;

export declare const WORKFLOW_CHAT_END_MARKERS: readonly ["<Waldiez> - Done running the flow.", "<Waldiez> - Workflow finished", "<Waldiez> - Workflow stopped by user", "<Waldiez> - Workflow execution failed:"];

export declare const WORKFLOW_DONE: "<Waldiez> - Done running the flow.";

export declare const WORKFLOW_STEP_END_MARKERS: readonly ["<Waldiez step-by-step> - Workflow finished", "<Waldiez step-by-step> - Workflow stopped by user", "<Waldiez step-by-step> - Workflow execution failed:"];

export declare const WORKFLOW_STEP_MARKERS: readonly ["<Waldiez step-by-step> - Starting workflow...", "<Waldiez step-by-step> - Workflow finished", "<Waldiez step-by-step> - Workflow stopped by user", "<Waldiez step-by-step> - Workflow execution failed:"];

/**
 * Workflow markers that indicate the workflow has started or finished
 * These match the MESSAGES constant in the Python runner
 */
export declare const WORKFLOW_STEP_START_MARKERS: readonly ["<Waldiez step-by-step> - Starting workflow..."];

export { }
