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

export class WaldiezFlowStore implements IWaldiezFlowStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }

    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezFlowStore(get, set);
    }
    getViewport = () => this.get().viewport;
    getRfInstance = () => this.get().rfInstance;
    setRfInstance = (instance: ReactFlowInstance) => {
        const currentInstance = this.get().rfInstance;
        this.set({ rfInstance: instance });
        if (!currentInstance) {
            reArrangeModels(this.get, this.set);
            reArrangeTools(this.get, this.set);
        }
    };
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
            cacheSeed: typeof cacheSeed !== "undefined" ? cacheSeed : 41,
        };
    };
    onFlowChanged = () => {
        const { onChange } = this.get();
        const exported = this.exportFlow(false);
        if (onChange) {
            onChange(JSON.stringify(exported));
        }
        return exported;
    };
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
    saveFlow = () => {
        const { onSave } = this.get();
        if (typeof onSave === "function") {
            const exported = this.exportFlow(false);
            onSave(JSON.stringify(exported));
        }
    };
    onViewportChange = (viewport: { x: number; y: number; zoom: number }, nodeType: WaldiezNodeType) => {
        const zoomChanged = viewport.zoom !== this.get().viewport?.zoom;
        if (zoomChanged) {
            if (nodeType === "model" || nodeType === "tool") {
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
                maxZoom: rfInstance?.getZoom(),
                minZoom: rfInstance?.getZoom(),
            });
        }, 100);
    };
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
    updateFlowPrerequisites: (edges: WaldiezEdge[]) => void = edges => {
        resetEdgePrerequisites(edges, this.get, this.set);
    };
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
