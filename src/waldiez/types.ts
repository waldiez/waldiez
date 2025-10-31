/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Edge, Node, ReactFlowJsonObject, Viewport } from "@xyflow/react";

import type { WaldiezBreakpoint, WaldiezChatConfig, WaldiezStepByStep } from "@waldiez/components/types";

export type * from "@waldiez/components/types";
export type * from "@waldiez/models/types";
export type * from "@waldiez/store/types";
export type * from "@waldiez/utils/chat/types";
export type * from "@waldiez/utils/stepByStep/types";
export type EventType =
    | "post_carryover_processing"
    | "group_chat_run_chat"
    | "using_auto_reply"
    | "tool_call"
    | "execute_function"
    | "executed_function"
    | "input_request"
    | "tool_response"
    | "termination"
    | "run_completion"
    | "generate_code_execution_reply"
    | "group_chat_resume"
    | "error"
    | "termination_and_human_reply_no_input";

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
 * @param stepByStep - The step-by-step configuration
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
    stepByStep?: WaldiezStepByStep;
    readOnly?: boolean;
    skipImport?: boolean;
    skipExport?: boolean;
    skipHub?: boolean;
    onUpload?: (files: File[]) => Promise<string[]>;
    onChange?: (flow: string) => void;
    onRun?: (flow: string, path?: string | null) => void;
    onStepRun?: (
        flow: string,
        breakpoints?: (string | WaldiezBreakpoint)[],
        checkpoint?: string | null,
        path?: string | null,
    ) => void;
    onConvert?: (flow: string, to: "py" | "ipynb", path?: string | null) => void;
    onSave?: (flow: string, path?: string | null) => void;
    checkpoints?: {
        get: (flowName: string) => Promise<Record<string, any> | null>;
        submit: (flowName: string, checkpoint: Record<string, any>) => Promise<void>;
    };
};
