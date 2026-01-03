/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { XYPosition } from "@xyflow/react";

import type {
    WaldiezAgentConnections,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentType,
} from "@waldiez/models";

export interface IWaldiezAgentStore {
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
    addAgent: (
        agentType: WaldiezNodeAgentType,
        position: { x: number; y: number },
        parentId: string | undefined,
    ) => WaldiezNodeAgent;
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
    importAgent: (
        agent: { [key: string]: unknown },
        agentId: string,
        skipLinks: boolean,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeAgent;
    /**
     * Export a specific agent from the store.
     * @param agentId - The ID of the agent to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported agent data.
     */
    exportAgent: (agentId: string, hideSecrets: boolean) => { [key: string]: unknown };
    /**
     * Get the connections of a specific agent.
     * @param nodeId - The ID of the agent.
     * @param options - Options to filter the connections.
     * @returns An object containing sources and targets with their respective nodes and edges.
     */
    getAgentConnections: (
        nodeId: string,
        options?: {
            sourcesOnly?: boolean;
            targetsOnly?: boolean;
        },
    ) => WaldiezAgentConnections;
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
