/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { WaldiezChatUserInput } from "@waldiez/types";

import { WebSocketMessage, WebSocketResponse } from "./types";

export const useWebSocketActions = ({
    wsRef,
    connected,
    isRunning,
    setError,
    reset,
    setIsRunning,
    setInputPrompt,
}: {
    wsRef: React.RefObject<WebSocket | undefined>;
    connected: boolean;
    isRunning: boolean;
    setError: (error: string | null) => void;
    reset: () => void;
    setIsRunning: React.Dispatch<React.SetStateAction<boolean>>;
    setInputPrompt: (prompt: any) => void;
}) => {
    /**
     * Handle run action
     */
    const handleRun = useCallback(
        (flow: string) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }
            if (isRunning) {
                setError("Flow is already running");
                return;
            }

            reset();
            setIsRunning(true);

            const message: WebSocketMessage = {
                action: "run",
                flow,
            };

            wsRef.current.send(JSON.stringify(message));
        },
        [connected, isRunning, reset, setIsRunning],
    );

    /**
     * Handle save action
     */
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

    /**
     * Handle upload action
     */
    const handleUpload = useCallback(
        async (files: File[]): Promise<string[]> => {
            if (!wsRef.current || !connected) {
                // Mock if not connected
                return new Promise(resolve => {
                    resolve(files.map(file => `/path/to/${file.name}`));
                });
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

    /**
     * Handle convert action
     */
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
    /**
     * Handle user input
     */
    const handleUserInput = useCallback(
        (input: WaldiezChatUserInput) => {
            if (!wsRef.current) {
                setError("WebSocket not connected");
                return;
            }
            wsRef.current.send(JSON.stringify(input));
            // Clear the input prompt after sending
            setInputPrompt(undefined);
        },
        [connected],
    );
    return {
        handleRun,
        handleSave,
        handleUpload,
        handleConvert,
        handleUserInput,
    };
};
