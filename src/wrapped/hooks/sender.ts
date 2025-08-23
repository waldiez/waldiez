/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { WaldiezChatUserInput } from "@waldiez/components/chatUI/types";
import { WaldiezDebugInputResponse } from "@waldiez/components/stepByStep/types";

export function useWebSocketSender(opts: {
    sendJson: (msg: unknown) => boolean;
    getSessionId: () => string | undefined;
    getPendingInputId: () => string | undefined;
    clearPendingInput: () => void;
    defaultStructuredIO?: boolean;
}) {
    const { sendJson, getSessionId, getPendingInputId, clearPendingInput, defaultStructuredIO = true } = opts;

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

    const sendDebugControl = useCallback(
        (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => {
            sendJson({
                type: "step_control",
                action: input.data,
                request_id: input.request_id,
                session_id: getSessionId() ?? "<unknown>",
            });
        },
        [sendJson, getSessionId],
    );

    const sendDebugUserInput = useCallback(
        (input: WaldiezChatUserInput & { session_id?: string }) => {
            const sid = input.session_id ?? getSessionId();
            const rid = input.request_id ?? getPendingInputId();
            clearPendingInput();
            sendJson({
                type: "user_input",
                session_id: sid,
                data: input.data,
                request_id: rid,
            });
        },
        [getSessionId, getPendingInputId, clearPendingInput, sendJson],
    );

    const sendUserInput = useCallback(
        (input: WaldiezChatUserInput & { session_id?: string }) => {
            const sid = input.session_id ?? getSessionId();
            const rid = input.request_id ?? getPendingInputId();
            clearPendingInput();
            if (!sid || !rid) {
                return false;
            }
            return sendJson({ type: "user_input", session_id: sid, request_id: rid, data: input.data });
        },
        [sendJson, getSessionId, getPendingInputId, clearPendingInput],
    );

    const stopWorkflow = useCallback(
        (sessionId?: string, force = false) => {
            const sid = sessionId ?? getSessionId();
            if (!sid) {
                return false;
            }
            return sendJson({ type: "stop_workflow", session_id: sid, force });
        },
        [sendJson, getSessionId],
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
            return sendJson({ type: "get_status", session_id: sessionId ?? getSessionId() ?? null });
        },
        [sendJson, getSessionId],
    );

    const ping = useCallback(
        (echo_data?: any) => {
            sendJson({ type: "ping", echo_data: echo_data ?? { t: Date.now() } });
        },
        [sendJson],
    );

    return {
        runWorkflow,
        stepRunWorkflow,
        sendDebugControl,
        sendDebugUserInput,
        sendUserInput,
        stopWorkflow,
        saveFlow,
        convertWorkflow,
        uploadFiles,
        getStatus,
        ping,
    };
}
