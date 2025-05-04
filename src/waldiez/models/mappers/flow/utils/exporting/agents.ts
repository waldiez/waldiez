/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import {
    WaldiezNodeAgent,
    WaldiezNodeAgentAssistant,
    WaldiezNodeAgentCaptain,
    WaldiezNodeAgentRagUser,
    WaldiezNodeAgentUserProxy,
} from "@waldiez/models/Agent";
import { agentMapper } from "@waldiez/models/mappers/agent";

export const getAgentNodes = (nodes: Node[]) => {
    const agentNodes = nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
    const userAgentNodes = agentNodes.filter(
        node =>
            "data" in node &&
            typeof node.data === "object" &&
            node.data &&
            "agentType" in node.data &&
            node.data.agentType === "user",
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
            node.data.agentType === "rag_user",
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
    return {
        agentNodes,
        userAgentNodes,
        assistantAgentNodes,
        ragUserNodes,
        reasoningAgentNodes,
        captainAgentNodes,
    };
};

export const exportAgent = (agent: WaldiezNodeAgent, nodes: Node[], skipLinks: boolean) => {
    const waldiezAgent = agentMapper.exportAgent(agent, skipLinks);
    const agentNode = nodes.find(node => node.id === agent.id);
    if (agentNode) {
        Object.keys(agentNode).forEach(key => {
            if (key !== "id" && key !== "type" && key !== "data") {
                delete waldiezAgent[key];
            }
        });
    }
    waldiezAgent.agentType = agent.data.agentType;
    return waldiezAgent;
};
