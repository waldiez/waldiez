/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { XYPosition } from "@xyflow/react";

import {
    IWaldiezAgentStore,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { agentMapper } from "@waldiez/models/mappers";
import { getAgentConnections, getAgentNode, resetEdgeOrdersAndPositions } from "@waldiez/store/utils";
import { typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

export class WaldiezAgentStore implements IWaldiezAgentStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezAgentStore(get, set);
    }
    getAgents = () => {
        return this.get().nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
    };
    getAgentById = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (!agent || agent.type !== "agent") {
            return null;
        }
        return agent as WaldiezNodeAgent;
    };
    addAgent = (
        agentType: WaldiezNodeAgentType,
        position: { x: number; y: number } | undefined,
        parentId: string | undefined,
    ) => {
        const agentNode = getAgentNode(agentType, position, parentId);
        this.set({
            nodes: [...this.get().nodes, { ...agentNode }],
            updatedAt: new Date().toISOString(),
        });
        return agentNode;
    };
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
    deleteAgent = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (agent) {
            const idsToRemove = [id]; // let's keep the group members
            const idsToResetParent: string[] = [];
            if (agent.type === "group_manager") {
                const groupMembers = this.getGroupMembers(id);
                idsToResetParent.push(...groupMembers.map(member => member.id));
            }
            this.set({
                nodes: this.get()
                    .nodes.map(node => {
                        if (idsToResetParent.includes(node.id)) {
                            node.parentId = undefined;
                            node.extent = undefined;
                        }
                        return node;
                    })
                    .filter(node => !idsToRemove.includes(node.id)),
                // remove all edges that are connected to the deleted agent
                edges: this.get().edges.filter(
                    edge => !idsToRemove.includes(edge.source) && !idsToRemove.includes(edge.target),
                ),
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
    exportAgent = (agentId: string, hideSecrets: boolean) => {
        const agent = this.get().nodes.find(node => node.id === agentId);
        if (!agent) {
            return {};
        }
        return agentMapper.exportAgent(agent as WaldiezNodeAgent, hideSecrets);
    };
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
    getGroupMembers = (groupId: string) => {
        return this.get().nodes.filter(
            node => node.type === "agent" && node.data.parentId === groupId,
        ) as WaldiezNodeAgent[];
    };
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
