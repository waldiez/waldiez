/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import Waldiez from "@waldiez";

import React, { useCallback, useEffect, useRef, useState } from "react";

import { WaldiezPreviousMessage, WaldiezProps, WaldiezUserInput } from "@waldiez/types";

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

type WebSocketResponse = {
    type: string;
    request_id?: string;
    content?: string;
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
    const inputRequestId = useRef<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [inputPrompt, setInputPrompt] = useState<WaldiezProps["inputPrompt"]>(null);

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
                        if (data.content) {
                            console.log(data.content);
                            // const newMessages = [...flowMessagesRef.current, JSON.stringify(data.content)];
                            // flowMessagesRef.current = newMessages;
                        }
                        break;
                    case "input":
                        if (data.prompt) {
                            let prompt = data.prompt.trim();
                            if (prompt === ">") {
                                prompt = "Enter your input:";
                            }
                            setInputPrompt({
                                previousMessages: flowMessagesRef.current,
                                prompt,
                                request_id: data.request_id || inputRequestId.current || "<unknown>",
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
        wsRef.current = ws;
    }, [wsUrl]);
    useEffect(() => {
        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            // setLastConnectionAttempt(new Date());
        };
    }, [connectWebSocket, wsRef]);

    // Handler for onRun
    const handleRun = useCallback(
        (flow: string) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }

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

            {!connected && (
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
