/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Edge, Node } from "@xyflow/react";

import {
    WaldiezAgent,
    WaldiezAgentCaptainData,
    WaldiezAgentGroupManagerData,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoningData,
    WaldiezAgentRemoteData,
    type WaldiezEdge,
    type WaldiezNodeAgent,
    type WaldiezNodeAgentType,
    agentMapper,
} from "@waldiez/models";

/**
 * Creates a new agent node with the specified type, position, and parent ID.
 * If the agent type requires additional data, it initializes that data as well.
 * @param agentType - The type of the agent to create.
 * @param position - The position of the agent node in the graph.
 * @param parentId - The ID of the parent node, if any.
 * @returns A new agent node with the specified properties.
 */
export const getAgentNode = (
    agentType: WaldiezNodeAgentType,
    position: { x: number; y: number } | undefined,
    parentId: string | undefined,
) => {
    const newAgent = WaldiezAgent.create(agentType);
    const agentNode = agentMapper.asNode(newAgent, position);
    agentNode.data.parentId = parentId;
    if (agentType === "rag_user_proxy") {
        const agentExtras = new WaldiezAgentRagUserData();
        agentNode.data = { ...agentNode.data, ...agentExtras };
    } else if (agentType === "reasoning") {
        const agentExtras = new WaldiezAgentReasoningData();
        agentNode.data = { ...agentNode.data, ...agentExtras };
    } else if (agentType === "captain") {
        const agentExtras = new WaldiezAgentCaptainData();
        agentNode.data = { ...agentNode.data, ...agentExtras };
    } else if (agentType === "group_manager") {
        const agentExtras = new WaldiezAgentGroupManagerData();
        agentExtras.groupName = "Group";
        agentNode.data = { ...agentNode.data, ...agentExtras };
    } else if (agentType === "remote") {
        const agentExtras = new WaldiezAgentRemoteData();
        agentNode.data = { ...agentNode.data, ...agentExtras };
    }
    if (parentId) {
        agentNode.parentId = parentId;
        agentNode.extent = "parent";
    }
    return agentNode as WaldiezNodeAgent;
};

/**
 * Retrieves the connections of an agent node in terms of its source and target nodes.
 * It can filter connections to only sources or targets based on the provided options.
 * @param nodes - The list of all nodes in the graph.
 * @param edges - The list of all edges in the graph.
 * @param nodeId - The ID of the agent node for which connections are being retrieved.
 * @param options - Optional parameters to filter connections (sources only, targets only).
 * @returns An object containing arrays of connected source and target nodes and their corresponding edges.
 */
export const getAgentConnections = (
    nodes: Node[],
    edges: Edge[],
    nodeId: string,
    options?: {
        sourcesOnly?: boolean;
        targetsOnly?: boolean;
    },
) => {
    if (!options) {
        options = {
            sourcesOnly: false,
            targetsOnly: false,
        };
    }
    const sourceConnectedNodes = [];
    const sourceConnectionEdges = [];
    const targetConnectedNodes = [];
    const targetConnectionEdges = [];
    for (const edge of edges) {
        const { sourceNode, targetNode } = getAgentEdgeConnections(nodeId, edge, nodes, options);
        if (sourceNode) {
            sourceConnectedNodes.push(sourceNode);
            sourceConnectionEdges.push(edge);
        }
        if (targetNode) {
            targetConnectedNodes.push(targetNode);
            targetConnectionEdges.push(edge);
        }
    }
    return {
        sources: {
            nodes: sourceConnectedNodes as WaldiezNodeAgent[],
            edges: sourceConnectionEdges as WaldiezEdge[],
        },
        targets: {
            nodes: targetConnectedNodes as WaldiezNodeAgent[],
            edges: targetConnectionEdges as WaldiezEdge[],
        },
    };
};

/**
 * Helper function to determine the source and target nodes connected to a specific agent node
 * based on the provided edge and options for filtering connections.
 * @param nodeId - The ID of the agent node.
 * @param edge - The edge connecting nodes in the graph.
 * @param nodes - The list of all nodes in the graph.
 * @param options - Options to filter connections (sources only, targets only).
 * @returns An object containing the source and target nodes connected to the agent node.
 */
const getAgentEdgeConnections = (
    nodeId: string,
    edge: Edge,
    nodes: Node[],
    options: {
        sourcesOnly?: boolean;
        targetsOnly?: boolean;
    },
) => {
    let targetNode;
    let sourceNode;
    if (edge.target === nodeId && !options.targetsOnly) {
        sourceNode = nodes.find(node => node.id === edge.source);
    }
    if (edge.source === nodeId && !options.sourcesOnly) {
        targetNode = nodes.find(node => node.id === edge.target);
    }
    return { sourceNode, targetNode };
};
