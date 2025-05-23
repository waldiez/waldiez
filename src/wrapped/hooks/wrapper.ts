/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines-per-function */
import { useCallback, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { showSnackbar } from "@waldiez/components";
import { WaldiezChatMessage, WaldiezChatMessageType } from "@waldiez/types";

import { useWebSocketActions } from "./actions";
import { useWaldiezMessages } from "./messages";
import { DataContent, WaldiezWrapperActions, WaldiezWrapperState, WebSocketResponse } from "./types";
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
    /**
     * On WebSocket message handler
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
            case "saveResult":
                handleSaveResult(data);
                break;
            case "convertResult":
                handleConvertResult(data);
                break;
            case "text":
            case "print":
            case "tool_call":
                handleTextOrPrint(data);
                break;
            case "input_request":
                handleInputRequest(data);
                break;
            case "input_response":
                // console.log("Input response received:", data.response);
                break;
            case "group_chat_run_chat":
                handleGroupChatRunChat(data);
                break;
            case "generate_code_execution_reply":
                handleGenerateCodeExecutionReply(data);
                break;
            case "termination":
                handleFlowTermination(data);
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
        }
    };
    const { getNewChatMessage } = useWaldiezMessages({
        inputRequestId,
    });

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
    const handleConvertResult = (data: WebSocketResponse) => {
        if (data.success === false) {
            showSnackbar({
                message: "Error converting file",
                details: data.message || null,
                level: "error",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
        } else {
            showSnackbar({
                message: "File converted successfully",
                details: data.filePaths?.join(", ") || null,
                level: "success",
                flowId,
                withCloseButton: true,
                duration: 3000,
            });
        }
    };
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
     * Handle group chat run chat messages
     */
    const handleGroupChatRunChat = (data: WebSocketResponse) => {
        // # {"type": "group_chat_run_chat", "content":
        // #    {"uuid": "3f2d491e-deb3-4f28-8991-cb8eb67ea3a6",
        // #    "speaker": "executor", "silent": false}}
        //
        if (
            data.content &&
            typeof data.content === "object" &&
            data.content !== null &&
            "uuid" in data.content &&
            typeof data.content.uuid === "string" &&
            "speaker" in data.content &&
            typeof data.content.speaker === "string"
        ) {
            const chatMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "system",
                content: [
                    {
                        type: "text",
                        text: "Group chat run",
                    },
                ],
                sender: data.content.speaker,
            };
            setMessages(prevMessages => [...prevMessages, chatMessage]);
        }
    };

    /**
     * Handle generate code execution reply messages
     */
    const handleGenerateCodeExecutionReply = (data: WebSocketResponse) => {
        // # {"type": "generate_code_execution_reply", "content":
        // #    {"uuid": "af6e6cfd-edf6-4785-a490-97358ae3d306",
        // #   "code_blocks": ["md"], "sender": "manager", "recipient": "executor"}}
        if (
            data.content &&
            typeof data.content === "object" &&
            data.content !== null &&
            "uuid" in data.content &&
            typeof data.content.uuid === "string" &&
            "sender" in data.content &&
            typeof data.content.sender === "string" &&
            "recipient" in data.content &&
            typeof data.content.recipient === "string"
        ) {
            const chatMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "system",
                content: [
                    {
                        type: "text",
                        text: "Generate code execution reply",
                    },
                ],
                sender: data.content.sender,
                recipient: data.content.recipient,
            };
            setMessages(prevMessages => [...prevMessages, chatMessage]);
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
     * Handle flow error
     */
    const handleFlowError = (data: WebSocketResponse) => {
        if (data.message && typeof data.message === "string") {
            const errorMessage: WaldiezChatMessage = {
                id: nanoid(),
                timestamp: new Date().toISOString(),
                type: "error",
                content: [
                    {
                        type: "text",
                        text: data.message,
                    },
                ],
            };
            setError(data.message);
            showSnackbar({
                message: "Error",
                details: data.message,
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
            if (
                "role" in data.content &&
                typeof data.content.role === "string" &&
                data.content.role !== "user"
            ) {
                return;
            }
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
