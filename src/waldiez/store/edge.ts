/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, EdgeChange, applyEdgeChanges } from "@xyflow/react";

import {
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { IWaldiezEdgeStore } from "@waldiez/models";
import {
    edgeCommonStyle,
    getNewEdge,
    getNewEdgeConnectionProps,
    getNewEdgeName,
    getNewEdgeNodes,
    resetEdgeOrdersAndPositions,
    setSwarmInitialAgent,
    shouldReconnect,
} from "@waldiez/store/utils";
import { AGENT_COLORS } from "@waldiez/theme";
import { typeOfGet, typeOfSet } from "@waldiez/types";
import { getFlowRoot } from "@waldiez/utils";

type Connection = {
    source: string;
    target: string;
    sourceHandle: string | null;
    targetHandle: string | null;
};

export class WaldiezEdgeStore implements IWaldiezEdgeStore {
    private get: typeOfGet;
    private set: typeOfSet;

    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezEdgeStore(get, set);
    }

    getEdges = () => this.get().edges as WaldiezEdge[];
    getEdgeById = (id: string) => {
        const edge = this.get().edges.find(edge => edge.id === id);
        return edge as WaldiezEdge | undefined;
    };
    deleteEdge = (id: string) => {
        const agents = this.get().nodes.filter(node => node.type === "agent") as WaldiezNodeAgent[];
        const notaAgentNodes = this.get().nodes.filter(node => node.type !== "agent");
        const agentNodes = agents.map(agentNode => {
            const nestedChats = (agentNode.data as WaldiezNodeAgentData).nestedChats ?? [];
            return {
                ...agentNode,
                data: {
                    ...agentNode.data,
                    nestedChats: nestedChats.map(nestedChat => {
                        return {
                            ...nestedChat,
                            messages: nestedChat.messages.filter(message => message.id !== id),
                            // also check if the edge sources (agent's triggeredBy) are still valid
                            triggeredBy: nestedChat.triggeredBy,
                        };
                    }),
                },
            };
        });
        const nodes = [...notaAgentNodes, ...agentNodes];
        const newEdges = this.get().edges.filter(edge => edge.id !== id);
        this.set({
            nodes,
            edges: newEdges.map((edge, index) => {
                return {
                    ...edge,
                    data: { ...edge.data, position: index + 1 },
                };
            }),
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
    };
    updateEdgeData = (id: string, data: Partial<WaldiezEdge["data"]>) => {
        const edge = this.get().edges.find(edge => edge.id === id);
        if (edge) {
            const updatedEdge = { ...edge, data: { ...edge.data, ...data } };
            const edges = this.get().edges.map(edge => (edge.id === id ? updatedEdge : edge));
            this.set({ edges, updatedAt: new Date().toISOString() });
            this.resetEdgeOrdersAndPositions();
        }
    };
    updateEdgeType = (id: string, edgeType: WaldiezEdgeType) => {
        this.set({
            edges: this.get().edges.map(edge => {
                if (edge.id === id) {
                    const sourceNode = this.get().nodes.find(node => node.id === edge.source);
                    if (!sourceNode) {
                        throw new Error(`Source node not found for edge ${id}`);
                    }
                    const color = AGENT_COLORS[sourceNode.data.agentType as WaldiezNodeAgentType];
                    return {
                        ...edge,
                        type: edgeType,
                        hidden: false,
                        data: {
                            ...edge.data,
                            order: edgeType === "nested" ? -1 : (edge.data?.order ?? -1),
                            prerequisites: edgeType === "nested" ? [] : (edge.data?.prerequisites ?? []),
                        },
                        animated: edgeType === "nested",
                        ...edgeCommonStyle(edgeType, color),
                    };
                }
                return edge;
            }),
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
    };
    updateEdgePath = (id: string, agentType: WaldiezNodeAgentType) => {
        const currentEdge = this.get().edges.find(edge => edge.id === id);
        if (!currentEdge) {
            console.error(`Edge with id ${id} not found`);
            return;
        }
        const edgeType = currentEdge.type as WaldiezEdgeType;
        const color = AGENT_COLORS[agentType];
        const { style, markerEnd } = edgeCommonStyle(edgeType, color);
        this.set({
            edges: this.get().edges.map(edge => {
                if (edge.id === id) {
                    return { ...edge, style, markerEnd };
                }
                return { ...edge };
            }),
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
    };
    addEdge = (connection: Connection, hidden: boolean) => {
        const nodes = this.get().nodes as WaldiezNodeAgent[];
        const edges = this.get().edges;
        const edgesCounter = (chatType: string) => edges.filter(edge => edge.type === chatType).length;
        const { source, target, sourceHandle, targetHandle } = connection;
        const { sourceNode, targetNode } = getNewEdgeNodes(nodes, source, target);
        if (!sourceNode || !targetNode) {
            return null;
        }
        const newEdge = getNewEdge(hidden, edgesCounter, sourceNode, targetNode, edges);
        if (!newEdge) {
            return null;
        }
        this.set({
            edges: [...this.get().edges, { ...newEdge, sourceHandle, targetHandle }],
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
        const newStoredEdge = this.get().edges.find(edge => edge.id === newEdge.id);
        if (sourceNode.data.agentType !== "swarm" && targetNode.data.agentType === "swarm") {
            setSwarmInitialAgent(targetNode.id, this.get, this.set);
        }
        return (newStoredEdge ?? newEdge) as WaldiezEdge;
    };
    onEdgeDoubleClick = (_event: any, edge: WaldiezEdge) => {
        const openDialogs = document.querySelectorAll("dialog[open]");
        if (openDialogs.length > 0) {
            return;
        }
        const flowRoot = getFlowRoot(this.get().flowId);
        if (flowRoot) {
            const srcModalBtn = flowRoot.querySelector(
                `#open-edge-modal-node-${edge.source}`,
            ) as HTMLButtonElement;
            if (srcModalBtn) {
                srcModalBtn.setAttribute("data-edge-id", edge.id);
                srcModalBtn.click();
            } else {
                const dstModalBtn = flowRoot.querySelector(
                    `#open-edge-modal-node-${edge.target}`,
                ) as HTMLButtonElement;
                if (dstModalBtn) {
                    dstModalBtn.setAttribute("data-edge-id", edge.id);
                    dstModalBtn.click();
                }
            }
        }
    };
    getEdgeSourceAgent = (edge: WaldiezEdge) => {
        const agent = this.get().nodes.find(node => node.id === edge.source);
        if (agent && agent.type === "agent") {
            return agent as WaldiezNodeAgent;
        }
        return undefined;
    };
    getEdgeTargetAgent = (edge: WaldiezEdge) => {
        const agent = this.get().nodes.find(node => node.id === edge.target);
        if (agent && agent.type === "agent") {
            return agent as WaldiezNodeAgent;
        }
        return undefined;
    };
    onReconnect: (oldEdge: Edge, newConnection: Connection) => void = (oldEdge, newConnection) => {
        const nodes = this.get().nodes as WaldiezNodeAgent[];
        if (!shouldReconnect(newConnection, nodes)) {
            return;
        }
        const { oldSourceNode, oldTargetNode, newSourceNode, newTargetNode, color } =
            getNewEdgeConnectionProps(oldEdge, newConnection, nodes);
        if (!oldSourceNode || !oldTargetNode || !newSourceNode || !newTargetNode) {
            console.error("Not all nodes found");
            return;
        }
        if (oldSourceNode.data.agentType !== "swarm" && newTargetNode.data.agentType === "swarm") {
            setSwarmInitialAgent(newTargetNode.id, this.get, this.set);
        }
        if (!color) {
            return false;
        }
        const oldLabel = oldEdge.data?.label;
        if (
            oldEdge.data &&
            oldLabel === `${oldSourceNode.data.agentType} => ${oldTargetNode.data.agentType}`
        ) {
            oldEdge.data.label = getNewEdgeName(newSourceNode, newTargetNode);
        }
        this.set({
            edges: [
                ...this.get().edges.map(edge => {
                    if (edge.id !== oldEdge.id) {
                        return edge;
                    }
                    return {
                        ...oldEdge,
                        source: newConnection.source,
                        target: newConnection.target,
                        sourceHandle: newConnection.sourceHandle,
                        targetHandle: newConnection.targetHandle,
                        ...edgeCommonStyle(oldEdge.type as WaldiezEdgeType, color),
                    };
                }),
            ],
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
    };
    onEdgesChange = (changes: EdgeChange[]) => {
        const edges = applyEdgeChanges(changes, this.get().edges);
        this.set({ edges, updatedAt: new Date().toISOString() });
    };
    getSwarmEdges: () => WaldiezEdge[] = () => {
        return this.get().edges.filter(edge => edge.type === "swarm") as WaldiezEdge[];
    };
    private resetEdgeOrdersAndPositions = () => {
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
}
