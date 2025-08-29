/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable tsdoc/syntax */
import type { ReactFlowInstance, Viewport } from "@xyflow/react";

import type {
    ImportedFlow,
    ThingsToImport,
    WaldiezEdge,
    WaldiezFlow,
    WaldiezFlowInfo,
    WaldiezNodeType,
} from "@waldiez/types";

export interface IWaldiezFlowStore {
    /**
     * Get the Viewport of the flow.
     * @returns The Viewport of the flow if available, otherwise undefined.
     */
    getViewport: () => Viewport | undefined;
    /**
     * Get the ReactFlowInstance of the flow.
     * @returns The ReactFlowInstance of the flow if available, otherwise undefined.
     */
    getRfInstance: () => ReactFlowInstance | undefined;
    /**
     * Set the ReactFlowInstance of the flow.
     * @param rfInstance - The ReactFlowInstance to set.
     */
    setRfInstance: (rfInstance: ReactFlowInstance) => void;
    /**
     * Get the flow information.
     * @returns The flow information.
     * @see {@link WaldiezFlowInfo}
     */
    getFlowInfo: () => WaldiezFlowInfo;
    /** Callback function to handle flow changes.
     * @returns The current flow.
     * @see {@link WaldiezFlow}
     */
    onFlowChanged: () => WaldiezFlow;
    /**
     * Callback function to handle viewport changes.
     * @param viewport - The new viewport data.
     * @param nodeType - The type of the node.
     * @see {@link WaldiezNodeType}
     */
    onViewportChange: (viewport: { x: number; y: number; zoom: number }, nodeType: WaldiezNodeType) => void;
    /**
     * Save the current flow.
     * @returns The saved flow.
     * @see {@link WaldiezFlow}
     */
    saveFlow: () => void;
    /**
     * Get the flow edges.
     * @returns An object containing used and remaining edges.
     * @see {@link WaldiezEdge}
     */
    getFlowEdges: () => {
        used: WaldiezEdge[];
        remaining: WaldiezEdge[];
    };
    /**
     * Import a flow into the store.
     * @param items - The items to import.
     * @param flowData - The flow data to import.
     * @param typeShown - The type of the node to show.
     * @see {@link ThingsToImport}
     * @see {@link ImportedFlow}
     * @see {@link WaldiezNodeType}
     */
    importFlow: (items: ThingsToImport, flowData: ImportedFlow, typeShown: WaldiezNodeType) => void;
    /**
     * Export the current flow.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @param skipLinks - Whether to skip links in the exported data.
     * @returns The exported flow.
     * @see {@link WaldiezFlow}
     */
    exportFlow: (hideSecrets: boolean, skipLinks: boolean) => WaldiezFlow;
    /**
     * Update the flow order.
     * @param data - An array of objects containing the ID and order of the flow.
     * @param data.id - The ID of the flow.
     * @param data.order - The order of the flow.
     */
    updateFlowOrder: (data: { id: string; order: number }[]) => void;
    /**
     * Update the flow prerequisites.
     * @param edges - An array of edges to update the prerequisites.
     * @see {@link WaldiezEdge}
     */
    updateFlowPrerequisites: (edges: WaldiezEdge[]) => void;
    /**
     * Update the flow information.
     * @param data - The new flow information.
     * @param data.name - The name of the flow.
     * @param data.description - The description of the flow.
     * @param data.tags - An array of tags for the flow.
     * @param data.requirements - An array of requirements for the flow.
     * @param data.isAsync - Whether the flow is asynchronous.
     * @param data.cacheSeed - The cache seed for the flow.
     */
    updateFlowInfo: (data: {
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        isAsync: boolean;
        cacheSeed: number | null;
    }) => void;
}
