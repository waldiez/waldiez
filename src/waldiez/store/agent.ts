/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { XYPosition } from "@xyflow/react";

import type {
    IWaldiezAgentStore,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers";
import { getAgentConnections, getAgentNode, resetEdgeOrdersAndPositions } from "@waldiez/store/utils";
import { INITIAL_AGENT_SIZE } from "@waldiez/theme";
import type { typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

/**
 * WaldiezAgentStore class implements the IWaldiezAgentStore interface.
 * It provides methods to manage agents in the Waldiez application.
 * This includes adding, updating, deleting, and retrieving agents,
 * as well as importing and exporting agent data.
 * The store uses a get and set function to manage the state of agents.
 * @see {@link IWaldiezAgentStore}
 */
export class WaldiezAgentStore implements IWaldiezAgentStore {
    private readonly get: typeOfGet;
    private readonly set: typeOfSet;
    /**
     * Constructor for the WaldiezAgentStore class.
     * @param get - Function to get the current state of the store.
     * @param set - Function to set the new state of the store.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    /**
     * Static method to create an instance of WaldiezAgentStore.
     * @param get - Function to get the current state of the store.
     * @param set - Function to set the new state of the store.
     * @returns An instance of WaldiezAgentStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezAgentStore(get, set);
    }
    /**
     * Retrieves the current state of the agent store.
     * @returns The current state of the agent store.
     * @see {@link IWaldiezAgentStore.getAgents}
     */
    getAgents = () => {
        return this.get().nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
    };
    /**
     * Retrieves an agent by its ID.
     * @param id - The ID of the agent to retrieve.
     * @returns The agent with the specified ID, or null if not found.
     * @see {@link IWaldiezAgentStore.getAgentById}
     */
    getAgentById = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (!agent || agent.type !== "agent") {
            return null;
        }
        return agent as WaldiezNodeAgent;
    };
    /**
     * Adds a new agent to the store.
     * @param agentType - The type of the agent to add.
     * @param position - The position of the agent in the graph.
     * @param parentId - The ID of the parent agent, if any.
     * @returns The newly added agent node.
     * @see {@link IWaldiezAgentStore.addAgent}
     */
    addAgent = (
        agentType: WaldiezNodeAgentType,
        position: { x: number; y: number } | undefined,
        parentId: string | undefined,
    ) => {
        const agentNode = getAgentNode(agentType, position, parentId);
        agentNode.style = {
            width:
                agentType === "group_manager"
                    ? INITIAL_AGENT_SIZE.group_manager.width
                    : agentType !== "user_proxy"
                      ? INITIAL_AGENT_SIZE.other.width
                      : INITIAL_AGENT_SIZE.user.width,
        };
        // if the new agent iss a group manager,
        // make sure it is in the front of the list
        // to avoid issues with group members ('cannot find parent node')
        if (agentType === "group_manager") {
            this.set({
                nodes: [agentNode, ...this.get().nodes],
                updatedAt: new Date().toISOString(),
            });
        } else {
            this.set({
                nodes: [...this.get().nodes, agentNode],
                updatedAt: new Date().toISOString(),
            });
        }
        return agentNode;
    };
    /**
     * Clones an existing agent by its ID.
     * @param id - The ID of the agent to clone.
     * @returns The cloned agent node, or null if the agent was not found.
     * @see {@link IWaldiezAgentStore.cloneAgent}
     */
    cloneAgent = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (agent) {
            const newName = agent.data.label + " (copy)";
            const position = {
                x: agent.position.x + (agent.width ?? 100) + 40,
                y: agent.position.y + (agent.height ?? 100) + 40,
            };
            const newAgent = {
                ...agent,
                position,
                id: getId(),
                data: { ...agent.data, label: newName },
            };
            this.set({
                nodes: [...this.get().nodes, newAgent],
                updatedAt: new Date().toISOString(),
            });
            // select the new node
            setTimeout(() => {
                this.set({
                    nodes: this.get().nodes.map(node => {
                        if (node.id === newAgent.id) {
                            return { ...node, selected: true };
                        }
                        return { ...node, selected: false };
                    }),
                });
            }, 10);
            return newAgent as WaldiezNodeAgent;
        }
        return null;
    };
    /**
     * Updates the data of an agent by its ID.
     * @param id - The ID of the agent to update.
     * @param data - The new data to set for the agent.
     * @see {@link IWaldiezAgentStore.updateAgentData}
     */
    updateAgentData = (id: string, data: Partial<WaldiezNodeAgentData>) => {
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === id) {
                    if (data.parentId !== node.data.parentId) {
                        node.parentId = data.parentId ?? undefined;
                        node.extent = data.parentId ? "parent" : undefined;
                    }
                    return {
                        ...node,
                        data: { ...node.data, ...data },
                    };
                }
                return node;
            }),
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    /**
     * Deletes an agent by its ID.
     * @param id - The ID of the agent to delete.
     * @see {@link IWaldiezAgentStore.deleteAgent}
     */
    deleteAgent = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (agent) {
            const idsToRemove = [id]; // let's keep the group members
            const idsToResetParent: string[] = [];
            if (agent.data.agentType === "group_manager") {
                const groupMembers = this.getGroupMembers(id);
                idsToResetParent.push(...groupMembers.map(member => member.id));
            }
            this.set({
                nodes: this.get()
                    .nodes.filter(node => !idsToRemove.includes(node.id))
                    .map(node => {
                        if (idsToResetParent.includes(node.id)) {
                            node.parentId = undefined;
                            node.data.parentId = undefined;
                            node.extent = undefined;
                        }
                        return node;
                    }),
                edges: this.get()
                    // remove all edges that are connected to the deleted agent
                    .edges.filter(
                        edge => !idsToRemove.includes(edge.source) && !idsToRemove.includes(edge.target),
                    )
                    // change the type of the edge to "chat" if an edge is connected to a group member
                    .map(edge => {
                        if (
                            idsToResetParent.includes(edge.source) ||
                            idsToResetParent.includes(edge.target)
                        ) {
                            return {
                                ...edge,
                                animated: false,
                                type: "chat",
                            };
                        }
                        return edge;
                    }),
                updatedAt: new Date().toISOString(),
            });
        } else {
            this.set({
                nodes: this.get().nodes.filter(node => node.id !== id),
                edges: this.get().edges.filter(edge => edge.source !== id && edge.target !== id),
                updatedAt: new Date().toISOString(),
            });
        }
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    /**
     * Imports an agent from a JSON object.
     * @param agent - The agent data to import.
     * @param agentId - The ID to assign to the imported agent.
     * @param skipLinks - Whether to skip importing links.
     * @param position - The position to place the imported agent in the graph.
     * @param save - Whether to save the imported agent to the store.
     * @returns The newly imported agent node.
     * @see {@link IWaldiezAgentStore.importAgent}
     */
    importAgent = (
        agent: { [key: string]: unknown },
        agentId: string,
        skipLinks: boolean,
        position: { x: number; y: number } | undefined,
        save: boolean = true,
    ) => {
        const newAgent = agentMapper.importAgent(agent, agentId);
        const newAgentNode = agentMapper.asNode(newAgent, position, skipLinks);
        if (position) {
            newAgentNode.position = position;
        }
        if (save) {
            this.set({
                nodes: [...this.get().nodes, { ...newAgentNode }],
                updatedAt: new Date().toISOString(),
            });
        }
        return newAgentNode;
    };
    /**
     * Exports an agent by its ID.
     * @param agentId - The ID of the agent to export.
     * @param hideSecrets - Whether to hide sensitive information in the exported data.
     * @returns The exported agent data.
     * @see {@link IWaldiezAgentStore.exportAgent}
     */
    exportAgent = (agentId: string, hideSecrets: boolean) => {
        const agent = this.get().nodes.find(node => node.id === agentId);
        if (!agent) {
            return {};
        }
        return agentMapper.exportAgent(agent as WaldiezNodeAgent, hideSecrets);
    };
    /**
     * Retrieves the connections of an agent by its ID.
     * @param nodeId - The ID of the agent to get connections for.
     * @param options - Options to filter connections (sourcesOnly, targetsOnly).
     * @returns An array of connections for the specified agent.
     * @see {@link IWaldiezAgentStore.getAgentConnections}
     */
    getAgentConnections = (
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
        return getAgentConnections(this.get().nodes, this.get().edges, nodeId, options);
    };
    /**
     * Sets the agent group for a specific agent.
     * @param agentId - The ID of the agent to set the group for.
     * @param groupId - The ID of the group to set.
     * @param position - The position to place the agent in the group.
     * @see {@link IWaldiezAgentStore.setAgentGroup}
     */
    setAgentGroup = (agentId: string, groupId: string, position?: XYPosition) => {
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === agentId) {
                    return {
                        ...node,
                        position: position ?? node.position,
                        parentId: groupId,
                        extent: "parent",
                        data: {
                            ...node.data,
                            parentId: groupId,
                        },
                    };
                }
                return node;
            }),
            updatedAt: new Date().toISOString(),
        });
    };
    /**
     * Retrieves the group members of a specific group by its ID.
     * @param groupId - The ID of the group to get members for.
     * @returns An array of agents that are members of the specified group.
     * @see {@link IWaldiezAgentStore.getGroupMembers}
     */
    getGroupMembers = (groupId: string) => {
        return this.get().nodes.filter(
            node => node.type === "agent" && node.data.parentId === groupId,
        ) as WaldiezNodeAgent[];
    };
    /**
     * Adds a member to a group by its ID.
     * @param groupId - The ID of the group to add the member to.
     * @param memberId - The ID of the member to add.
     * @param position - The position to place the member in the group.
     * @see {@link IWaldiezAgentStore.addGroupMember}
     */
    addGroupMember = (groupId: string, memberId: string, position?: XYPosition) => {
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === memberId) {
                    return {
                        ...node,
                        position: position || node.position,
                        parentId: groupId,
                        extent: "parent",
                        data: { ...node.data, parentId: groupId },
                    };
                }
                return node;
            }),
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    /**
     * Removes a member from a group by its ID.
     * @param groupId - The ID of the group to remove the member from.
     * @param memberId - The ID of the member to remove.
     * @see {@link IWaldiezAgentStore.removeGroupMember}
     */
    removeGroupMember = (groupId: string, memberId: string) => {
        const nodes = [
            ...this.get().nodes.map(node => {
                if (node.id === memberId && node.data.parentId === groupId) {
                    node.data.parentId = undefined;
                    node.parentId = undefined;
                    node.extent = undefined;
                    node.position = {
                        x: node.position.x + 50,
                        y: node.position.y + 50,
                    };
                }
                return { ...node };
            }),
        ];
        this.set({
            nodes,
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
}
