/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, EdgeChange, applyEdgeChanges } from "@xyflow/react";

import {
    IWaldiezEdgeStore,
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import {
    edgeCommonStyle,
    getNewEdge,
    getNewEdgeConnectionProps,
    getNewEdgeName,
    getNewEdgeNodes,
    resetEdgeOrdersAndPositions,
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

/**
 * WaldiezEdgeStore is a class that implements the IWaldiezEdgeStore interface.
 * It provides methods to manage edges in a Waldiez flow, including adding, updating, deleting, and retrieving edges.
 * It also handles edge connections and styles based on the agent types involved.
 * @see {@link IWaldiezEdgeStore}
 */
export class WaldiezEdgeStore implements IWaldiezEdgeStore {
    private get: typeOfGet;
    private set: typeOfSet;

    /**
     * Creates an instance of WaldiezEdgeStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    /**
     * Factory method to create a new instance of WaldiezEdgeStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     * @returns A new instance of WaldiezEdgeStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezEdgeStore(get, set);
    }

    /**
     * Retrieves all edges from the store.
     * @returns An array of WaldiezEdge objects.
     * @see {@link WaldiezEdge}
     * @see {@link IWaldiezEdgeStore.getEdges}
     */
    getEdges = () => this.get().edges as WaldiezEdge[];
    /**
     * Retrieves an edge by its ID.
     * @param id - The ID of the edge to retrieve.
     * @returns The WaldiezEdge object if found, otherwise undefined.
     * @see {@link WaldiezEdge}
     * @see {@link IWaldiezEdgeStore.getEdgeById}
     */
    getEdgeById = (id: string) => {
        const edge = this.get().edges.find(edge => edge.id === id);
        return edge as WaldiezEdge | undefined;
    };
    /**
     * Deletes an edge by its ID.
     * This method also updates the nested chats of agent nodes to remove messages associated with the deleted edge.
     * @param id - The ID of the edge to delete.
     * @see {@link IWaldiezEdgeStore.deleteEdge}
     */
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
    /**
     * Updates the data of an edge by its ID.
     * @param id - The ID of the edge to update.
     * @param data - Partial data to update the edge with.
     * @see {@link IWaldiezEdgeStore.updateEdgeData}
     */
    updateEdgeData = (id: string, data: Partial<WaldiezEdge["data"]>) => {
        const edge = this.get().edges.find(edge => edge.id === id);
        if (edge) {
            const updatedEdge = { ...edge, data: { ...edge.data, ...data } };
            const edges = this.get().edges.map(edge => (edge.id === id ? updatedEdge : edge));
            this.set({ edges, updatedAt: new Date().toISOString() });
            this.resetEdgeOrdersAndPositions();
        }
    };
    /**
     * Updates the type of an edge by its ID.
     * @param id - The ID of the edge to update.
     * @param edgeType - The new type for the edge.
     * @see {@link IWaldiezEdgeStore.updateEdgeType}
     */
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
                            type: edgeType,
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
    /**
     * Updates the path of an edge by its ID and agent type.
     * @param id - The ID of the edge to update.
     * @param agentType - The agent type to determine the edge color and style.
     * @see {@link IWaldiezEdgeStore.updateEdgePath}
     */
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
    /**
     * Adds a new edge to the store.
     * @param options - An object containing the flow ID, connection details, and whether the edge is hidden.
     * @returns The newly added WaldiezEdge object or null if the edge could not be created.
     * @see {@link IWaldiezEdgeStore.addEdge}
     */
    addEdge = (options: { flowId: string; connection: Connection; hidden: boolean }) => {
        const { flowId, connection, hidden } = options;
        const nodes = this.get().nodes as WaldiezNodeAgent[];
        const edges = this.get().edges;
        const positionGetter = (chatType: string) => edges.filter(edge => edge.type === chatType).length;
        const { source, target, sourceHandle, targetHandle } = connection;
        const { sourceNode, targetNode } = getNewEdgeNodes(nodes, source, target);
        if (!sourceNode || !targetNode) {
            // showSnackbar
            return null;
        }
        const newEdge = getNewEdge({
            flowId,
            hidden,
            sourceNode,
            targetNode,
            positionGetter,
            edges,
        });
        if (!newEdge) {
            return null;
        }
        this.set({
            edges: [...this.get().edges, { ...newEdge, sourceHandle, targetHandle }],
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
        const newStoredEdge = this.get().edges.find(edge => edge.id === newEdge.id);
        return (newStoredEdge ?? newEdge) as WaldiezEdge;
    };
    /**
     * Handles the double-click event on an edge.
     * If a dialog is open, it does nothing. Otherwise, it finds the flow root and triggers the appropriate modal button.
     * @param _event - The event object.
     * @param edge - The WaldiezEdge that was double-clicked.
     * @see {@link IWaldiezEdgeStore.onEdgeDoubleClick}
     */
    onEdgeDoubleClick = (_event: any, edge: WaldiezEdge) => {
        const openModals = Array.from(document.querySelectorAll(".modal-root .modal")).filter(
            el => (el.querySelector(".modal-content") as HTMLElement).offsetParent !== null, // Only visible modals
        );
        if (openModals.length > 0) {
            console.warn("Edge double-click ignored due to open modals");
            return;
        }
        const flowRoot = getFlowRoot(this.get().flowId);
        if (flowRoot) {
            const srcModalBtn = flowRoot.querySelector(
                `[data-edge-node-id="${edge.source}"]`,
            ) as HTMLButtonElement;

            if (srcModalBtn) {
                srcModalBtn.setAttribute("data-edge-id", edge.id);
                srcModalBtn.click();
            } else {
                const dstModalBtn = flowRoot.querySelector(
                    `[data-edge-node-id="${edge.target}"]`,
                ) as HTMLButtonElement;

                if (dstModalBtn) {
                    dstModalBtn.setAttribute("data-edge-id", edge.id);
                    dstModalBtn.click();
                }
            }
        }
    };
    /**
     * Retrieves the source agent of an edge.
     * @param edge - The WaldiezEdge to get the source agent from.
     * @returns The WaldiezNodeAgent if found, otherwise undefined.
     * @see {@link IWaldiezEdgeStore.getEdgeSourceAgent}
     */
    getEdgeSourceAgent = (edge: WaldiezEdge) => {
        const agent = this.get().nodes.find(node => node.id === edge.source);
        if (agent && agent.type === "agent") {
            return agent as WaldiezNodeAgent;
        }
        return undefined;
    };
    /**
     * Retrieves the target agent of an edge.
     * @param edge - The WaldiezEdge to get the target agent from.
     * @returns The WaldiezNodeAgent if found, otherwise undefined.
     * @see {@link IWaldiezEdgeStore.getEdgeTargetAgent}
     */
    getEdgeTargetAgent = (edge: WaldiezEdge) => {
        const agent = this.get().nodes.find(node => node.id === edge.target);
        if (agent && agent.type === "agent") {
            return agent as WaldiezNodeAgent;
        }
        return undefined;
    };
    /**
     * Handles the reconnection of an edge when the source or target node changes.
     * It updates the edge's source and target properties, and adjusts the edge's label if necessary.
     * @param oldEdge - The original edge that is being reconnected.
     * @param newConnection - The new connection details for the edge.
     * @see {@link IWaldiezEdgeStore.onReconnect}
     */
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
                        data: {
                            ...edge.data,
                            realSource: newSourceNode.id,
                            realTarget: newTargetNode.id,
                            sourceType: newSourceNode.data.agentType,
                            targetType: newTargetNode.data.agentType,
                        } as WaldiezEdge["data"],
                    };
                }),
            ],
            updatedAt: new Date().toISOString(),
        });
        this.resetEdgeOrdersAndPositions();
    };
    /**
     * Handles changes to edges, applying the changes to the current edges in the store.
     * @param changes - An array of EdgeChange objects representing the changes to apply.
     * @see {@link IWaldiezEdgeStore.onEdgesChange}
     */
    onEdgesChange = (changes: EdgeChange[]) => {
        const edges = applyEdgeChanges(changes, this.get().edges);
        this.set({ edges, updatedAt: new Date().toISOString() });
    };
    /**
     * Resets the edge orders and positions in the store.
     * This method is typically called after adding, deleting, or updating edges to ensure the order and positions are consistent.
     * @see {@link IWaldiezEdgeStore.resetEdgeOrdersAndPositions}
     */
    private resetEdgeOrdersAndPositions = () => {
        resetEdgeOrdersAndPositions(this.get, this.set);
    };
}
