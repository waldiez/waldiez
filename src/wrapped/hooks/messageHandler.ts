/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useRef } from "react";

import { ServerMessage } from "./types";

export type MessageHandlerCallbacks = {
    onSessionUpdate?: (sessionId: string) => void;
    onRunStart?: () => void;
    onDebugStart?: () => void;
    onWorkflowComplete?: () => void;
    onInputRequest?: (requestId: string) => void;
    onError?: (error: string) => void;
};

export function useMessageHandler(callbacks: MessageHandlerCallbacks = {}) {
    const { onSessionUpdate, onRunStart, onDebugStart, onWorkflowComplete, onInputRequest, onError } =
        callbacks;

    const sessionIdRef = useRef<string | undefined>(undefined);
    const pendingInputIdRef = useRef<string | undefined>(undefined);

    const handleMessage = useCallback(
        // eslint-disable-next-line complexity
        (msg: ServerMessage) => {
            console.debug(msg);
            if ("session_id" in msg && msg.session_id !== sessionIdRef.current) {
                sessionIdRef.current = msg.session_id;
                onSessionUpdate?.(msg.session_id);
            }
            switch (msg.type) {
                case "run_workflow_response":
                    if (msg.success) {
                        onRunStart?.();
                    } else if (!msg.success && "error" in msg) {
                        onError?.(msg.error || "Failed to start workflow");
                    }
                    break;

                case "step_run_workflow_response":
                    if (msg.success) {
                        onDebugStart?.();
                    } else if (!msg.success && "error" in msg) {
                        onError?.(msg.error || "Failed to start debugging");
                    }
                    break;

                case "workflow_completion":
                case "subprocess_completion":
                    pendingInputIdRef.current = undefined;
                    onWorkflowComplete?.();
                    break;

                case "input_request":
                    if ("request_id" in msg) {
                        pendingInputIdRef.current = msg.request_id;
                        onInputRequest?.(msg.request_id);
                    }
                    break;

                case "error":
                    pendingInputIdRef.current = undefined;
                    if ("error" in msg) {
                        onError?.(msg.error || "Unknown error occurred");
                    }
                    onWorkflowComplete?.(); // Stop any running workflow
                    break;

                default:
                    // Let other messages pass through for UI processing
                    break;
            }
        },
        [onSessionUpdate, onRunStart, onDebugStart, onWorkflowComplete, onInputRequest, onError],
    );

    const getSessionId = useCallback(() => sessionIdRef.current, []);
    const getPendingInputId = useCallback(() => pendingInputIdRef.current, []);
    const clearPendingInput = useCallback(() => {
        pendingInputIdRef.current = undefined;
    }, []);

    return {
        handleMessage,
        getSessionId,
        getPendingInputId,
        clearPendingInput,
    };
}
