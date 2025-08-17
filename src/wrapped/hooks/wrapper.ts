/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines-per-function */
import { useCallback, useEffect, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { WaldiezChatUserInput, WaldiezTimelineData, showSnackbar } from "@waldiez/components";
import { WaldiezChatMessage } from "@waldiez/types";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";

import { useWebSocketActions } from "./actions";
import {
    ServerMessage,
    SubprocessOutputMsg,
    WaldiezWrapperActions,
    WaldiezWrapperState,
    isConvertWorkflowResponse,
    isErrorResponse,
    isSaveFlowResponse,
    isSubprocessOutput,
} from "./types";
import { useWebsocket } from "./ws";

export const useWaldiezWrapper = ({
    flowId,
    wsUrl = "ws://localhost:8765",
}: {
    flowId: string;
    wsUrl: string;
}): [WaldiezWrapperState, WaldiezWrapperActions] => {
    const inputRequestId = useRef<string | undefined>(undefined);
    const expectingUserInput = useRef<boolean>(false);

    const [userParticipants, setUserParticipants] = useState<string[]>([]);
    const [timeline, setTimeline] = useState<WaldiezTimelineData | undefined>(undefined);
    const [isRunning, setIsRunning] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);
    const [messages, setMessages] = useState<WaldiezChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [inputPrompt, setInputPrompt] = useState<
        | {
              prompt: string;
              request_id: string;
              password?: boolean;
          }
        | undefined
    >(undefined);

    const serverBaseUrl = window.location.protocol + "//" + window.location.host;

    const { sendJson, connected, setMessageHandler } = useWebsocket({
        wsUrl,
        onError: e => console.error("WS error", e),
        autoPingMs: 25000,
    });

    const {
        isRunning: actionsRunning,
        isDebugging: actionsDebugging,
        handleIncoming, // message pump (parsed server frames)
        runWorkflow,
        stepRunWorkflow,
        // stepControl,
        // breakpointControl,
        sendUserInput,
        stopWorkflow,
        saveFlow,
        convertWorkflow,
        uploadFiles,
        // getStatus,

        // ping,
    } = useWebSocketActions({
        sendJson,
        onMsg: m => {
            if (m.type === "workflow_completion" || m.type === "subprocess_completion") {
                setIsRunning(false);
                setIsDebugging(false);
            }
        },
        onSession: () => {},
        setPrompt: p => {
            if (!p) {
                inputRequestId.current = undefined;
                setInputPrompt(undefined);
                return;
            }
            inputRequestId.current = p.requestId;
            expectingUserInput.current = true;
            setInputPrompt({
                prompt: p.prompt ?? "Enter your input:",
                request_id: p.requestId,
                password: p.password ?? false,
            });
        },
    });

    // keep local flags in sync (optional)
    useEffect(() => {
        if (isRunning !== actionsRunning) {
            setIsRunning(actionsRunning);
        }
        if (isDebugging !== actionsDebugging) {
            setIsDebugging(actionsDebugging);
        }
    }, [actionsRunning, actionsDebugging]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleGenericMessage = useCallback(
        // eslint-disable-next-line max-statements
        (data: ServerMessage) => {
            // For image previews
            const imageUrl = inputRequestId.current
                ? `${serverBaseUrl}/uploads/${inputRequestId.current}.png`
                : undefined;

            const result = WaldiezChatMessageProcessor.process(
                JSON.stringify(data),
                inputRequestId.current,
                imageUrl,
            );

            if (result?.timeline) {
                setTimeline(result.timeline);
                return;
            }
            if (result?.message) {
                const newMessage = result.message as WaldiezChatMessage;
                if (!isDebugging) {
                    setMessages(prev => [...prev, newMessage]);
                }
            }
            if (result?.participants?.users) {
                setUserParticipants(result.participants.users);
            }

            // handle embedded input requests detected by the processor
            if (result?.message?.type === "input_request") {
                if (!isDebugging) {
                    const requestId = result.requestId || result.message.request_id;
                    const prompt = result.message.prompt || "Enter your message:";
                    const password = result.message.password || false;
                    if (requestId) {
                        inputRequestId.current = requestId;
                    }
                    expectingUserInput.current = true;
                    setInputPrompt({
                        prompt,
                        request_id: inputRequestId.current || "<unknown>",
                        password,
                    });
                }
            }
        },
        [isDebugging, serverBaseUrl],
    );

    const handleSaveResult = useCallback(
        (data: { success: boolean; error?: string; file_path?: string }) => {
            if (data.success === false) {
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

    const handleConvertResult = useCallback(
        (data: { success: boolean; error?: string; converted_data?: string; output_path?: string }) => {
            if (data.success === false) {
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

    const handleFlowError = useCallback(
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
                setMessages(prev => [...prev, errorMessage]);
                setIsRunning(false);
                setInputPrompt(undefined);
            }
        },
        [flowId],
    );

    const handleSubprocessOutput = useCallback(
        (data: SubprocessOutputMsg) => {
            try {
                const parsedContent = JSON.parse(data.content);
                handleGenericMessage(parsedContent);
            } catch {
                // handleGenericMessage(JSON.parse(data.content));
            }
        },
        [handleGenericMessage],
    );

    const onWsMessage = useCallback(
        (event: MessageEvent) => {
            // First let the new actions pump parse/manage session/input
            handleIncoming(event);

            let data: ServerMessage | undefined;
            try {
                data = JSON.parse(event.data);
            } catch {
                return;
            }
            if (!data || typeof data !== "object" || !("type" in data)) {
                return;
            }
            switch (data.type) {
                case "save_flow_response":
                    if (isSaveFlowResponse(data)) {
                        handleSaveResult(data);
                    }
                    // handleSaveResult(data);
                    break;

                case "convert_workflow_response":
                    if (isConvertWorkflowResponse(data)) {
                        handleConvertResult(data);
                    }
                    break;

                case "error":
                    setIsRunning(false);
                    setInputPrompt(undefined);
                    if (isErrorResponse(data)) {
                        handleFlowError({ error: data.error, details: data.details });
                    } else {
                        handleFlowError({ error: "Unknown error shape", details: data });
                    }
                    break;

                case "workflow_completion":
                case "subprocess_completion":
                    setIsRunning(false);
                    setIsDebugging(false);
                    setInputPrompt(undefined);
                    break;
                case "subprocess_output":
                    if (isSubprocessOutput(data)) {
                        handleSubprocessOutput(data);
                    }
                    break;
                default:
                    handleGenericMessage(data);
                    break;
            }
        },
        [
            handleIncoming,
            handleSaveResult,
            handleConvertResult,
            handleFlowError,
            handleGenericMessage,
            handleSubprocessOutput,
        ],
    );

    // register message handler with the socket
    useEffect(() => {
        setMessageHandler(onWsMessage);
    }, [onWsMessage, setMessageHandler]);

    // reset
    const reset = useCallback(() => {
        setMessages([]);
        setUserParticipants([]);
        setInputPrompt(undefined);
        inputRequestId.current = undefined;
        expectingUserInput.current = false;
    }, []);

    // public actions (compat names)
    const handleRun = useCallback(
        (flow: string) => {
            reset();
            runWorkflow(flow);
        },
        [reset, runWorkflow],
    );

    const handleStepRun = useCallback(
        (flow: string, opts?: { auto_continue?: boolean; breakpoints?: string[] }) => {
            reset();
            stepRunWorkflow(flow, opts);
        },
        [reset, stepRunWorkflow],
    );

    const handleStop = useCallback(() => {
        stopWorkflow();
    }, [stopWorkflow]);

    const handleSave = useCallback(
        (flow: string, filename?: string, forceOverwrite = false) => {
            saveFlow(flow, filename, forceOverwrite);
        },
        [saveFlow],
    );

    const handleUpload = useCallback(
        async (files: File[]) => {
            return uploadFiles(files);
        },
        [uploadFiles],
    );

    const handleConvert = useCallback(
        (flow: string, to: "py" | "ipynb", outputPath?: string | null) => {
            convertWorkflow(flow, to, outputPath);
        },
        [convertWorkflow],
    );

    const handleUserInput = useCallback(
        (input: WaldiezChatUserInput) => {
            sendUserInput(input);
        },
        [sendUserInput],
    );

    return [
        {
            timeline,
            messages,
            userParticipants,
            isRunning,
            isDebugging,
            connected,
            error,
            inputPrompt,
        },
        {
            handleRun,
            handleStepRun,
            handleStop,
            handleSave,
            handleUpload,
            handleConvert,
            handleUserInput,
            sendMessage: sendJson,
            reset,
        },
    ];
};
