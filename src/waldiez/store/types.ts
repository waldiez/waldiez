/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node, ReactFlowInstance, Viewport } from "@xyflow/react";

import { createWaldiezStore } from "@waldiez/store/creator";
import {
    IWaldiezAgentStore,
    IWaldiezEdgeStore,
    IWaldiezFlowStore,
    IWaldiezModelStore,
    IWaldiezNodeStore,
    IWaldiezToolStore,
} from "@waldiez/types";

export { createWaldiezStore };

export type WaldiezStoreProps = {
    flowId: string;
    edges: Edge[];
    nodes: Node[];
    isAsync?: boolean;
    isReadOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    cacheSeed?: number | null;
    name?: string;
    description?: string;
    requirements?: string[];
    storageId?: string;
    createdAt?: string;
    updatedAt?: string;
    tags?: string[];
    rfInstance?: ReactFlowInstance;
    viewport?: Viewport;
    onRun?: ((flow: string) => void) | null; // handler for running the flow (send to backend
    onConvert?: ((flow: string, to: "py" | "ipynb") => void) | null; // handler for converting the flow (send to backend)
    onUpload?: ((files: File[]) => Promise<string[]>) | null; // handler for file uploads (send to backend)
    onChange?: ((content: string) => void) | null; // handler for changes in the flow (send to backend)
    onSave?: ((flow: string) => void) | null; // handler for saving the flow (send to backend)
};

export type WaldiezFlowInfo = {
    flowId: string;
    storageId: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    isAsync: boolean;
    cacheSeed: number | null;
};

export type ImportedFlow = {
    name: string;
    description: string;
    requirements: string[];
    createdAt?: string;
    updatedAt?: string;
    isAsync?: boolean;
    cacheSeed?: number | null;
    tags: string[];
    nodes: Node[];
    edges: Edge[];
};

export type ThingsToImport = {
    override: boolean;
    everything: boolean;
    name: boolean;
    description: boolean;
    tags: boolean;
    requirements: boolean;
    isAsync: boolean;
    cacheSeed?: boolean | null;
    nodes: {
        models: Node[];
        tools: Node[];
        agents: Node[];
    };
    edges: Edge[];
};
export type WaldiezState = WaldiezStoreProps &
    IWaldiezToolStore &
    IWaldiezEdgeStore &
    IWaldiezModelStore &
    IWaldiezAgentStore &
    IWaldiezNodeStore &
    IWaldiezFlowStore;

export type typeOfSet = {
    (
        partial:
            | WaldiezState
            | Partial<WaldiezState>
            | ((state: WaldiezState) => WaldiezState | Partial<WaldiezState>),
        replace?: false,
    ): void;
};
export type typeOfGet = () => WaldiezState;
export type WaldiezStore = ReturnType<typeof createWaldiezStore>;
export type WaldiezProviderProps = React.PropsWithChildren<WaldiezStoreProps>;
