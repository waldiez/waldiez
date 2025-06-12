/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ReactFlowInstance } from "@xyflow/react";

import { flowMapper } from "@waldiez/models";
import {
    loadFlow,
    reArrangeModels,
    reArrangeNodes,
    reArrangeTools,
    resetEdgeOrdersAndPositions,
    resetEdgePrerequisites,
    setViewPortTopLeft,
} from "@waldiez/store/utils";
import {
    IWaldiezFlowStore,
    ImportedFlow,
    ThingsToImport,
    WaldiezEdge,
    WaldiezFlowProps,
    WaldiezNodeType,
    typeOfGet,
    typeOfSet,
} from "@waldiez/types";
import { getId } from "@waldiez/utils";

/**
 * WaldiezFlowStore
 * A store for managing the flow state in Waldiez.
 * It provides methods to get and set flow information, manage nodes and edges,
 * handle viewport changes, and import/export flow data.
 * @see {@link IWaldiezFlowStore}
 */
export class WaldiezFlowStore implements IWaldiezFlowStore {
    private get: typeOfGet;
    private set: typeOfSet;
    /**
     * Creates an instance of WaldiezFlowStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    /**
     * Creates a new instance of WaldiezFlowStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     * @returns A new instance of WaldiezFlowStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezFlowStore(get, set);
    }
    /**
     * Gets the current flow state's viewport.
     * @returns The current viewport of the flow.
     * @see {@link IWaldiezFlowStore.viewport}
     */
    getViewport = () => this.get().viewport;
    /**
     * Gets the current flow state's react flow instance.
     * @returns The current ReactFlowInstance of the flow.
     * @see {@link IWaldiezFlowStore.getRfInstance}
     */
    getRfInstance = () => this.get().rfInstance;
    /**
     * Sets the current flow state's react flow instance.
     * @param instance - The ReactFlowInstance to set.
     * @returns void
     * @see {@link IWaldiezFlowStore.setRfInstance}
     */
    setRfInstance = (instance: ReactFlowInstance) => {
        const currentInstance = this.get().rfInstance;
        this.set({ rfInstance: instance });
        if (!currentInstance) {
            reArrangeModels(this.get, this.set);
            reArrangeTools(this.get, this.set);
        }
    };
    /**
     * Gets the current flow information.
     * @returns An object containing the flow's information.
     * @see {@link IWaldiezFlowStore.getFlowInfo}
     */
    getFlowInfo = () => {
        const {
            flowId,
            storageId,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            isAsync,
            cacheSeed,
        } = this.get();
        return {
            flowId,
            storageId: storageId ?? flowId,
            name: name ?? "Untitled Flow",
            description: description ?? "A new Waldiez flow",
            tags: tags ?? [],
            requirements: requirements ?? [],
            createdAt,
            updatedAt,
            isAsync: isAsync ?? false,
            cacheSeed: typeof cacheSeed !== "undefined" ? cacheSeed : 42,
        };
    };
    /**
     * Handles changes in the flow.
     * This method exports the current flow state and calls the onChange callback if provided.
     * @returns The exported flow state.
     * @see {@link IWaldiezFlowStore.onFlowChanged}
     */
    onFlowChanged = () => {
        const { onChange } = this.get();
        const exported = this.exportFlow(false);
        if (onChange) {
            onChange(JSON.stringify(exported));
        }
        return exported;
    };
    /**
     * Gets the flow edges, separating used and remaining edges.
     * Used edges are those with a defined order, while remaining edges do not have an order.
     * @returns An object containing used and remaining edges.
     * @see {@link IWaldiezFlowStore.getFlowEdges}
     */
    getFlowEdges = () => {
        const allEdges = this.get().edges.filter(edge => edge.type === "chat");
        const usedEdges = [] as WaldiezEdge[];
        const remainingEdges = [] as WaldiezEdge[];
        allEdges.forEach(edge => {
            let edgeOrder: number;
            if (typeof edge.data?.order === "number") {
                edgeOrder = edge.data.order;
            } else {
                edgeOrder = -1;
            }
            if (edgeOrder >= 0) {
                usedEdges.push(edge as WaldiezEdge);
            } else {
                remainingEdges.push(edge as WaldiezEdge);
            }
        });
        const sortedEdgesUsed = usedEdges.sort((a, b) => (a.data?.order ?? 0) - (b.data?.order ?? 0));
        return { used: sortedEdgesUsed, remaining: remainingEdges };
    };
    /**
     * Saves the current flow state.
     * This method calls the onSave callback with the exported flow data.
     * @returns void
     * @see {@link IWaldiezFlowStore.saveFlow}
     */
    saveFlow = () => {
        const { onSave } = this.get();
        if (typeof onSave === "function") {
            const exported = this.exportFlow(false);
            onSave(JSON.stringify(exported));
        }
    };
    /**
     * Handles changes in the viewport.
     * If the zoom level has changed, it rearranges nodes and sets the new viewport.
     * @param viewport - The new viewport object containing x, y, and zoom properties.
     * @param nodeType - The type of node being viewed (model or tool).
     * @returns void
     * @see {@link IWaldiezFlowStore.onViewportChange}
     */
    onViewportChange = (viewport: { x: number; y: number; zoom: number }, nodeType: WaldiezNodeType) => {
        if (nodeType === "model" || nodeType === "tool") {
            const zoomChanged = viewport.zoom !== this.get().viewport?.zoom;
            if (zoomChanged) {
                const { nodes, rfInstance, flowId } = this.get();
                this.set({
                    nodes: reArrangeNodes(nodes, flowId, nodeType, rfInstance),
                    updatedAt: new Date().toISOString(),
                });
                setTimeout(() => {
                    setViewPortTopLeft(this.get().rfInstance);
                    this.set({
                        viewport,
                    });
                }, 100);
            }
        } else {
            this.set({ viewport });
        }
    };
    /**
     * Imports a flow from the provided data.
     * This method loads the flow data, updates the current flow state, and rearranges nodes and edges.
     * It also fits the view of the React Flow instance after importing.
     * @param items - The items to import from.
     * @param flowData - The imported flow data.
     * @param typeShown - The type of node being shown (model or tool).
     * @returns void
     * @see {@link IWaldiezFlowStore.importFlow}
     */
    importFlow = (items: ThingsToImport, flowData: ImportedFlow, typeShown: WaldiezNodeType) => {
        const {
            storageId,
            name: currentName,
            description: currentDescription,
            tags: currentTags,
            requirements: currentRequirements,
            nodes: currentNodes,
            edges: currentEdges,
            isAsync: currentIsAsync,
            rfInstance,
        } = this.get();
        const currentFlow: ImportedFlow = {
            name: currentName ?? "Untitled Flow",
            description: currentDescription ?? "A new Waldiez flow",
            tags: currentTags ?? [],
            requirements: currentRequirements ?? [],
            nodes: currentNodes,
            edges: currentEdges,
            isAsync: currentIsAsync ?? false,
        };
        const { name, createdAt, description, tags, requirements, isAsync, nodes, edges } = loadFlow(
            items,
            currentFlow,
            flowData,
            typeShown,
        );
        this.set({
            name,
            description,
            tags,
            requirements,
            isAsync,
            storageId: storageId ?? `wf-${getId()}`,
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            nodes,
            edges,
        });
        resetEdgeOrdersAndPositions(this.get, this.set);
        reArrangeModels(this.get, this.set);
        reArrangeTools(this.get, this.set);
        setTimeout(() => {
            rfInstance?.fitView({
                includeHiddenNodes: false,
                padding: 0.2,
                duration: 100,
                // maxZoom: rfInstance?.getZoom(),
                // minZoom: rfInstance?.getZoom(),
            });
        }, 200);
    };
    /**
     * Exports the current flow state.
     * This method creates a flow object with the current state and returns it.
     * @param hideSecrets - A boolean indicating whether to hide secrets in the exported flow.
     * @returns The exported flow object.
     * @see {@link IWaldiezFlowStore.exportFlow}
     */
    exportFlow = (hideSecrets: boolean) => {
        const {
            isAsync,
            cacheSeed,
            viewport,
            rfInstance,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            flowId,
            storageId,
        } = this.get();
        const flow: WaldiezFlowProps = {
            nodes: this.get().nodes,
            edges: this.get().edges,
            viewport: rfInstance?.getViewport() ?? viewport ?? { zoom: 1, x: 20, y: 20 },
            name: name ?? "Untitled Flow",
            description: description ?? "A new Waldiez flow",
            tags: tags ?? [],
            requirements: requirements ?? [],
            createdAt: createdAt ?? new Date().toISOString(),
            updatedAt: updatedAt ?? new Date().toISOString(),
            flowId,
            storageId: storageId ?? flowId,
            isAsync: isAsync ?? false,
            cacheSeed,
        };
        return flowMapper.exportFlow(flow, hideSecrets, false);
    };
    /**
     * Updates the viewport of the flow.
     * This method sets the new viewport state and rearranges nodes if necessary.
     * @param viewport - The new viewport object containing x, y, and zoom properties.
     * @returns void
     * @see {@link IWaldiezFlowStore.updateViewport}
     */
    updateFlowOrder: (data: { id: string; order: number }[]) => void = data => {
        const updatedAt = new Date().toISOString();
        this.set({
            edges: this.get().edges.map(edge => {
                const order = data.find(d => d.id === edge.id)?.order ?? edge.data?.order ?? -1;
                return {
                    ...edge,
                    data: { ...edge.data, order },
                };
            }),
            updatedAt,
        });
    };
    /**
     * Updates the flow edges' prerequisites.
     * This method resets the prerequisites of the edges based on the provided edges.
     * @param edges - An array of WaldiezEdge objects to update prerequisites for.
     * @returns void
     * @see {@link IWaldiezFlowStore.updateFlowPrerequisites}
     */
    updateFlowPrerequisites: (edges: WaldiezEdge[]) => void = edges => {
        resetEdgePrerequisites(edges, this.get, this.set);
    };
    /**
     * Updates the information of the flow.
     * This method sets the new flow information such as name, description, tags, requirements, and other properties.
     * @param data - An object containing the new flow information.
     * @returns void
     * @see {@link IWaldiezFlowStore.updateFlowInfo}
     */
    updateFlowInfo: (data: {
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        isAsync: boolean;
        cacheSeed: number | null;
    }) => void = data => {
        this.set({
            name: data.name,
            description: data.description,
            tags: data.tags,
            requirements: data.requirements,
            updatedAt: new Date().toISOString(),
            isAsync: data.isAsync,
            cacheSeed: data.cacheSeed,
        });
    };
}
