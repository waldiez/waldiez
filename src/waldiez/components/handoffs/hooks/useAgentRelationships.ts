/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useMemo } from "react";

import type {
    WaldiezAgentNestedChat,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
} from "@waldiez/models/types";

/**
 * Hook to manage relationships between agents
 */
export const useAgentRelationships = (
    id: string,
    data: WaldiezNodeAgentData,
    agents: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
) => {
    // Get parent group ID
    const parentGroupId = useMemo(() => data.parentId, [data.parentId]);

    // Get other agents in the same group
    const groupAgents = useMemo(() => {
        if (!parentGroupId) {
            return [];
        }
        return agents.filter(agent => agent.data.parentId === parentGroupId && agent.id !== id);
    }, [agents, parentGroupId, id]);

    // Get edges originating from this agent
    const agentEdges = useMemo(() => {
        return edges.filter(edge => edge.source === id);
    }, [edges, id]);

    // Filter edges to connections within the same group
    const groupEdges = useMemo(() => {
        if (!parentGroupId) {
            return agentEdges;
        }

        const groupAgentIds = groupAgents.map(agent => agent.id);
        return agentEdges.filter(edge => groupAgentIds.includes(edge.target));
    }, [agentEdges, groupAgents, parentGroupId]);

    // get the edges that are "nested" (source: the agent (group member), target: not a group member)
    const nestedEdges = useMemo(() => {
        return agentEdges.filter(edge => {
            const sourceAgent = agents.find(agent => agent.id === edge.source);
            const targetAgent = agents.find(agent => agent.id === edge.target);
            return (
                sourceAgent &&
                targetAgent &&
                sourceAgent.id === id && // source is the current agent
                sourceAgent.data.parentId === parentGroupId &&
                targetAgent.data.parentId !== parentGroupId // target is not in the same group
            );
        });
    }, [id, agentEdges, agents, parentGroupId]);
    const agentGroupOnlyEdges = useMemo(() => {
        return agentEdges.filter(edge => {
            const targetAgent = agents.find(agent => agent.id === edge.target);
            return targetAgent && targetAgent.data.parentId === parentGroupId;
        });
    }, [agentEdges, agents, parentGroupId]);

    const nestedChats: WaldiezAgentNestedChat[] = useMemo(() => {
        const existingChats: WaldiezAgentNestedChat[] = data.nestedChats || [];

        // If no nested edges, return existing chats (empty or not)
        if (nestedEdges.length === 0) {
            return existingChats;
        }

        // If existing chat exists and has messages, preserve it
        // we only want to know if there are existing chats with messages
        if (existingChats.length > 0 && existingChats[0] && existingChats[0].messages.length > 0) {
            return existingChats;
        }

        // Otherwise create/update from edges
        return [
            {
                triggeredBy: [id], // always the source is the agent (it's FROM the agent TO one or more non-group members)
                messages: nestedEdges.map(edge => ({ id: edge.id, isReply: false })), // the messages are gathered from the edges (the targets)
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
    }, [id, nestedEdges, data.nestedChats]);

    return {
        parentGroupId,
        groupAgents,
        agentEdges,
        groupEdges,
        nestedEdges,
        nestedChats,
        agentGroupOnlyEdges,
    };
};
