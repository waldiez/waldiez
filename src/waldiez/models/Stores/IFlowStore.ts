/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ReactFlowInstance, Viewport } from "@xyflow/react";

import {
    ImportedFlow,
    ThingsToImport,
    WaldiezEdge,
    WaldiezFlow,
    WaldiezFlowInfo,
    WaldiezNodeType,
} from "@waldiez/types";

export interface IWaldiezFlowStore {
    getViewport: () => Viewport | undefined;
    getRfInstance: () => ReactFlowInstance | undefined;
    setRfInstance: (rfInstance: ReactFlowInstance) => void;
    getFlowInfo: () => WaldiezFlowInfo;
    onFlowChanged: () => WaldiezFlow;
    onViewportChange: (viewport: { x: number; y: number; zoom: number }, nodeType: WaldiezNodeType) => void;
    saveFlow: () => void;
    getFlowEdges: () => {
        used: WaldiezEdge[];
        remaining: WaldiezEdge[];
    };
    importFlow: (items: ThingsToImport, flowData: ImportedFlow, typeShown: WaldiezNodeType) => void;
    exportFlow: (hideSecrets: boolean, skipLinks: boolean) => WaldiezFlow;
    updateFlowOrder: (data: { id: string; order: number }[]) => void;
    updateFlowPrerequisites: (edges: WaldiezEdge[]) => void;
    updateFlowInfo: (data: {
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        isAsync: boolean;
        cacheSeed: number | null;
    }) => void;
}
