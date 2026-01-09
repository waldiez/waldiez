/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */

type ExecMode = "standard" | "step_by_step";

export type ServerMessage =
    | { type: "run_response"; success: boolean; session_id: string; error?: string }
    | {
          type: "step_run_response";
          success: boolean;
          session_id: string;
          auto_continue: boolean;
          breakpoints: string[];
          error?: string;
      }
    | {
          type: "stop_response";
          success: boolean;
          session_id: string;
          error?: string;
          forced?: boolean;
      }
    | {
          type: "convert_response";
          success: boolean;
          data?: string;
          format: "py" | "ipynb";
          path?: string;
          error?: string;
      }
    | { type: "save_response"; success: boolean; file_path?: string; error?: string }
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
          mode: ExecMode;
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

export type SaveFlowResponseMsg = {
    type: "save_response";
    success: boolean;
    error?: string;
    file_path?: string;
};

export type ConvertWorkflowResponseMsg = {
    type: "convert_response";
    success: boolean;
    error?: string;
    data?: string;
    path?: string;
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
    return m?.type === "save_response" && typeof (m as any).success === "boolean";
}

export function isConvertWorkflowResponse(m: ServerMessage): m is ConvertWorkflowResponseMsg {
    return m?.type === "convert_response" && typeof (m as any).success === "boolean";
}

export function isErrorResponse(m: ServerMessage): m is ErrorResponseMsg {
    return m?.type === "error" && m && typeof (m as any).success === "boolean";
}

export function isSubprocessOutput(m: ServerMessage): m is SubprocessOutputMsg {
    return m?.type === "subprocess_output" && typeof (m as any).content === "string";
}
