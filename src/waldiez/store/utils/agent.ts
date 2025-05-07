/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node } from "@xyflow/react";

import {
    WaldiezAgent,
    WaldiezAgentCaptainData,
    WaldiezAgentGroupManagerData,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoningData,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentType,
    agentMapper,
} from "@waldiez/models";

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
    }
    if (parentId) {
        agentNode.parentId = parentId;
        agentNode.extent = "parent";
    }
    return agentNode as WaldiezNodeAgent;
};

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
        source: {
            nodes: sourceConnectedNodes as WaldiezNodeAgent[],
            edges: sourceConnectionEdges as WaldiezEdge[],
        },
        target: {
            nodes: targetConnectedNodes as WaldiezNodeAgent[],
            edges: targetConnectionEdges as WaldiezEdge[],
        },
    };
};
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
