/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatMessage, WaldiezChatUserInput, WaldiezTimelineData } from "@waldiez/types";

export type ServerMessage =
    | { type: "save_flow_response"; success: boolean; error?: string; file_path?: string }
    | {
          type: "convert_workflow_response";
          success: boolean;
          error?: string;
          converted_data?: string;
          output_path?: string;
      }
    | { type: "error"; success: false; error?: string; error_type?: string; details?: any }
    | {
          type: "input_request";
          session_id: string;
          request_id: string;
          prompt: string;
          password?: boolean;
          timeout?: number;
      }
    | { type: "subprocess_output"; session_id: string; stream: "stdout" | "stderr"; content: string }
    | {
          type: "workflow_completion";
          session_id: string;
          success: boolean;
          exit_code?: number;
          error?: string;
      }
    | {
          type: "subprocess_completion";
          session_id: string;
          success: boolean;
          exit_code: number;
          message: string;
      }
    | { type: string; [k: string]: any }; // catch-all for chat processor

export type WaldiezWrapperState = {
    timeline?: WaldiezTimelineData;
    messages: WaldiezChatMessage[];
    userParticipants: string[];
    isRunning: boolean;
    isDebugging: boolean;
    connected: boolean;
    error: string | null;
    inputPrompt?: { prompt: string; request_id: string; password?: boolean };
};

export type WaldiezWrapperActions = {
    handleRun: (flowJson: string) => void;
    handleStepRun: (flowJson: string, opts?: { auto_continue?: boolean; breakpoints?: string[] }) => void;
    handleStop: () => void;
    handleSave: (flowJson: string, filename?: string, forceOverwrite?: boolean) => void;
    handleUpload: (files: File[]) => Promise<string[]>;
    handleConvert: (flowJson: string, to: "py" | "ipynb", outputPath?: string | null) => void;
    handleUserInput: (input: WaldiezChatUserInput) => void;
    sendMessage: (raw: unknown) => boolean; // raw passthrough if you need it
    reset: () => void;
};

export type SaveFlowResponseMsg = {
    type: "save_flow_response";
    success: boolean;
    error?: string;
    file_path?: string;
};

export type ConvertWorkflowResponseMsg = {
    type: "convert_workflow_response";
    success: boolean;
    error?: string;
    converted_data?: string;
    output_path?: string;
};

export type ErrorResponseMsg = {
    type: "error";
    success: false;
    error?: string;
    error_type?: string;
    details?: any;
};

export type SubprocessOutputMsg = {
    type: "subprocess_output";
    session_id: string;
    stream: "stdout" | "stderr";
    content: string;
};

export function isSaveFlowResponse(m: ServerMessage): m is SaveFlowResponseMsg {
    return m?.type === "save_flow_response" && typeof (m as any).success === "boolean";
}

export function isConvertWorkflowResponse(m: ServerMessage): m is ConvertWorkflowResponseMsg {
    return m?.type === "convert_workflow_response" && typeof (m as any).success === "boolean";
}

export function isErrorResponse(m: ServerMessage): m is ErrorResponseMsg {
    return m?.type === "error" && m && typeof (m as any).success === "boolean";
}

export function isSubprocessOutput(m: ServerMessage): m is SubprocessOutputMsg {
    return m?.type === "subprocess_output" && typeof (m as any).content === "string";
}
