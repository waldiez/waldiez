/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezStepByStep } from "@waldiez/components/stepByStep/types";
import type {
    WaldiezChatMessage,
    WaldiezChatParticipant,
    WaldiezChatUserInput,
    WaldiezTimelineData,
} from "@waldiez/types";

type ExecMode = "standard" | "step_by_step";

export type ServerMessage =
    | { type: "run_workflow_response"; success: boolean; session_id: string; error?: string }
    | {
          type: "step_run_workflow_response";
          success: boolean;
          session_id: string;
          auto_continue: boolean;
          breakpoints: string[];
          error?: string;
      }
    | {
          type: "stop_workflow_response";
          success: boolean;
          session_id: string;
          error?: string;
          forced?: boolean;
      }
    | {
          type: "convert_workflow_response";
          success: boolean;
          converted_data?: string;
          target_format: "py" | "ipynb";
          output_path?: string;
          error?: string;
      }
    | { type: "save_flow_response"; success: boolean; file_path?: string; error?: string }
    | {
          type: "upload_file_response";
          success: boolean;
          file_path?: string;
          file_size?: number;
          error?: string;
      }
    | {
          type: "status_response";
          success: boolean;
          server_status: any;
          workflow_status?: string | null;
          session_id?: string | null;
      }
    | { type: "pong"; success: boolean; echo_data: any; server_time: number }
    | { type: "error"; success: false; error_code: number; error_type: string; error: string; details?: any }
    // notifications
    | {
          type: "input_request";
          session_id: string;
          request_id: string;
          prompt: string;
          password?: boolean;
          timeout?: number;
      }
    | {
          type: "workflow_status";
          session_id: string;
          status: string;
          execution_mode: ExecMode;
          details?: string;
      }
    | {
          type: "workflow_completion";
          session_id: string;
          success: boolean;
          exit_code?: number;
          results?: any[];
          execution_time?: number;
          error?: string;
      }
    | {
          type: "subprocess_output";
          session_id: string;
          stream: "stdout" | "stderr";
          content: string;
          subprocess_type?: "output" | "error" | "debug";
          context?: any;
      }
    | {
          type: "subprocess_completion";
          session_id: string;
          success: boolean;
          exit_code: number;
          message: string;
          context?: any;
      }
    | { type: "step_debug"; session_id: string; debug_type: "stats" | "help" | "error" | "info"; data: any }
    | {
          type: "breakpoint_notification";
          session_id: string;
          action: "added" | "removed" | "cleared" | "list";
          event_type?: string | null;
          breakpoints?: string[];
          message?: string;
      }
    | {
          type: "connection";
          status: "connected" | "disconnected" | "error";
          client_id: string;
          server_time: number;
          message?: string;
      }
    | { type: string; [k: string]: any }; // catch-all for chat processor

export type WaldiezWrapperState = {
    timeline?: WaldiezTimelineData;
    messages: WaldiezChatMessage[];
    participants: WaldiezChatParticipant[];
    isRunning: boolean;
    isDebugging: boolean;
    connected: boolean;
    error: string | null;
    inputPrompt?: { prompt: string; request_id: string; password?: boolean };
    stepByStepState: WaldiezStepByStep;
};

export type WaldiezWrapperActions = {
    run: (flowJson: string) => void;
    stepRun: (flowJson: string, opts?: { auto_continue?: boolean; breakpoints?: string[] }) => void;
    stop: () => void;
    save: (flowJson: string, filename?: string, forceOverwrite?: boolean) => void;
    upload: (files: File[]) => Promise<string[]>;
    convert: (flowJson: string, to: "py" | "ipynb", outputPath?: string | null) => void;
    userInput: (input: WaldiezChatUserInput) => void;
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
