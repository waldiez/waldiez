/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node, ReactFlowJsonObject, Viewport } from "@xyflow/react";

import type {
    WaldiezChatMessage,
    WaldiezContentItem,
    WaldiezMessageBase,
    WaldiezMessageData,
    WaldiezPreviousMessage,
} from "@waldiez/components/types";

export type * from "@waldiez/models";
export type * from "@waldiez/store";
export type {
    WaldiezChatMessage,
    WaldiezContentItem,
    WaldiezMessageBase,
    WaldiezMessageData,
    WaldiezPreviousMessage,
};

/**
 * WaldiezUserInput
 * @param id - The id of the user input
 * @param type - The type of the user input
 * @param request_id - The id of the request
 * @param data - The data of the user input
 */
export type WaldiezUserInput = {
    id: string;
    type: "input_response";
    request_id: string;
    data: {
        text?: string | null;
        image?: string | File | null;
        // to add more types here in the future (audio?)
    };
};

/**
 * WaldiezFlowProps
 * @param flowId - The id of the flow
 * @param isAsync - Whether the flow is async or not
 * @param cacheSeed - The seed for the cache
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
 * @param inputPrompt - The input prompt for the flow. See {@link WaldiezPreviousMessage}
 * @param readOnly - Whether the flow is read only or not
 * @param skipImport - Whether to skip import or not
 * @param skipExport - Whether to skip export or not
 * @param skipHub - Whether to skip hub or not
 * @param onUpload - The function to call when uploading files
 * @param onChange - The function to call when changing the flow
 * @param onRun - The function to call when running the flow
 * @param onUserInput - The function to call when user input is required. See {@link WaldiezUserInput}
 * @param onConvert - The function to call when converting the flow
 * @param onSave - The function to call when saving the flow
 */
export type WaldiezProps = WaldiezFlowProps & {
    nodes: Node[];
    edges: Edge[];
    viewport?: Viewport;
    monacoVsPath?: string | null;
    inputPrompt?: {
        previousMessages: WaldiezPreviousMessage[];
        request_id: string;
        prompt: string;
        userParticipants: Set<string>;
    } | null;
    readOnly?: boolean | null;
    skipImport?: boolean | null;
    skipExport?: boolean | null;
    skipHub?: boolean | null;
    onUpload?: ((files: File[]) => Promise<string[]>) | null;
    onChange?: ((flow: string) => void) | null;
    onRun?: ((flow: string) => void) | null;
    onUserInput?: ((input: WaldiezUserInput) => void) | null;
    onConvert?: ((flow: string, to: "py" | "ipynb") => void) | null;
    onSave?: ((flow: string) => void) | null;
};
