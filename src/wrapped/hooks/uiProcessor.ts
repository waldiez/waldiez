/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements,max-lines */
import React, { useCallback } from "react";

import { nanoid } from "nanoid";

import { showSnackbar } from "@waldiez/components/snackbar";
import type { WaldiezStepByStep, WaldiezTimelineData } from "@waldiez/components/types";
import type { WaldiezChatMessage, WaldiezChatParticipant } from "@waldiez/types";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import { DEBUG_INPUT_PROMPT, WaldiezStepByStepProcessor } from "@waldiez/utils/stepByStep";

import {
    type ServerMessage,
    type SubprocessOutputMsg,
    isConvertWorkflowResponse,
    isErrorResponse,
    isSaveFlowResponse,
    isSubprocessOutput,
} from "./types";

// eslint-disable-next-line max-lines-per-function
export function useUIMessageProcessor({
    flowId,
    isRunning,
    isDebugging,
    setTimeline,
    setMessages,
    setParticipants,
    setInputPrompt,
    setError,
    getPendingInputId,
    stepByStepState,
    setStepByStepState,
}: {
    flowId: string;
    isRunning: boolean;
    isDebugging: boolean;
    setTimeline: (timeline?: WaldiezTimelineData) => void;
    setMessages: React.Dispatch<React.SetStateAction<WaldiezChatMessage[]>>;
    setParticipants: React.Dispatch<React.SetStateAction<WaldiezChatParticipant[]>>;
    setInputPrompt: (prompt?: { prompt: string; request_id: string; password?: boolean }) => void;
    setError: (error: string | null) => void;
    getPendingInputId: () => string | undefined;
    stepByStepState: WaldiezStepByStep;
    setStepByStepState: React.Dispatch<React.SetStateAction<WaldiezStepByStep>>;
}) {
    const serverBaseUrl = window.location.protocol + "//" + window.location.host;
    type StepStateWithKeys = WaldiezStepByStep & {
        /** seen event keys to keep history unique */
        _seenEventKeys?: Set<string>;
    };

    // 2) a stable key for any event-like object
    const makeEventKey = (e: any): string => {
        // prefer existing ids, fall back to common identifiers, else a light hash
        const explicit =
            e?.id ??
            e?.request_id ??
            e?.data?.id ??
            `${e?.type ?? "unknown"}|${e?.timestamp ?? ""}|${e?.debug_type ?? ""}|${e?.data?.request_id ?? ""}`;

        // very light djb2 hash to avoid mega keys if needed
        let h = 5381;
        for (let i = 0; i < explicit.length; i++) {
            h = ((h << 5) + h) ^ explicit.charCodeAt(i);
        }
        return `${e?.type ?? "evt"}:${h >>> 0}`;
    };

    // 3) one helper to append events uniquely (prepends new items)
    const appendHistoryUnique = useCallback(
        (
            setStepByStepState: React.Dispatch<React.SetStateAction<WaldiezStepByStep>>,
            incoming: any | any[],
        ) => {
            const arr = Array.isArray(incoming) ? incoming : [incoming];
            setStepByStepState(prev0 => {
                const prev = prev0 as StepStateWithKeys;
                const seen = new Set(prev._seenEventKeys ?? []);

                const uniqueIncoming: any[] = [];
                for (const e of arr) {
                    const k = makeEventKey(e);
                    if (!seen.has(k)) {
                        seen.add(k);
                        // ensure event has an id for the UI, reuse the key as a stable fallback
                        if (!e.id) {
                            e.id = k;
                        }
                        uniqueIncoming.push(e);
                    }
                }

                // no new unique items? return prev to avoid extra renders
                if (uniqueIncoming.length === 0) {
                    return prev;
                }

                return {
                    ...prev,
                    _seenEventKeys: seen,
                    eventHistory: [...uniqueIncoming, ...(prev.eventHistory ?? [])],
                };
            });
        },
        [],
    );
    const onmessage = useCallback(
        (newMessage: WaldiezChatMessage) => {
            if (isRunning && !isDebugging) {
                setMessages(prev => [...prev, newMessage]);
            } else if (
                isDebugging &&
                newMessage.type !== "debug_input_request" &&
                newMessage.type !== "input_request"
            ) {
                appendHistoryUnique(setStepByStepState, newMessage);
            }
        },
        [isRunning, isDebugging, setMessages, appendHistoryUnique, setStepByStepState],
    );

    const onParticipants = useCallback(
        (participants: WaldiezChatParticipant[]) => {
            if (isRunning && !isDebugging) {
                setParticipants(participants);
            }
            if (isDebugging && !isRunning) {
                setStepByStepState(prev => ({
                    ...prev,
                    participants: participants,
                }));
            }
        },
        [isRunning, isDebugging, setParticipants, setStepByStepState],
    );

    const processGenericMessage = useCallback(
        (data: ServerMessage) => {
            const currentInputId = getPendingInputId();
            const imageUrl = currentInputId ? `${serverBaseUrl}/uploads/${currentInputId}.png` : undefined;

            const result = WaldiezChatMessageProcessor.process(
                JSON.stringify(data),
                currentInputId,
                imageUrl,
            );

            if (result?.timeline) {
                setTimeline(result.timeline);
                return;
            }
            if (result?.message) {
                onmessage(result.message);
            }
            if (result?.participants) {
                onParticipants(result.participants);
            }

            // Handle embedded input requests detected by the processor
            if (result?.message?.type === "input_request") {
                if (isRunning && !isDebugging) {
                    const requestId = result.requestId || result.message.request_id || getPendingInputId();
                    const prompt = result.message.prompt || "Enter your message:";
                    const password = result.message.password || false;
                    setInputPrompt({
                        prompt,
                        request_id: requestId || "<unknown>",
                        password,
                    });
                }
            }
        },
        [
            getPendingInputId,
            serverBaseUrl,
            setTimeline,
            onmessage,
            isRunning,
            isDebugging,
            setInputPrompt,
            onParticipants,
        ],
    );

    const processSaveResult = useCallback(
        (data: { success: boolean; error?: string; file_path?: string }) => {
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
                    details: data.file_path || null,
                    level: "success",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
            }
        },
        [flowId],
    );

    const processConvertResult = useCallback(
        (data: { success: boolean; error?: string; converted_data?: string; output_path?: string }) => {
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
                    details: data.output_path || null,
                    level: "success",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
            }
        },
        [flowId],
    );

    const processFlowError = useCallback(
        (data: { error?: string; details?: any }) => {
            const msg =
                data.error ||
                (typeof data.details === "string" ? data.details : JSON.stringify(data.details || {}));
            if (msg) {
                setError(msg);
                showSnackbar({
                    message: "Error",
                    details: msg,
                    level: "error",
                    flowId,
                    withCloseButton: true,
                    duration: 3000,
                });
                const errorMessage: WaldiezChatMessage = {
                    id: nanoid(),
                    timestamp: new Date().toISOString(),
                    type: "error",
                    content: [{ type: "text", text: msg }],
                };
                if (isRunning && !isDebugging) {
                    setMessages(prev => [...prev, errorMessage]);
                } else if (isDebugging) {
                    appendHistoryUnique(setStepByStepState, errorMessage);
                }
            }
        },
        [appendHistoryUnique, flowId, isDebugging, isRunning, setError, setMessages, setStepByStepState],
    );

    const onDebugSubprocessOut = useCallback(
        (parsedContent: any) => {
            const result = WaldiezStepByStepProcessor.process(parsedContent, {
                flowId,
            });
            if (result?.error) {
                processGenericMessage(parsedContent);
                return;
            }
            const newState = result?.stateUpdate ?? stepByStepState;
            if (result?.stateUpdate?.participants) {
                newState.participants = result.stateUpdate.participants;
            }
            let newMessage: Record<string, unknown>;
            if (
                result?.stateUpdate?.eventHistory &&
                result.stateUpdate?.eventHistory.length > 0 &&
                result.stateUpdate.eventHistory[0]
            ) {
                newMessage = result.stateUpdate.eventHistory[0];
            } else if (
                result?.debugMessage &&
                result.debugMessage.type !== "debug_input_request" &&
                result.debugMessage.type !== "input_request"
            ) {
                newMessage = {
                    id: nanoid(),
                    timestamp: new Date().toISOString(),
                    type: "debug",
                    data: result.debugMessage,
                };
            }
            setStepByStepState(prev => ({
                ...prev,
                ...newState,
                eventHistory: [newMessage, ...prev.eventHistory],
            }));
        },
        [flowId, processGenericMessage, setStepByStepState, stepByStepState],
    );
    const onChatSubprocessOut = useCallback(
        (parsedContent: any) => {
            const result = WaldiezChatMessageProcessor.process(parsedContent);
            if (result?.message) {
                setMessages(prev => {
                    const newMessages = [...prev];
                    if (result.message) {
                        newMessages.push(result.message);
                    }
                    return newMessages;
                });
            }
            if (result?.participants) {
                onParticipants(result.participants);
            }
            if (result?.timeline) {
                setTimeline(result.timeline);
            }
        },
        [setMessages, onParticipants, setTimeline],
    );
    const processSubprocessOutput = useCallback(
        (data: SubprocessOutputMsg) => {
            // console.debug("Subprocess output received:", data.content);
            try {
                let parsedContent = JSON.parse(data.content);
                // double dumped?
                try {
                    parsedContent = JSON.parse(parsedContent);
                } catch {
                    // If parsing fails, keep the original content
                }
                if (typeof parsedContent === "object" && parsedContent !== null && "type" in parsedContent) {
                    if (isDebugging) {
                        onDebugSubprocessOut(parsedContent);
                    } else if (isRunning) {
                        onChatSubprocessOut(parsedContent);
                    }
                } else {
                    // Handle as regular chat message
                    processGenericMessage(parsedContent);
                }
            } catch {
                // console.error("Error processing subprocess output:", reason);
                if (isDebugging) {
                    appendHistoryUnique(setStepByStepState, {
                        id: nanoid(),
                        timestamp: new Date().toISOString(),
                        type: "raw",
                        data: data.content,
                    });
                }
            }
        },
        [
            appendHistoryUnique,
            isDebugging,
            isRunning,
            onChatSubprocessOut,
            onDebugSubprocessOut,
            processGenericMessage,
            setStepByStepState,
        ],
    );
    const processUIMessage = useCallback(
        // eslint-disable-next-line complexity
        (data: ServerMessage) => {
            switch (data.type) {
                case "input_request":
                    if ("request_id" in data) {
                        if (isRunning && !isDebugging) {
                            setInputPrompt({
                                prompt: data.prompt ?? "Enter your input:",
                                request_id: data.request_id || getPendingInputId(),
                                password: data.password ?? false,
                            });
                        } else {
                            if (isDebugging && !isRunning) {
                                // eslint-disable-next-line max-depth
                                if (data.prompt.trim() === DEBUG_INPUT_PROMPT) {
                                    setStepByStepState(prev => ({
                                        ...prev,
                                        activeRequest: null,
                                        pendingControlInput: {
                                            prompt: data.prompt ?? DEBUG_INPUT_PROMPT,
                                            request_id: data.request_id || getPendingInputId(),
                                        },
                                    }));
                                } else {
                                    setStepByStepState(prev => ({
                                        ...prev,
                                        activeRequest: {
                                            request_id: data.request_id || getPendingInputId(),
                                            session_id: data.session_id || "<unknown>",
                                            prompt: data.prompt ?? "Enter your input:",
                                            password: data.password ?? false,
                                        },
                                        pendingControlInput: null,
                                    }));
                                }
                            }
                        }
                    }
                    break;

                case "step_debug":
                    if ("debug_type" in data) {
                        // Add debug event to history
                        appendHistoryUnique(setStepByStepState, {
                            id: nanoid(),
                            timestamp: new Date().toISOString(),
                            type: data.debug_type,
                            data: data.data,
                        });
                    }
                    break;

                case "breakpoint_notification":
                    console.debug("Breakpoint notification received", data);
                    break;

                case "save_flow_response":
                    if (isSaveFlowResponse(data)) {
                        processSaveResult(data);
                    }
                    break;

                case "convert_workflow_response":
                    if (isConvertWorkflowResponse(data)) {
                        processConvertResult(data);
                    }
                    break;

                case "error":
                    if (isErrorResponse(data)) {
                        processFlowError({ error: data.error, details: data.details });
                    } else {
                        processFlowError({ error: "Unknown error shape", details: data });
                    }
                    break;

                case "subprocess_output":
                    if (isSubprocessOutput(data)) {
                        processSubprocessOutput(data);
                    }
                    break;

                default:
                    processGenericMessage(data);
                    break;
            }
        },
        [
            processGenericMessage,
            isRunning,
            isDebugging,
            setInputPrompt,
            getPendingInputId,
            setStepByStepState,
            appendHistoryUnique,
            processSaveResult,
            processConvertResult,
            processFlowError,
            processSubprocessOutput,
        ],
    );

    return {
        processUIMessage,
    };
}
