/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node, ReactFlowJsonObject, Viewport } from "@xyflow/react";

import { WaldiezChatConfig } from "@waldiez/components/types";

export type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatContent,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatMessageCommon,
    WaldiezChatMessageType,
    WaldiezChatUserInput,
    WaldiezMediaConfig,
    WaldiezMediaContent,
    WaldiezMediaType,
    WaldiezStreamEvent,
} from "@waldiez/components/types";
export type * from "@waldiez/models";
export type * from "@waldiez/store";
export type * from "@waldiez/utils/chat/types";

/**
 * WaldiezFlowProps
 * @param flowId - The id of the flow
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
 * @param silent - Whether the flow is silent or not
 * @param storageId - The id of the storage
 * @param name - The name of the flow
 * @param description - The description of the flow
 * @param tags - The tags of the flow
 * @param requirements - The requirements of the flow
 * @param viewport - The viewport of the flow
 * @param createdAt - The creation date of the flow (as ISO 8601 string)
 * @param updatedAt - The update date of the flow (as ISO 8601 string)
 */
export type WaldiezFlowProps = ReactFlowJsonObject & {
    flowId: string;
    isAsync?: boolean;
    cacheSeed?: number | null;
    silent?: boolean;
    storageId: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    viewport?: Viewport;
    createdAt?: string;
    updatedAt?: string;
};

/**
 * WaldiezProps
 * @param nodes - The nodes of the flow
 * @param edges - The edges of the flow
 * @param viewport - The viewport of the flow
 * @param monacoVsPath - The path to the monaco vs code editor
 * @param chat - The chat configuration
 * @param readOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip import or not
 * @param skipExport - Whether to skip export or not
 * @param skipHub - Whether to skip hub or not
 * @param onUpload - The function to call when uploading files
 * @param onChange - The function to call when changing the flow
 * @param onRun - The function to call when running the flow
 * @param onConvert - The function to call when converting the flow
 * @param onSave - The function to call when saving the flow
 * @see {@link WaldiezFlowProps}
 * @see {@link WaldiezChatConfig}
 */
export type WaldiezProps = WaldiezFlowProps & {
    nodes: Node[];
    edges: Edge[];
    viewport?: Viewport;
    monacoVsPath?: string;
    chat?: WaldiezChatConfig;
    readOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
    onUpload?: (files: File[]) => Promise<string[]>;
    onChange?: (flow: string) => void;
    onRun?: (flow: string) => void;
    onConvert?: (flow: string, to: "py" | "ipynb") => void;
    onSave?: (flow: string) => void;
};
