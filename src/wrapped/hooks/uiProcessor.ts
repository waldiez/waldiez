/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import React, { useCallback } from "react";

import { nanoid } from "nanoid";

import { WaldiezStepByStep, WaldiezTimelineData, showSnackbar } from "@waldiez/components";
import { ChatParticipant, WaldiezChatMessage } from "@waldiez/types";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import {
    DEBUG_INPUT_PROMPT,
    WaldiezStepByStepProcessor,
    WaldiezStepByStepUtils,
} from "@waldiez/utils/stepByStep";

import {
    ServerMessage,
    SubprocessOutputMsg,
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
    setParticipants: React.Dispatch<React.SetStateAction<ChatParticipant[]>>;
    setInputPrompt: (prompt?: { prompt: string; request_id: string; password?: boolean }) => void;
    setError: (error: string | null) => void;
    getPendingInputId: () => string | undefined;
    stepByStepState: WaldiezStepByStep;
    setStepByStepState: React.Dispatch<React.SetStateAction<WaldiezStepByStep>>;
}) {
    const serverBaseUrl = window.location.protocol + "//" + window.location.host;

    const onmessage = useCallback(
        (newMessage: WaldiezChatMessage) => {
            if (isRunning && !isDebugging) {
                setMessages(prev => [...prev, newMessage]);
            } else if (
                isDebugging &&
                newMessage.type !== "debug_input_request" &&
                newMessage.type !== "input_request"
            ) {
                setStepByStepState(prev => ({
                    ...prev,
                    eventHistory: [newMessage, ...prev.eventHistory],
                }));
            }
        },
        [isRunning, isDebugging, setMessages, setStepByStepState],
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
                setParticipants(result.participants);
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
            setParticipants,
            isRunning,
            isDebugging,
            setInputPrompt,
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
                    setStepByStepState(prev => ({
                        ...prev,
                        eventHistory: [errorMessage, ...prev.eventHistory],
                    }));
                }
            }
        },
        [flowId, isDebugging, isRunning, setError, setMessages, setStepByStepState],
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
                // Check if it's a step-by-step debug message
                if (WaldiezStepByStepUtils.canProcess(parsedContent)) {
                    const result = WaldiezStepByStepProcessor.process(data.content, {
                        flowId,
                        currentState: stepByStepState,
                    });
                    if (result?.error) {
                        processGenericMessage(parsedContent);
                        return;
                    }

                    if (result?.stateUpdate || result?.debugMessage) {
                        const newState = result?.stateUpdate ?? stepByStepState;
                        const eventHistory =
                            result?.debugMessage &&
                            result.debugMessage.type !== "debug_input_request" &&
                            result.debugMessage.type !== "input_request"
                                ? [
                                      {
                                          id: nanoid(),
                                          timestamp: new Date().toISOString(),
                                          type: "debug",
                                          data: result.debugMessage,
                                      },
                                  ]
                                : [];
                        setStepByStepState(prev => ({
                            ...prev,
                            ...newState,
                            eventHistory: [...eventHistory, ...prev.eventHistory],
                        }));
                    }
                    if (result?.controlAction) {
                        console.debug("Control action:", result.controlAction);
                    }
                } else {
                    // Handle as regular chat message
                    processGenericMessage(parsedContent);
                }
            } catch {
                setStepByStepState(prev => ({
                    ...prev,
                    eventHistory: [
                        {
                            id: nanoid(),
                            timestamp: new Date().toISOString(),
                            type: "raw",
                            data: data.content,
                        },
                        ...prev.eventHistory,
                    ],
                }));
                // console.error("Error processing subprocess output:", reason);
            }
        },
        [flowId, stepByStepState, processGenericMessage, setStepByStepState],
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
                        setStepByStepState(prev => ({
                            ...prev,
                            eventHistory: [
                                {
                                    id: nanoid(),
                                    timestamp: new Date().toISOString(),
                                    type: data.debug_type,
                                    data: data.data,
                                },
                                ...prev.eventHistory,
                            ],
                        }));
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
