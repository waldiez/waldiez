/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useMemo } from "react";

import { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

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

    // Get agent name by ID
    const getAgentName = (agentId: string) => {
        const agent = agents.find(a => a.id === agentId);
        return agent?.data.label || agent?.data.name || agentId;
    };

    return {
        parentGroupId,
        groupAgents,
        agentEdges,
        groupEdges,
        getAgentName,
    };
};
