/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { Edge, Node } from "@xyflow/react";

import {
    WaldiezEdge,
    WaldiezFlow,
    WaldiezFlowData,
    WaldiezNodeModel,
    WaldiezNodeTool,
    emptyFlow,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers/agent";
import { chatMapper } from "@waldiez/models/mappers/chat";
import {
    exportAgent,
    exportChat,
    exportModel,
    exportTool,
    getAgentNodes,
    getAgents,
    getCacheSeed,
    getChats,
    getEdges,
    getFlowViewport,
    getIsAsync,
    getModels,
    getNodes,
    getTools,
    importFlowMeta,
} from "@waldiez/models/mappers/flow/utils";
import { modelMapper } from "@waldiez/models/mappers/model";
import { toolMapper } from "@waldiez/models/mappers/tool";
import { WaldiezChat, WaldiezFlowProps } from "@waldiez/types";

/**
 * Mapper for WaldiezFlow, providing methods to import and export flows,
 * convert to React Flow format, and extract flow data.
 * @see {@link WaldiezFlow}
 * @see {@link WaldiezFlowProps}
 * @see {@link WaldiezFlowData}
 * @see {@link WaldiezEdge}
 * @see {@link WaldiezNodeModel}
 * @see {@link WaldiezNodeTool}
 * @see {@link WaldiezChat}
 */
export const flowMapper = {
    /**
     * Import a flow from a JSON object or string.
     * @param item - The JSON object or string to import
     * @param newId - Optional new ID for the flow
     * @returns The imported flow
     */
    importFlow: (item: any, newId?: string) => {
        const flowJson = getFlowJson(item);
        if (!flowJson.type || flowJson.type !== "flow") {
            return emptyFlow;
        }
        const { id, storageId, name, description, tags, requirements, createdAt, updatedAt, rest } =
            importFlowMeta(flowJson);
        const flowData = (flowJson.data || flowJson) as Record<string, unknown>;
        const flowId = newId || id;
        const data = getFlowDataToImport(flowData);
        let flowStorageId = storageId;
        if (storageId === id && typeof newId === "string") {
            flowStorageId = newId;
        }
        return new WaldiezFlow({
            id: flowId,
            storageId: flowStorageId,
            name,
            description,
            tags,
            requirements,
            data,
            createdAt,
            updatedAt,
            rest,
        });
    },
    /**
     * Convert a WaldiezFlow to WaldiezFlowProps for use with React Flow.
     * @param flow - The WaldiezFlow to convert
     * @returns The WaldiezFlowProps compatible with React Flow
     */
    toReactFlow(flow: WaldiezFlow) {
        const edges: Edge[] = getRFEdges(flow);
        const nodes: Node[] = getRFNodes(flow);
        const flowProps: WaldiezFlowProps = {
            flowId: flow.id,
            isAsync: flow.data.isAsync ?? false,
            cacheSeed: flow.data.cacheSeed,
            storageId: flow.storageId,
            name: flow.name,
            description: flow.description,
            tags: flow.tags,
            requirements: flow.requirements,
            createdAt: flow.createdAt,
            updatedAt: flow.updatedAt,
            edges,
            nodes,
            viewport: flow.data.viewport || {
                zoom: 1,
                position: { x: 0, y: 0 },
            },
            ...flow.rest,
        };
        return flowProps;
    },
    /**
     * Convert a react flow instance to a WaldiezFlow.
     * @param flow - The WaldiezFlowProps to convert
     * @returns The WaldiezFlow instance
     */
    exportFlow: (flow: WaldiezFlowProps, hideSecrets: boolean, skipLinks: boolean = false) => {
        const waldiezFlow: WaldiezFlow = {
            id: flow.flowId,
            type: "flow",
            storageId: flow.storageId,
            name: flow.name,
            description: flow.description,
            tags: flow.tags,
            requirements: flow.requirements,
            createdAt: flow.createdAt || new Date().toISOString(),
            updatedAt: flow.updatedAt || new Date().toISOString(),
            data: getFlowDataToExport(flow, hideSecrets, skipLinks),
        };
        return waldiezFlow;
    },
};

/**
 * Extracts the flow data from a JSON object.
 * @param json - The JSON object containing flow data
 * @returns A WaldiezFlowData instance containing the extracted flow data
 */
const getFlowDataToImport = (json: Record<string, unknown>) => {
    const isAsync = getIsAsync(json);
    const cacheSeed = getCacheSeed(json);
    const viewport = getFlowViewport(json);
    const nodes = getNodes(json);
    let edges = getEdges(json);
    const chatsNEdges = getChats(json, nodes, edges);
    edges = chatsNEdges.edges;
    const chats = chatsNEdges.chats;
    const models = getModels(json, nodes);
    const tools = getTools(json, nodes);
    const agents = getAgents(
        json,
        nodes,
        models.map(model => model.id),
        tools.map(tool => tool.id),
        edges.map(edge => edge.id),
    );

    return new WaldiezFlowData({
        nodes,
        edges,
        agents,
        models,
        tools,
        chats,
        isAsync,
        cacheSeed,
        viewport,
    });
};

/**
 * Extracts the flow data to export from a WaldiezFlowProps instance.
 * @param flow - The WaldiezFlowProps instance
 * @param hideSecrets - Whether to hide secrets in the exported data
 * @param skipLinks - Whether to skip links in the exported data
 * @returns A WaldiezFlowData instance containing the extracted flow data
 */
const getFlowDataToExport = (flow: WaldiezFlowProps, hideSecrets: boolean, skipLinks: boolean) => {
    const nodes = flow.nodes || [];
    const edges = (flow.edges || []) as WaldiezEdge[];
    const modelNodes = nodes.filter(node => node.type === "model") as WaldiezNodeModel[];
    const toolNodes = nodes.filter(node => node.type === "tool") as WaldiezNodeTool[];
    const {
        userAgentNodes,
        assistantAgentNodes,
        ragUserNodes,
        reasoningAgentNodes,
        captainAgentNodes,
        groupManagerAgentNodes,
    } = getAgentNodes(nodes);
    return new WaldiezFlowData({
        nodes: nodes.map(node => {
            const nodeCopy = { ...node } as any;
            delete nodeCopy.data;
            delete nodeCopy.agentType;
            return nodeCopy;
        }),
        edges: edges.map(edge => {
            const edgeCopy = { ...edge } as any;
            delete edgeCopy.data;
            return edgeCopy;
        }),
        agents: {
            groupManagerAgents: groupManagerAgentNodes.map(groupManagerAgentNode =>
                exportAgent(groupManagerAgentNode, nodes, edges, skipLinks),
            ),
            userProxyAgents: userAgentNodes.map(userAgentNode =>
                exportAgent(userAgentNode, nodes, edges, skipLinks),
            ),
            assistantAgents: assistantAgentNodes.map(assistantAgentNode =>
                exportAgent(assistantAgentNode, nodes, edges, skipLinks),
            ),
            ragUserProxyAgents: ragUserNodes.map(ragUserNode =>
                exportAgent(ragUserNode, nodes, edges, skipLinks),
            ),
            reasoningAgents: reasoningAgentNodes.map(reasoningAgentNode =>
                exportAgent(reasoningAgentNode, nodes, edges, skipLinks),
            ),
            captainAgents: captainAgentNodes.map(captainAgentNode =>
                exportAgent(captainAgentNode, nodes, edges, skipLinks),
            ),
        },
        models: modelNodes.map(modelNode => exportModel(modelNode, nodes, hideSecrets)),
        tools: toolNodes.map(toolNode => exportTool(toolNode, nodes, hideSecrets)),
        chats: edges.map((edge, index) => exportChat(edge, edges, index)),
        isAsync: flow.isAsync,
        cacheSeed: flow.cacheSeed,
        viewport: flow.viewport,
        silent: flow.silent || false,
    });
};

/**
 * Get the nodes for React Flow from a WaldiezFlow instance.
 * @param flow - The WaldiezFlow instance
 * @returns An array of Node instances for React Flow
 */
const getRFNodes = (flow: WaldiezFlow) => {
    const nodes: Node[] = [];
    flow.data.models.forEach(model => {
        nodes.push(modelMapper.asNode(model));
    });
    flow.data.tools.forEach(tool => {
        nodes.push(toolMapper.asNode(tool));
    });
    // managers first (so that the parent id (if any) in the rest can be determined)
    flow.data.agents.groupManagerAgents.forEach(groupManagerAgent => {
        nodes.push(agentMapper.asNode(groupManagerAgent));
    });
    flow.data.agents.userProxyAgents.forEach(user => {
        nodes.push(agentMapper.asNode(user));
    });
    flow.data.agents.assistantAgents.forEach(assistant => {
        nodes.push(agentMapper.asNode(assistant));
    });
    flow.data.agents.ragUserProxyAgents.forEach(ragUser => {
        nodes.push(agentMapper.asNode(ragUser));
    });
    flow.data.agents.reasoningAgents.forEach(reasoningAgent => {
        nodes.push(agentMapper.asNode(reasoningAgent));
    });
    flow.data.agents.captainAgents.forEach(captainAgent => {
        nodes.push(agentMapper.asNode(captainAgent));
    });
    return nodes;
};

/**
 * Get the edges for React Flow from a WaldiezFlow instance.
 * @param flow - The WaldiezFlow instance
 * @returns An array of Edge instances for React Flow
 */
const getRFEdges = (flow: WaldiezFlow) => {
    const flowEdges: Edge[] = [];
    flow.data.chats.forEach(chat => {
        const edge = chatMapper.asEdge(chat);
        const { sourceHandle, targetHandle } = getEdgeHandles(flow, chat);
        edge.sourceHandle = sourceHandle;
        edge.targetHandle = targetHandle;
        flowEdges.push(edge);
    });
    return flowEdges;
};

/**
 * Get the handles for the edges based on the chat and flow.
 * If the chat has specific handles in its rest, use them.
 * Otherwise, check the flow edges for the source and target handles.
 * If not found, use default handles based on chat source and target.
 * @param flow - The WaldiezFlow instance
 * @param chat - The WaldiezChat instance
 * @returns An object containing sourceHandle and targetHandle
 */
const getEdgeHandles = (flow: WaldiezFlow, chat: WaldiezChat) => {
    // if in chat.rest there is a "sourceHandle" and "targetHandle" use them
    // else, check flow.edges (compare the id) and use the sourceHandle and targetHandle from there
    // if not found, use the default ones
    let sourceHandle; // = `agent-handle-right-source-${chat.source}`;
    let targetHandle; // = `agent-handle-left-target-${chat.target}`;
    if (chat.rest?.sourceHandle && typeof chat.rest.sourceHandle === "string") {
        sourceHandle = chat.rest.sourceHandle;
    }
    if (chat.rest?.targetHandle && typeof chat.rest.targetHandle === "string") {
        targetHandle = chat.rest.targetHandle;
    }
    if (!sourceHandle || !targetHandle) {
        const edge = flow.data.edges.find(edge => edge.id === chat.id);
        if (edge) {
            sourceHandle = edge.sourceHandle || sourceHandle;
            targetHandle = edge.targetHandle || targetHandle;
        }
    }
    if (!sourceHandle) {
        sourceHandle = `agent-handle-right-source-${chat.source}`;
    }
    if (!targetHandle) {
        targetHandle = `agent-handle-left-target-${chat.target}`;
    }
    return { sourceHandle, targetHandle };
};

/**
 * Get the flow JSON from a string or object.
 * If the input is a string, it tries to parse it as JSON.
 * If it's an object, it returns it as is.
 * If parsing fails, it returns an empty object.
 * @param item - The input item (string or object)
 * @returns The parsed flow JSON or an empty object
 */
const getFlowJson = (item: any) => {
    let flowJson: Record<string, unknown> = {};
    if (typeof item === "string") {
        try {
            flowJson = JSON.parse(item);
        } catch (_) {
            return {};
        }
    } else if (typeof item === "object") {
        flowJson = item;
    }
    return flowJson;
};
