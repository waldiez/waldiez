/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useRef, useState } from "react";

import { WaldiezChatUserInput } from "@waldiez/components/chatUI/types";

type ExecMode = "standard" | "step_by_step";

type ServerMessage =
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
      };

export function useWebSocketActions(opts: {
    sendJson: (msg: unknown) => boolean;
    onMsg?: (msg: ServerMessage) => void; // bubble parsed messages to UI
    setPrompt?: (p?: {
        sessionId: string;
        requestId: string;
        prompt: string;
        password?: boolean;
        timeout?: number;
    }) => void;
    onSession?: (sessionId?: string) => void; // notify when session changes
    defaultStructuredIO?: boolean; // for convert/export defaults
}) {
    const { sendJson, onMsg, setPrompt, onSession, defaultStructuredIO = true } = opts;

    const sessionIdRef = useRef<string | undefined>(undefined);
    const pendingInputIdRef = useRef<string | undefined>(undefined);
    const [isRunning, setIsRunning] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);

    // message pump (call this from your useWebsocket.onWsMessage)
    const handleIncoming = useCallback(
        (event: MessageEvent) => {
            let msg: ServerMessage | undefined;
            console.debug("WebSocket message received:", event.data);
            try {
                msg = JSON.parse(event.data);
            } catch {
                return;
            }
            if (!msg || typeof msg !== "object" || !("type" in msg)) {
                return;
            }

            onMsg?.(msg);

            switch (msg.type) {
                case "run_workflow_response":
                    if (msg.success) {
                        sessionIdRef.current = msg.session_id;
                        onSession?.(msg.session_id);
                        setIsRunning(true);
                    }
                    break;

                case "step_run_workflow_response":
                    if (msg.success) {
                        sessionIdRef.current = msg.session_id;
                        onSession?.(msg.session_id);
                        setIsDebugging(true);
                    }
                    break;

                case "workflow_completion":
                case "subprocess_completion":
                    setIsRunning(false);
                    setIsDebugging(false);
                    pendingInputIdRef.current = undefined;
                    break;

                case "input_request":
                    sessionIdRef.current = msg.session_id; // ensure we have it
                    pendingInputIdRef.current = msg.request_id;
                    setPrompt?.({
                        sessionId: msg.session_id,
                        requestId: msg.request_id,
                        prompt: msg.prompt,
                        password: msg.password,
                        timeout: msg.timeout,
                    });
                    break;

                case "error":
                    // you might want to surface this in UI
                    break;
            }
        },
        [onMsg, onSession, setPrompt],
    );

    // actions
    const runWorkflow = useCallback(
        (
            flow_data: string,
            opts?: {
                uploads_root?: string | null;
                dot_env_path?: string | null;
                output_path?: string | null;
                structured_io?: boolean;
            },
        ) => {
            setIsRunning(true);
            return sendJson({
                type: "run_workflow",
                flow_data,
                execution_mode: "standard",
                structured_io: opts?.structured_io ?? defaultStructuredIO,
                uploads_root: opts?.uploads_root ?? null,
                dot_env_path: opts?.dot_env_path ?? null,
                output_path: opts?.output_path ?? null,
            });
        },
        [sendJson, defaultStructuredIO],
    );

    const stepRunWorkflow = useCallback(
        (
            flow_data: string,
            opts?: {
                auto_continue?: boolean;
                breakpoints?: string[];
                uploads_root?: string | null;
                dot_env_path?: string | null;
                output_path?: string | null;
                structured_io?: boolean;
            },
        ) => {
            setIsDebugging(true);
            return sendJson({
                type: "step_run_workflow",
                flow_data,
                auto_continue: !!opts?.auto_continue,
                breakpoints: opts?.breakpoints ?? [],
                structured_io: opts?.structured_io ?? defaultStructuredIO,
                uploads_root: opts?.uploads_root ?? null,
                dot_env_path: opts?.dot_env_path ?? null,
                output_path: opts?.output_path ?? null,
            });
        },
        [sendJson, defaultStructuredIO],
    );

    const stepControl = useCallback(
        (action: "continue" | "step" | "run" | "quit" | "info" | "help" | "stats", sessionId?: string) => {
            const sid = sessionId ?? sessionIdRef.current;
            if (!sid) {
                return false;
            }
            return sendJson({ type: "step_control", action, session_id: sid });
        },
        [sendJson],
    );

    const breakpointControl = useCallback(
        (action: "add" | "remove" | "list" | "clear", event_type?: string, sessionId?: string) => {
            const sid = sessionId ?? sessionIdRef.current;
            if (!sid) {
                return false;
            }
            return sendJson({ type: "breakpoint_control", action, event_type, session_id: sid });
        },
        [sendJson],
    );

    const sendUserInput = useCallback(
        (input: WaldiezChatUserInput & { sessionId?: string }) => {
            const sid = input.sessionId ?? sessionIdRef.current;
            const rid = input.requestId ?? pendingInputIdRef.current;
            if (!sid || !rid) {
                return false;
            }
            pendingInputIdRef.current = undefined;
            setPrompt?.(undefined);
            return sendJson({ type: "user_input", session_id: sid, request_id: rid, data: input.data });
        },
        [sendJson, setPrompt],
    );

    const stopWorkflow = useCallback(
        (sessionId?: string, force = false) => {
            const sid = sessionId ?? sessionIdRef.current;
            if (!sid) {
                return false;
            }
            return sendJson({ type: "stop_workflow", session_id: sid, force });
        },
        [sendJson],
    );

    const saveFlow = useCallback(
        (flow_data: string, filename?: string, force_overwrite = false) => {
            return sendJson({ type: "save_flow", flow_data, filename, force_overwrite });
        },
        [sendJson],
    );

    const convertWorkflow = useCallback(
        (flow_data: string, target_format: "py" | "ipynb", output_path?: string | null) => {
            return sendJson({
                type: "convert_workflow",
                flow_data,
                target_format,
                output_path: output_path ?? null,
            });
        },
        [sendJson],
    );

    const uploadFiles = useCallback(
        async (files: File[]) => {
            // send one-by-one; server API is single-file
            const uploaded: string[] = [];
            for (const file of files) {
                const base64 = await file.arrayBuffer().then(b => {
                    let s = "";
                    const bytes = new Uint8Array(b);
                    const chunk = 0x8000;
                    for (let i = 0; i < bytes.length; i += chunk) {
                        s += String.fromCharCode.apply(
                            null,
                            bytes.subarray(i, i + chunk) as unknown as number[],
                        );
                    }
                    return btoa(s);
                });
                sendJson({
                    type: "upload_file",
                    filename: file.name,
                    file_data: base64,
                    file_size: file.size,
                    mime_type: file.type || undefined,
                });
            }
            return uploaded;
        },
        [sendJson],
    );

    const getStatus = useCallback(
        (sessionId?: string) => {
            return sendJson({ type: "get_status", session_id: sessionId ?? sessionIdRef.current ?? null });
        },
        [sendJson],
    );

    const ping = useCallback(
        (echo_data?: any) => {
            return sendJson({ type: "ping", echo_data: echo_data ?? { t: Date.now() } });
        },
        [sendJson],
    );

    return {
        // state
        isRunning,
        isDebugging,
        // session ids
        getSessionId: () => sessionIdRef.current,
        // wire this to useWebsocket.onWsMessage
        handleIncoming,
        // actions
        runWorkflow,
        stepRunWorkflow,
        stepControl,
        breakpointControl,
        sendUserInput,
        stopWorkflow,
        saveFlow,
        convertWorkflow,
        uploadFiles,
        getStatus,
        ping,
    };
}
