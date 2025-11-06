/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Edge, Node, ReactFlowInstance, Viewport } from "@xyflow/react";

import { type PropsWithChildren } from "react";

import type {
    IWaldiezAgentStore,
    IWaldiezChatParticipantsStore,
    IWaldiezEdgeStore,
    IWaldiezFlowStore,
    IWaldiezModelStore,
    IWaldiezNodeStore,
    IWaldiezToolStore,
} from "@waldiez/models/Stores";
import type { createWaldiezStore } from "@waldiez/store/creator";
import type { WaldiezBreakpoint } from "@waldiez/types";

export type { createWaldiezStore };

/**
 * WaldiezStoreProps
 * @param flowId - The ID of the flow
 * @param path - The path of the flow file
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onStepRun - The handler for step run events (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 */
export type WaldiezStoreProps = {
    flowId: string;
    path?: string | null;
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
    previousViewport?: Viewport; // used to store the previous viewport when switching node types
    onRun?: ((flow: string, path?: string | null) => void | Promise<void>) | null; // handler for running the flow (send to backend)
    onStepRun?:
        | ((
              flow: string,
              breakpoints?: (string | WaldiezBreakpoint)[],
              checkpoint?: string | null,
              path?: string | null,
          ) => void | Promise<void>)
        | null; // handler for running the flow in step-by-step mode (send to backend)
    onConvert?: ((flow: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>) | null; // handler for converting the flow (send to backend)
    onUpload?: ((files: File[], path?: string | null) => string[] | Promise<string[]>) | null; // handler for file uploads (send to backend)
    onChange?: ((content: string, path?: string | null) => void | Promise<void>) | null; // handler for changes in the flow (send to backend)
    onSave?: ((flow: string, path?: string | null) => void | Promise<void>) | null; // handler for saving the flow (send to backend)
    checkpoints?: {
        get: (flowName: string) => Promise<Record<string, any> | null>; // handler for getting previous checkpoints for the flow (send to backend)
        set?: (flowName: string, checkpoint: Record<string, any>) => Promise<void>; // handler for saving checkpoint for the flow (send to backend)
        delete?: (flowName: string, checkpoint: string, index?: number) => Promise<void>; // handler for deleting a checkpoint (or a checkpoint's history entry, send to backend)
    } | null;
};

/**
 * WaldiezFlowInfo
 * @param flowId - The ID of the flow
 * @param path - The path of the flow file
 * @param storageId - The ID of the storage
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param tags - The tags of the flow
 * @param requirements - The requirements of the flow
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 */
export type WaldiezFlowInfo = {
    flowId: string;
    path?: string | null;
    storageId: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    isAsync: boolean;
    cacheSeed: number | null;
};

/**
 * ImportedFlow
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 * @param tags - The tags of the flow
 * @param nodes - The nodes of the flow
 * @param edges - The edges of the flow
 */
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

/**
 * ThingsToImport
 * @param override - Whether to override the existing flow
 * @param everything - Whether to import everything
 * @param name - Whether to import the name
 * @param description - Whether to import the description
 * @param tags - Whether to import the tags
 * @param requirements - Whether to import the requirements
 * @param isAsync - Whether to import the async property
 * @param cacheSeed - Whether to import the cache seed
 * @param nodes - The nodes to import
 * @param edges - The edges to import
 */
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

export type WaldiezChatParticipantsState = {
    activeSenderId: string | null;
    activeRecipientId: string | null;
    activeEventType: string | null;
};

/**
 * WaldiezState
 * @param flowId - The ID of the flow
 * @param path - The path of the flow
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 * @param monacoVsPath - The path to the monaco vs code editor
 * @see {@link WaldiezStoreProps}
 * @see {@link IWaldiezToolStore}
 * @see {@link IWaldiezEdgeStore}
 * @see {@link IWaldiezModelStore}
 * @see {@link IWaldiezAgentStore}
 * @see {@link IWaldiezNodeStore}
 * @see {@link IWaldiezFlowStore}
 * @see {@link IWaldiezChatParticipantsStore}
 */
export type WaldiezState = WaldiezStoreProps &
    IWaldiezToolStore &
    IWaldiezEdgeStore &
    IWaldiezModelStore &
    IWaldiezAgentStore &
    IWaldiezNodeStore &
    IWaldiezFlowStore &
    WaldiezChatParticipantsState &
    IWaldiezChatParticipantsStore;

/**
 * typeOfSet
 * @param partial - The partial state to set
 * @param replace - Whether to replace the state or not
 * @see {@link WaldiezState}
 */
export type typeOfSet = {
    (
        partial:
            | WaldiezState
            | Partial<WaldiezState>
            | ((state: WaldiezState) => WaldiezState | Partial<WaldiezState>),
        replace?: false,
    ): void;
};
/**
 * typeOfGet
 * @see {@link WaldiezState}
 */
export type typeOfGet = () => WaldiezState;

/**
 * typeOfGetState
 * @see {@link WaldiezState}
 */
export type WaldiezStore = ReturnType<typeof createWaldiezStore>;

/**
 * WaldiezProviderProps
 * @param children - The children of the provider
 * @param flowId - The ID of the flow
 * @param edges - The edges of the flow
 * @param nodes - The nodes of the flow
 * @param isAsync - Whether the flow is async or not
 * @param isReadOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip the import of the flow
 * @param skipExport - Whether to skip the export of the flow
 * @param cacheSeed - The seed for the cache
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param requirements - The requirements of the flow
 * @param storageId - The ID of the storage
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 * @param tags - The tags of the flow
 * @param rfInstance - The react flow instance
 * @param viewport - The viewport of the flow
 * @param onRun - The handler for running the flow (send to backend)
 * @param onStepRun - The handler for step run events (send to backend)
 * @param onConvert - The handler for converting the flow (send to backend)
 * @param onUpload - The handler for file uploads (send to backend)
 * @param onChange - The handler for changes in the flow (send to backend)
 * @param onSave - The handler for saving the flow (send to backend)
 * @param monacoVsPath - The path to the monaco vs code editor
 */
export type WaldiezProviderProps = PropsWithChildren<WaldiezStoreProps>;
