/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge } from "@xyflow/react";

import {
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentSwarm,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { IWaldiezAgentStore, WaldiezChat } from "@waldiez/models";
import { agentMapper, chatMapper } from "@waldiez/models/mappers";
import {
    getAgentConnections,
    getAgentNode,
    resetEdgeOrdersAndPositions,
    setSwarmInitialAgent,
} from "@waldiez/store/utils";
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
            nodes: this.get().nodes.map(node =>
                node.id === id ? { ...node, data: { ...node.data, ...data } } : node,
            ),
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    deleteAgent = (id: string) => {
        const agent = this.get().nodes.find(node => node.id === id);
        if (agent) {
            if (agent.data.agentType === "manager") {
                this.deleteGroupManager(id);
            } else {
                const idsToRemove = agent.data.agentType !== "swarm_container" ? [id] : [];
                if (agent.data.agentType === "swarm") {
                    const allSwarmAgents = this.get().nodes.filter(
                        node => node.type === "agent" && node.data.agentType === "swarm",
                    );
                    if (allSwarmAgents.length === 1 && agent.parentId) {
                        idsToRemove.push(agent.parentId);
                    }
                }
                this.set({
                    nodes: this.get().nodes.filter(node => !idsToRemove.includes(node.id)),
                    edges: this.get().edges.filter(
                        edge => !idsToRemove.includes(edge.source) && !idsToRemove.includes(edge.target),
                    ),
                    updatedAt: new Date().toISOString(),
                });
            }
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
    getGroupMembers = (groupId: string) => {
        return this.get().nodes.filter(
            node => node.type === "agent" && node.data.parentId === groupId,
        ) as WaldiezNodeAgent[];
    };
    addGroupMember = (groupId: string, memberId: string) => {
        // add an edge with source the parent and target the member
        const newChat = WaldiezChat.create({
            source: groupId,
            target: memberId,
        });
        const innerEdge: Edge = chatMapper.asEdge(newChat);
        innerEdge.type = "hidden";
        innerEdge.selected = false;
        // remove any other edges that the member currently has with other nodes
        const remainingEdges = this.get().edges.filter(
            edge => edge.source !== memberId && edge.target !== memberId,
        );
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === memberId) {
                    return {
                        ...node,
                        data: { ...node.data, parentId: groupId },
                    };
                }
                return node;
            }),
            edges: [...remainingEdges, ...[innerEdge]],
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    removeGroupMember = (groupId: string, memberId: string) => {
        const nodes = [
            ...this.get().nodes.map(node => {
                if (node.id === memberId && node.data.parentId === groupId) {
                    node.data.parentId = null;
                    node.position = {
                        x: node.position.x + 50,
                        y: node.position.y + 50,
                    };
                }
                return { ...node };
            }),
        ];
        const edges = this.get().edges.filter(edge => !(edge.source === groupId && edge.target === memberId));
        this.set({
            nodes,
            edges,
            updatedAt: new Date().toISOString(),
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
    setAgentGroup = (agentId: string, groupId: string) => {
        this.set({
            nodes: this.get().nodes.map(node => {
                if (node.id === agentId) {
                    return {
                        ...node,
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
    changeGroup = (agentId: string, newGroupId: string | undefined) => {
        const agent = this.get().nodes.find(node => node.id === agentId);
        if (!agent) {
            throw new Error(`Agent with id ${agentId} not found`);
        }
        const currentGroupId = agent.data.parentId as string | null;
        if (currentGroupId) {
            this.removeGroupMember(currentGroupId, agentId);
        }
        if (newGroupId) {
            this.addGroupMember(newGroupId, agentId);
        }
    };
    ensureSwarmContainer = (flowId: string, position: { x: number; y: number }) => {
        const expectedId = `swarm-container-${flowId}`;
        const existing = this.get().nodes.find(node => node.id === expectedId);
        if (existing) {
            return existing as WaldiezNodeAgent;
        }
        const agentNode = getAgentNode("swarm_container", position, undefined);
        agentNode.id = expectedId;
        this.set({
            nodes: [...this.get().nodes, { ...agentNode }],
            updatedAt: new Date().toISOString(),
        });
        return agentNode as WaldiezNodeAgent;
    };
    getSwarmAgents = () => {
        return this.get().nodes.filter(
            node => node.type === "agent" && node.data.agentType === "swarm",
        ) as WaldiezNodeAgentSwarm[];
    };
    setSwarmInitialAgent = (agentId: string) => {
        setSwarmInitialAgent(agentId, this.get, this.set);
    };
    updateSwarmInitialAgent = (agentId: string) => {
        setSwarmInitialAgent(agentId, this.get, this.set);
        // if there are any edges (with source a non-swarm agent)
        // that connect to a swarm agent, update the edge to connect to the new initial agent
        // (it should connect to the old one, check this too?)
        this.set({
            edges: this.get().edges.map(edge => {
                const sourceNode = this.get().nodes.find(node => node.id === edge.source);
                if (sourceNode && sourceNode.data.agentType !== "swarm") {
                    const targetNode = this.get().nodes.find(node => node.id === edge.target);
                    if (targetNode && targetNode.data.agentType === "swarm") {
                        // id={`agent-handle-bottom-target-${id}`}
                        // id={`agent-handle-top-target-${id}`}...
                        // if the old handle is in the format above,
                        // let's update it to the new initial agent's id
                        let newTargetHandle;
                        const oldTargetHandle = edge.targetHandle ?? "";
                        const targetHandleParts = oldTargetHandle.split("-");
                        if (targetHandleParts.length === 5) {
                            newTargetHandle = `${targetHandleParts[0]}-${targetHandleParts[1]}-${targetHandleParts[2]}-${
                                targetHandleParts[3]
                            }-${agentId}`;
                        }
                        return {
                            ...edge,
                            target: agentId,
                            targetHandle: newTargetHandle,
                        };
                    }
                }
                return edge;
            }),
            updatedAt: new Date().toISOString(),
        });
    };
    getNonSwarmAgents: (
        swarmContainerId: string,
        swarmAgents: WaldiezNodeAgent[],
        edges: { source: string; target: string }[],
    ) => {
        swarmSources: WaldiezNodeAgent[];
        swarmTargets: WaldiezNodeAgent[];
    } = (swarmContainerId, swarmAgents, edges) => {
        // get the agents connecting to swarm agents that are not swarm agents themselves
        const swarmSources = edges
            .filter(edge => swarmAgents.some(agent => [agent.id, swarmContainerId].includes(edge.target)))
            .map(edge => this.getAgentById(edge.source))
            .filter(agent => agent && agent.data.agentType !== "swarm") as WaldiezNodeAgent[];
        // get the agents connected to swarm agents that are not swarm agents themselves
        const swarmTargets = edges
            .filter(edge => swarmAgents.some(agent => agent.id === edge.source))
            .map(edge => this.getAgentById(edge.target))
            .filter(agent => agent && agent.data.agentType !== "swarm") as WaldiezNodeAgent[];
        return { swarmSources, swarmTargets };
    };
    getAgentConnections = (
        nodeId: string,
        options?: {
            sourcesOnly?: boolean;
            targetsOnly?: boolean;
            skipManagers?: boolean;
        },
    ) => {
        if (!options) {
            options = {
                sourcesOnly: false,
                targetsOnly: false,
                skipManagers: false,
            };
        }
        return getAgentConnections(this.get().nodes, this.get().edges, nodeId, options);
    };
    private deleteGroupManager = (groupId: string) => {
        const groupMembers = this.get().nodes.filter(
            node => node.type === "agent" && node.data.parentId === groupId,
        );
        this.set({
            nodes: this.get().nodes.map(node => {
                if (groupMembers.some(member => member.id === node.id)) {
                    return {
                        ...node,
                        data: { ...node.data, parentId: null },
                    };
                }
                return node;
            }),
            updatedAt: new Date().toISOString(),
        });
        this.set({
            nodes: this.get().nodes.filter(node => node.id !== groupId),
            edges: this.get().edges.filter(edge => edge.source !== groupId && edge.target !== groupId),
            updatedAt: new Date().toISOString(),
        });
    };
}
