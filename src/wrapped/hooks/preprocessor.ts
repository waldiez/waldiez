/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useRef } from "react";

import { showSnackbar } from "@waldiez/components";

import { isConvertWorkflowResponse, isSaveFlowResponse } from "./types";

export const useMessagePreprocessor = (flowId: string) => {
    const sessionIdRef = useRef<string | undefined>(undefined);
    const pendingInputIdRef = useRef<string | undefined>(undefined);
    const processConvertResult = useCallback(
        (data: { success: boolean; error?: string; data?: string; path?: string }) => {
            if (!data.success) {
                showSnackbar({
                    message: "Error converting file",
                    details: data.error || null,
                    level: "error",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
            } else {
                showSnackbar({
                    message: "File converted successfully",
                    details: data.path || null,
                    level: "success",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
            }
        },
        [flowId],
    );
    const processSaveResult = useCallback(
        (data: { success: boolean; error?: string; path?: string }) => {
            if (!data.success) {
                showSnackbar({
                    message: "Error saving file",
                    details: data.error || null,
                    level: "error",
                    flowId,
                    withCloseButton: true,
                    duration: 5000,
                });
            } else {
                showSnackbar({
                    message: "File saved successfully",
                    details: data.path || null,
                    level: "success",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
            }
        },
        [flowId],
    );

    const handleParsedContent = useCallback(
        (data: any) => {
            if (data.type === "save_response") {
                if (isSaveFlowResponse(data)) {
                    processSaveResult(data);
                    return { handled: true };
                }
            }
            if (data.type === "convert_response") {
                if (isConvertWorkflowResponse(data)) {
                    processConvertResult(data);
                }
            }
            if (
                (data.type === "input_request" || data.type === "debug_input_request") &&
                "request_id" in data &&
                typeof data.request_id === "string" &&
                pendingInputIdRef.current !== data.request_id
            ) {
                pendingInputIdRef.current = data.request_id;
            }
            return { handled: false, updated: data };
        },
        [processSaveResult, processConvertResult],
    );

    const preprocess = useCallback(
        (message: any) => {
            // console.debug("Preprocess message:", message);
            if (
                message &&
                typeof message === "object" &&
                "type" in message &&
                "content" in message &&
                (message as any).type === "subprocess_output"
            ) {
                if ("session_id" in message && message.session_id !== sessionIdRef.current) {
                    sessionIdRef.current = message.session_id;
                }
                if (typeof message.content === "string") {
                    try {
                        const parsed = JSON.parse(message.content);
                        if (!parsed || !parsed.type) {
                            return { handled: false, updated: message.content };
                        }
                        return handleParsedContent(parsed);
                    } catch {
                        return { handled: false, updated: message.content };
                    }
                }
                return { handled: false, updated: message.content };
            }
            if (message && typeof message === "object" && "type" in message) {
                return handleParsedContent(message);
            }
            return { handled: false, updated: message };
        },
        [handleParsedContent],
    );

    const getSessionId = useCallback(() => sessionIdRef.current, []);
    const getPendingInputId = useCallback(() => pendingInputIdRef.current, []);
    const clearPendingInput = useCallback(() => {
        pendingInputIdRef.current = undefined;
    }, []);

    return {
        preprocess,
        getSessionId,
        getPendingInputId,
        clearPendingInput,
    };
};
