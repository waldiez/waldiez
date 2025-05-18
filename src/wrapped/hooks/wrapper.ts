/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { WaldiezChatMessage, WaldiezChatMessageType } from "@waldiez/types";

import { useWebSocketActions } from "./actions";
import { useWaldiezMessages } from "./messages";
import { DataContent, WaldiezWrapperActions, WaldiezWrapperState, WebSocketResponse } from "./types";

/**
 * Main hook for WaldiezWrapper component
 */
export const useWaldiezWrapper = ({
    wsUrl = "ws://localhost:8765",
}: {
    wsUrl: string;
}): [WaldiezWrapperState, WaldiezWrapperActions] => {
    const wsRef = useRef<WebSocket | undefined>(undefined);
    const inputRequestId = useRef<string | undefined>(undefined);
    const expectingUserInput = useRef<boolean>(false);
    const [userParticipants, setUserParticipants] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [messages, setMessages] = useState<WaldiezChatMessage[]>([]);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputPrompt, setInputPrompt] = useState<
        | {
              prompt: string;
              request_id: string;
              password?: string | boolean;
          }
        | undefined
    >(undefined);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        // Clean up existing connection if any
        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch (_) {
                // Ignore errors during cleanup
            }
            wsRef.current = undefined;
        }
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log("WebSocket connection established");
            setConnected(true);
            setError(null);
        };

        ws.onclose = () => {
            console.log("WebSocket connection closed");
            setConnected(false);
        };

        ws.onerror = error => {
            console.error("WebSocket error:", error);
            setError("Failed to connect to the WebSocket server");
        };

        ws.onmessage = event => {
            onWsMessage(event);
        };
        wsRef.current = ws;
    }, [wsUrl]);

    useEffect(() => {
        connectWebSocket();
        setIsRunning(false);

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = undefined;
            }
        };
    }, [connectWebSocket]);
    /**
     * Handle WebSocket messages
     */
    const onWsMessage = useCallback((event: MessageEvent) => {
        try {
            const data: WebSocketResponse = JSON.parse(event.data);
            console.log("Received message:", data);
            handleWebSocketMessage(data);
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    }, []);
    /**
     * Handle WebSocket messages
     */
    const handleWebSocketMessage = (data: WebSocketResponse) => {
        // other types to check:
        // termination_and_human_reply_no_input
        // using_auto_reply
        switch (data.type) {
            case "text":
            case "print":
                handleTextOrPrint(data);
                break;
            case "input_request":
                handleInputRequest(data);
                break;
            case "input_response":
                console.log("Input response received:", data.response);
                break;
            case "termination":
                handleFlowTermination(data);
                break;
            // default:
            //     console.warn("Unknown message type:", data.type);
            //     break;
        }
    };
    const { getNewChatMessage } = useWaldiezMessages({
        inputRequestId,
    });
    /**
     * Handle text or print messages
     */
    const handleTextOrPrint = (data: WebSocketResponse) => {
        if (data.content) {
            checkSender(data);
            const chatMessage: WaldiezChatMessage = getNewChatMessage(
                data.content as DataContent,
                data.type as WaldiezChatMessageType,
            );
            setMessages(prevMessages => [...prevMessages, chatMessage]);
        } else if (
            data.message &&
            typeof data.message === "string" &&
            data.message.trim().replace("\n", "") === "<Waldiez> - Workflow finished"
        ) {
            setIsRunning(false);
        }
    };

    /**
     * Handle flow termination
     */
    const handleFlowTermination = (data: WebSocketResponse) => {
        if (
            data.content &&
            typeof data.content === "object" &&
            data.content !== null &&
            "termination_reason" in data.content &&
            typeof data.content.termination_reason === "string"
        ) {
            const terminationMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "system",
                content: [
                    {
                        type: "text",
                        text: data.content.termination_reason,
                    },
                ],
            };
            setMessages(prevMessages => [...prevMessages, terminationMessage]);
        }
        setIsRunning(false);
        setInputPrompt(undefined);
    };
    /**
     * Handle input request messages
     */
    const handleInputRequest = (data: WebSocketResponse) => {
        if (data.prompt) {
            let prompt = data.prompt.trim();
            if (prompt === ">" || prompt === "> ") {
                prompt = "Enter your message to start the conversation:";
                data.prompt = prompt;
            }
            if (data.request_id) {
                inputRequestId.current = data.request_id;
            }
            expectingUserInput.current = true;
            const password = isPasswordPrompt(data);
            setInputPrompt({
                prompt,
                request_id: inputRequestId.current || "<unknown>",
                password,
            });
            addInputRequestMessage(data);
        }
    };

    /**
     * Add input request message to the chat
     */
    const addInputRequestMessage = (data: WebSocketResponse) => {
        if (data.prompt && data.request_id) {
            const chatMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "input_request",
                request_id: data.request_id,
                content: [
                    {
                        type: "text",
                        text: data.prompt,
                    },
                ],
            };
            setMessages(prevMessages => [...prevMessages, chatMessage]);
        }
    };

    /**
     * Check if the sender is a user and update the user participants list
     */
    const checkSender = (data: WebSocketResponse) => {
        if (
            expectingUserInput.current &&
            typeof data.content === "object" &&
            data.content !== null &&
            "sender" in data.content &&
            typeof data.content.sender === "string"
        ) {
            if (!userParticipants.includes(data.content.sender)) {
                setUserParticipants(prev => [...prev, (data.content as any).sender]);
            }
            expectingUserInput.current = false;
        }
    };

    /**
     * Check if the prompt is a password prompt
     */
    const isPasswordPrompt = (data: WebSocketResponse): boolean => {
        let password = false;
        if (data.password && typeof data.password === "string") {
            password = data.password.toLowerCase() === "true";
        } else if (data.password && typeof data.password === "boolean") {
            password = data.password;
        }
        return password;
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

    const { handleRun, handleSave, handleUpload, handleConvert, handleUserInput } = useWebSocketActions({
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
            messages,
            userParticipants,
            isRunning,
            connected,
            error,
            inputPrompt,
        },
        {
            handleRun,
            handleSave,
            handleUpload,
            handleConvert,
            handleUserInput,
            reset,
        },
    ];
};
