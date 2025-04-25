/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import {
    WaldiezChatData,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentSwarm,
    WaldiezNodeAgentSwarmContainerData,
} from "@waldiez/models";

// node:
// - initialAgent: string | null;  (node)
// edge:
// - maxRounds: number;
// - afterWork: WaldiezSwarmAfterWork | null;
// - contextVariables: { [key: string]: string };
//   and set them to the edge that triggers the chat:
//      - edge.type === "swarm" and
//      - either the source is a user|rag_user (UserProxy)
//      - or the edge that has as source the initialAgent of the swarm_container
//           and target another swarm (not other type of agent [avoid edge with nested_chat])
export const getEdgeTrigger = (
    allEdges: WaldiezEdge[],
    nodes: Node[],
    initialAgent: WaldiezNodeAgentSwarm,
    containerData: WaldiezNodeAgentSwarmContainerData,
    containerId: string,
) => {
    // search in nodes: node.type === "agent" && node.data.agentType === "user" || "rag_user"
    const userNodes = nodes.filter(
        node =>
            node.type === "agent" &&
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            (node.data.agentType === "user" || node.data.agentType === "rag_user"),
    ) as WaldiezNodeAgent[];
    // if an edge has source a userNode and one of:
    // - target the initialAgent.id
    // - realTarget the initialAgent.id
    // - target the containerAgent.id
    const edgeFromUser = allEdges.find(
        edge =>
            userNodes.some(node => node.id === edge.source) &&
            (edge.target === initialAgent.id ||
                edge.data?.realTarget === initialAgent.id ||
                edge.target === containerId),
    );
    if (edgeFromUser && edgeFromUser.type === "swarm" && edgeFromUser.data) {
        edgeFromUser.data.realTarget = initialAgent.id;
        edgeFromUser.data.maxRounds = containerData.maxRounds;
        edgeFromUser.data.contextVariables = containerData.contextVariables;
        edgeFromUser.data.flowAfterWork = containerData.afterWork;
        return edgeFromUser;
    }
    return getOneSwarmEdge(nodes, initialAgent, allEdges, containerData);
};

const getOneSwarmEdge = (
    nodes: Node[],
    initialAgent: WaldiezNodeAgentSwarm,
    allEdges: WaldiezEdge[],
    containerData: WaldiezNodeAgentSwarmContainerData,
) => {
    // if not found, return the first edge that has as source the initialAgent and target
    // a swarmAgent (not other agent [avoid edge with nested_chat])
    const initialAgentEdges = allEdges.filter(edge => edge.source === initialAgent.id);
    if (initialAgentEdges.length === 0) {
        return null;
    }
    const edgeFromInitialAgent = initialAgentEdges.find(edge => {
        const targetAgent = nodes.find(node => node.id === edge.target);
        return targetAgent && targetAgent.type === "agent" && targetAgent.data.agentType === "swarm";
    });
    const selectedEdge = edgeFromInitialAgent || initialAgentEdges[0];
    // but also update all edges that have as source the initialAgent
    // so we can revert the "maxRounds" and "afterWork" and "contextVariables"
    // on a later import if needed
    allEdges.forEach(edge => {
        if (!edge.data) {
            const chatData = new WaldiezChatData();
            edge.data = { ...chatData, label: "" };
        }
        edge.data.maxRounds = containerData.maxRounds;
        edge.data.flowAfterWork = containerData.afterWork;
        edge.data.contextVariables = containerData.contextVariables;
    });
    return selectedEdge;
};
