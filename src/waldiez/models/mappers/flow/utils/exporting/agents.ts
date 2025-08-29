/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type {
    WaldiezNodeAgent,
    WaldiezNodeAgentAssistant,
    WaldiezNodeAgentCaptain,
    WaldiezNodeAgentRagUser,
    WaldiezNodeAgentUserProxy,
} from "@waldiez/models/Agent";
import { agentMapper } from "@waldiez/models/mappers/agent";
import type { WaldiezEdge } from "@waldiez/types";

export const getAgentNodes = (nodes: Node[]) => {
    const agentNodes = nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
    const userAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "user_proxy",
    ) as WaldiezNodeAgentUserProxy[];
    const assistantAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "assistant",
    ) as WaldiezNodeAgentAssistant[];
    const ragUserNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "rag_user_proxy",
    ) as WaldiezNodeAgentRagUser[];
    const reasoningAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "reasoning",
    );
    const captainAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "captain",
    ) as WaldiezNodeAgentCaptain[];
    const groupManagerAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "group_manager",
    );
    const docAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "doc_agent",
    );
    return {
        agentNodes,
        userAgentNodes,
        assistantAgentNodes,
        ragUserNodes,
        docAgentNodes,
        reasoningAgentNodes,
        captainAgentNodes,
        groupManagerAgentNodes,
    };
};

export const exportAgent = (
    agent: WaldiezNodeAgent,
    nodes: Node[],
    edges: WaldiezEdge[],
    skipLinks: boolean,
) => {
    const waldiezAgent = agentMapper.exportAgent(agent, skipLinks);
    const agentNode = nodes.find(node => node.id === agent.id);
    if (agentNode) {
        Object.keys(agentNode).forEach(key => {
            if (!["id", "type", "parentId", "data"].includes(key)) {
                delete waldiezAgent[key];
            }
        });
    }
    waldiezAgent.agentType = agent.data.agentType;
    ensureAgentNestedChatData(waldiezAgent, nodes, edges);
    return waldiezAgent;
};

const getAgentNestedEdges = (
    agentId: string,
    agents: WaldiezNodeAgent[],
    parentGroupId: string | undefined | null,
    edges: WaldiezEdge[],
) => {
    const agentEdges = edges.filter(edge => edge.source === agentId);
    if (parentGroupId) {
        return agentEdges.filter(edge => {
            const sourceAgent = agents.find(agent => agent.id === edge.source);
            const targetAgent = agents.find(agent => agent.id === edge.target);
            return (
                sourceAgent &&
                targetAgent &&
                sourceAgent.data.parentId === parentGroupId &&
                targetAgent.data.parentId !== parentGroupId
            );
        });
    }
    return agentEdges.filter(edge => edge.type === "nested");
};

const ensureAgentNestedChatData = (agent: WaldiezNodeAgent, nodes: Node[], edges: WaldiezEdge[]) => {
    const agents = nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
    const parentGroupId = agent.data.parentId;
    const nestedEdges = getAgentNestedEdges(agent.id, agents, parentGroupId, edges);
    const existingNestedChats = agent.data.nestedChats || [];
    if (
        nestedEdges.length === 0 ||
        (existingNestedChats.length > 0 &&
            existingNestedChats[0] &&
            existingNestedChats[0].messages.length > 0)
    ) {
        agent.data.nestedChats = existingNestedChats;
    } else {
        agent.data.nestedChats = [
            {
                triggeredBy: [agent.id],
                // in the order of the edges (since no update was made to the agent's relevant tab)
                messages: nestedEdges.map(edge => ({ id: edge.id, isReply: false })),
                condition: {
                    conditionType: "string_llm",
                    prompt: "",
                },
                available: {
                    type: "none",
                    value: "",
                },
            },
        ];
    }
};
