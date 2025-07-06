/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { WaldiezTimelineData, showSnackbar } from "@waldiez/components";
import { WaldiezChatMessage } from "@waldiez/types";
import { WaldiezChatMessageProcessingResult, WaldiezChatMessageProcessor } from "@waldiez/utils/chat";

import { useWebSocketActions } from "./actions";
import { WaldiezWrapperActions, WaldiezWrapperState, WebSocketResponse } from "./types";
import { useWebsocket } from "./ws";

/**
 * Main hook for WaldiezWrapper component
 */
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
    /**
     * On WebSocket message handler
     */
    const onWsMessage = useCallback((event: MessageEvent) => {
        try {
            const data: WebSocketResponse = JSON.parse(event.data);
            console.debug("Received message:", data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    /**
     * Handle WebSocket messages
     */
    const handleWebSocketMessage = (data: WebSocketResponse) => {
        // console.debug("Handling WebSocket message:", data);
        // termination_and_human_reply_no_input
        // using_auto_reply
        switch (data.type) {
            case "saveResult":
                handleSaveResult(data);
                break;
            case "convertResult":
                handleConvertResult(data);
                break;
            case "error":
                setIsRunning(false);
                setInputPrompt(undefined);
                handleFlowError(data);
                break;
            case "runResult":
                setIsRunning(false);
                setInputPrompt(undefined);
                if (data.success === false) {
                    handleFlowError(data);
                }
                break;
            default:
                handleGenericMessage(data);
                break;
        }
    };

    /**
     * Handle generic messages
     */
    const handleGenericMessage = (data: WebSocketResponse) => {
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
            setMessages(prevMessages => [...prevMessages, newMessage]);
        }
        if (result?.participants && result.participants.users) {
            setUserParticipants(result.participants.users);
        }

        if (result?.message && result.message.type === "input_request") {
            handleInputRequest(result);
        }
    };

    /**
     * Handle input request messages
     */
    const handleInputRequest = (result: WaldiezChatMessageProcessingResult) => {
        if (result.message && result.message.type === "input_request") {
            const requestId = result.requestId || result.message.request_id;
            const prompt = result.message.prompt || "Enter your message to start the conversation:";
            const password = result.message.password || false;
            if (requestId) {
                inputRequestId.current = requestId;
            }
            expectingUserInput.current = true;
            setInputPrompt({
                prompt,
                request_id: inputRequestId.current || "<unknown>",
                password: password || false,
            });
        }
    };

    /**
     * Handle save result messages
     */
    const handleSaveResult = (data: WebSocketResponse) => {
        if (data.success === false) {
            showSnackbar({
                message: "Error saving file",
                details: data.message || null,
                level: "error",
                flowId,
                withCloseButton: true,
                duration: 5000,
            });
        } else {
            showSnackbar({
                message: "File saved successfully",
                details: data.filePaths?.join(", ") || null,
                level: "success",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
        }
    };
    /**
     * Handle convert result messages
     */
    const handleConvertResult = (response: WebSocketResponse) => {
        if (response.success === false) {
            showSnackbar({
                message: "Error converting file",
                details: response.data || response.message || null,
                level: "error",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
        } else {
            showSnackbar({
                message: "File converted successfully",
                details: response.filePaths?.join(", ") || null,
                level: "success",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
        }
    };
    /**
     * Handle flow error
     */
    const handleFlowError = (response: WebSocketResponse) => {
        if (response.data && typeof response.data === "string") {
            const errorMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "error",
                content: [
                    {
                        type: "text",
                        text: response.data,
                    },
                ],
            };
            setError(response.data);
            showSnackbar({
                message: "Error",
                details: response.data,
                level: "error",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        }
        setIsRunning(false);
        setInputPrompt(undefined);
    };

    /**
     * Reset the state
     */
    const reset = () => {
        setMessages([]);
        setUserParticipants([]);
        setInputPrompt(undefined);
        inputRequestId.current = undefined;
        expectingUserInput.current = false;
    };

    const { wsRef, sendMessage, connected } = useWebsocket({
        wsUrl,
        onWsMessage,
    });

    const { handleRun, handleSave, handleUpload, handleConvert, handleUserInput, handleStop } =
        useWebSocketActions({
            wsRef,
            connected,
            isRunning,
            setError,
            reset,
            setIsRunning,
            setInputPrompt,
        });

    // Return state and actions
    return [
        {
            timeline,
            messages,
            userParticipants,
            isRunning,
            connected,
            error,
            inputPrompt,
        },
        {
            handleRun,
            handleStop,
            handleSave,
            handleUpload,
            handleConvert,
            handleUserInput,
            sendMessage,
            reset,
        },
    ];
};
