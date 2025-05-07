/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines-per-function */
import Waldiez from "@waldiez";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { nanoid } from "nanoid";

import { WaldiezContentItem, WaldiezPreviousMessage, WaldiezProps, WaldiezUserInput } from "@waldiez/types";

// WebSocket message types
type WebSocketMessage = {
    action: "run" | "save" | "upload" | "convert" | "userInput" | "getInputPrompt";
    flow?: string;
    files?: {
        name: string;
        content: string;
    }[];
    to?: "py" | "ipynb";
    input?: WaldiezUserInput;
};

type DataContent = string | string[] | { [key: string]: unknown } | { [key: string]: unknown }[];

type WebSocketResponse = {
    type: string;
    request_id?: string;
    content?: DataContent;
    filePaths?: string[];
    outputPath?: string;
    response?: string;
    prompt?: string;
};

interface IWaldiezWrapperProps {
    // Original Waldiez props that will be passed to the component
    waldiezProps: Omit<
        WaldiezProps,
        "onRun" | "onSave" | "onUpload" | "onConvert" | "onUserInput" | "inputPrompt"
    >;
    // WebSocket connection URL
    wsUrl?: string;
}

const WaldiezWrapper: React.FC<IWaldiezWrapperProps> = ({ waldiezProps, wsUrl = "ws://localhost:8765" }) => {
    const wsRef = useRef<WebSocket | null>(null);
    const flowMessagesRef = useRef<WaldiezPreviousMessage[]>([]);
    const userParticipants = useRef<Set<string>>(new Set());
    const inputRequestId = useRef<string | null>(null);
    const expectingUserInput = useRef<boolean>(false);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputPrompt, setInputPrompt] = useState<WaldiezProps["inputPrompt"]>(null);
    const serverBaseUrl = window.location.protocol + "//" + window.location.host;

    // eslint-disable-next-line max-statements
    const onWsMessage = (event: MessageEvent) => {
        try {
            const data: WebSocketResponse = JSON.parse(event.data);
            console.log("Received message:", data);

            // Handle different response types
            switch (data.type) {
                case "input_request":
                    if (data.content && data.request_id) {
                        inputRequestId.current = data.request_id;
                    }
                    break;
                case "text":
                case "print":
                    if (data.content) {
                        if (
                            expectingUserInput.current &&
                            typeof data.content === "object" &&
                            data.content !== null &&
                            "sender" in data.content &&
                            typeof data.content.sender === "string"
                        ) {
                            console.log("User input received from: ", data.content.sender);
                            userParticipants.current.add(data.content.sender);
                            expectingUserInput.current = false;
                        }
                        const processedContent = processImagePlaceholders(data.content);
                        flowMessagesRef.current = [
                            ...flowMessagesRef.current,
                            makePreviousMessage(processedContent),
                        ];
                    }
                    break;
                case "input":
                    if (data.prompt) {
                        let prompt = data.prompt.trim();
                        if (prompt === ">") {
                            prompt = "Enter your input:";
                        }
                        if (data.request_id) {
                            inputRequestId.current = data.request_id;
                        }
                        expectingUserInput.current = true;
                        setInputPrompt({
                            previousMessages: flowMessagesRef.current,
                            prompt,
                            request_id: inputRequestId.current || "<unknown>",
                            userParticipants: userParticipants.current,
                        });
                    }
                    break;
                case "termination":
                    console.log("flow terminated: ", data);
                    break;
            }
        } catch (error) {
            console.error("Error parsing WebSocket message:", error);
        }
    };

    const connectWebSocket = useCallback(() => {
        // Clean up existing connection if any
        if (wsRef.current) {
            try {
                wsRef.current.close();
            } catch (_) {
                // Ignore errors during cleanup
            }
            wsRef.current = null;
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

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, [connectWebSocket, wsRef]);

    // Handler for onRun
    const handleRun = useCallback(
        (flow: string) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }

            // Clear previous messages
            flowMessagesRef.current = [];
            userParticipants.current.clear();
            setInputPrompt(null);
            inputRequestId.current = null;
            const message: WebSocketMessage = {
                action: "run",
                flow,
            };

            wsRef.current.send(JSON.stringify(message));
        },
        [connected],
    );

    // Handler for onSave
    const handleSave = useCallback(
        (flow: string) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }

            const message: WebSocketMessage = {
                action: "save",
                flow,
            };

            wsRef.current.send(JSON.stringify(message));
        },
        [connected],
    );

    // Handler for onUpload
    const handleUpload = useCallback(
        async (files: File[]): Promise<string[]> => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return [];
            }

            // Convert File objects to base64 strings
            const filesData = await Promise.all(
                files.map(async file => {
                    return new Promise<{ name: string; content: string }>(resolve => {
                        const reader = new FileReader();
                        reader.onload = () => {
                            // Get base64 string (remove the "data:..." prefix)
                            const base64 = reader.result as string;
                            const content = base64.split(",")[1] || base64;

                            resolve({
                                name: file.name,
                                content,
                            });
                        };
                        reader.readAsDataURL(file);
                    });
                }),
            );

            const message: WebSocketMessage = {
                action: "upload",
                files: filesData,
            };

            // Using a Promise to wait for the server response
            return new Promise(resolve => {
                const messageHandler = (event: MessageEvent) => {
                    try {
                        const data: WebSocketResponse = JSON.parse(event.data);
                        if (data.type === "uploadResult") {
                            wsRef.current?.removeEventListener("message", messageHandler);
                            resolve(data.filePaths || []);
                        }
                    } catch (error) {
                        console.error("Error parsing upload response:", error);
                    }
                };

                wsRef.current?.addEventListener("message", messageHandler);
                wsRef.current?.send(JSON.stringify(message));
            });
        },
        [connected],
    );

    // Handler for onConvert
    const handleConvert = useCallback(
        (flow: string, to: "py" | "ipynb") => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }

            const message: WebSocketMessage = {
                action: "convert",
                flow,
                to,
            };

            wsRef.current.send(JSON.stringify(message));
        },
        [connected],
    );

    // Handler for onUserInput
    const handleUserInput = useCallback(
        (input: WaldiezUserInput) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }

            const message: WebSocketMessage = {
                action: "userInput",
                input,
            };

            wsRef.current.send(JSON.stringify(message));
            // Clear the input prompt after sending
            setInputPrompt(null);
        },
        [connected],
    );
    const processImagePlaceholders = (content: DataContent): DataContent => {
        if (
            typeof content === "object" &&
            content !== null &&
            "content" in content &&
            Array.isArray(content.content)
        ) {
            content.content = content.content.map(item => {
                if (
                    typeof item === "object" &&
                    item !== null &&
                    "image_url" in item &&
                    item.image_url &&
                    typeof item.image_url === "object" &&
                    "url" in item.image_url
                ) {
                    const imageUrl = item.image_url.url;
                    if (imageUrl === "<image>") {
                        return {
                            ...item,
                            image_url: {
                                url: serverBaseUrl + "/uploads/" + inputRequestId.current + ".png",
                            },
                        };
                    }
                }
                return item;
            }) as DataContent;
        }
        return content;
    };

    const makePreviousMessage = (
        content:
            | string
            | string[]
            | WaldiezContentItem[]
            | { [key: string]: unknown }
            | { [key: string]: unknown }[],
        sender?: string,
        recipient?: string,
        type: string = "text",
    ): WaldiezPreviousMessage => {
        const id = nanoid();
        const timestamp = new Date().toISOString();

        // If it's a string, create a simple message
        if (typeof content === "string") {
            return {
                id,
                timestamp,
                type,
                data: {
                    content,
                    sender,
                    recipient,
                },
            };
        }

        // If it's a string array
        if (Array.isArray(content) && content.every(item => typeof item === "string")) {
            return {
                id,
                timestamp,
                type,
                data: {
                    content: content.join(", "),
                    sender,
                    recipient,
                },
            };
        }

        // If it's an object, include it directly in the data
        if (typeof content === "object" && content !== null && !Array.isArray(content)) {
            return {
                id,
                timestamp,
                type,
                data: {
                    ...content,
                    sender: sender || (content["sender"] as string),
                    recipient: recipient || (content["recipient"] as string),
                },
            };
        }

        // Fallback for unexpected content
        return {
            id,
            timestamp,
            type,
            data: {
                content,
                sender,
                recipient,
            },
        };
    };

    // Assemble props for the Waldiez component
    const completeProps: WaldiezProps = {
        ...waldiezProps,
        onRun: handleRun,
        onSave: handleSave,
        onUpload: handleUpload,
        onConvert: handleConvert,
        onUserInput: handleUserInput,
        inputPrompt,
    };

    return (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh" }}>
            {error && (
                <>
                    <div
                        style={{
                            backgroundColor: "white",
                            color: "red",
                            padding: "10px",
                            margin: "10px 0",
                            textAlign: "center",
                        }}
                    >
                        Error: {error}
                    </div>
                </>
            )}

            {!connected && !error && (
                <div
                    style={{
                        backgroundColor: "white",
                        color: "orange",
                        padding: "10px",
                        margin: "10px 0",
                        textAlign: "center",
                    }}
                >
                    Connecting to WebSocket server...
                </div>
            )}
            {connected && (
                <div
                    style={{
                        backgroundColor: "white",
                        color: "green",
                        padding: "10px",
                        margin: "10px 0",
                        textAlign: "center",
                    }}
                >
                    WebSocket connected
                </div>
            )}
            <div style={{ position: "fixed", top: 40, left: 0, width: "100%", height: "calc(100% - 40px)" }}>
                <Waldiez {...completeProps} />
            </div>
        </div>
    );
};

export default WaldiezWrapper;
