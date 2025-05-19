/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useRef, useState } from "react";

export const useWebsocket = (props: {
    wsUrl: string;
    onError?: (error: any) => void;
    onWsMessage: (event: MessageEvent) => void;
}) => {
    const { wsUrl, onWsMessage, onError } = props;
    // Track the WebSocket reference
    const wsRef = useRef<WebSocket | undefined>(undefined);
    // Track the reconnect timeout
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Track the number of reconnect attempts
    const reconnectAttemptsRef = useRef(0);
    // Track if the component is mounted
    const mountedRef = useRef(true);
    // Track if the effect has executed at least once
    const effectExecutedRef = useRef(false);
    // Track URL changes
    const prevUrlRef = useRef(wsUrl);
    // StrictMode detection flag
    const strictModeReconnectRef = useRef(false);
    // Connected state
    const [connected, setConnected] = useState(false);
    const maxReconnectAttempts = 5;

    const getReconnectDelay = () => {
        return Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
    };

    const handleMessage = useCallback(
        (event: MessageEvent) => {
            if (mountedRef.current && onWsMessage) {
                onWsMessage(event);
            }
        },
        [onWsMessage],
    );

    // Close any existing connection
    const closeExistingConnection = useCallback(() => {
        if (wsRef.current) {
            console.log("Closing existing WebSocket connection");
            try {
                // Only close if it's not already closing/closed
                if (
                    wsRef.current.readyState !== WebSocket.CLOSING &&
                    wsRef.current.readyState !== WebSocket.CLOSED
                ) {
                    wsRef.current.close();
                }
            } catch (err) {
                console.error("Error closing WebSocket:", err);
            }
            wsRef.current = undefined;
        }

        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    // WebSocket connection
    const connectWebSocket = useCallback(() => {
        // Don't connect if component is unmounting
        if (!mountedRef.current) {
            // console.log("Not connecting because component is unmounted");
            return;
        }

        // In StrictMode, wait longer on the second mount to avoid the double-mount cycle
        if (strictModeReconnectRef.current) {
            // console.log("Delaying connection due to potential StrictMode remount");
            const strictModeTimer = setTimeout(() => {
                if (mountedRef.current) {
                    strictModeReconnectRef.current = false;
                    actuallyConnect();
                }
            }, 500); // Longer delay for StrictMode

            return () => clearTimeout(strictModeTimer);
        }

        actuallyConnect();

        function actuallyConnect() {
            // First, close any existing connection
            closeExistingConnection();

            try {
                // console.log("Creating new WebSocket connection to:", wsUrl);
                const ws = new WebSocket(wsUrl);

                // const logReadyState = () => {
                //     const states = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
                //     console.log(`WebSocket readyState: ${states[ws.readyState]} (${ws.readyState})`);
                // };

                // logReadyState();

                ws.onopen = () => {
                    // console.log("WebSocket connection established");
                    // logReadyState();
                    if (mountedRef.current) {
                        setConnected(true);
                        reconnectAttemptsRef.current = 0;
                    }
                };

                ws.onclose = (event: CloseEvent) => {
                    // console.log(`WebSocket connection closed with code: ${event.code}`);
                    // logReadyState();

                    if (mountedRef.current) {
                        setConnected(false);

                        // Only reconnect if this connection is still the current one
                        if (
                            wsRef.current === ws &&
                            event.code !== 1000 &&
                            reconnectAttemptsRef.current < maxReconnectAttempts
                        ) {
                            const delay = getReconnectDelay();
                            // console.log(
                            //     `Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${maxReconnectAttempts})`,
                            // );

                            reconnectAttemptsRef.current += 1;
                            reconnectTimeoutRef.current = setTimeout(() => {
                                if (mountedRef.current) {
                                    actuallyConnect();
                                }
                            }, delay);
                        }
                    }
                };

                ws.onerror = error => {
                    // console.error("WebSocket error:", error);
                    // logReadyState();
                    if (mountedRef.current) {
                        onError?.(error);
                        // console.error("Failed to connect to the WebSocket server");
                    }
                };

                ws.onmessage = handleMessage;
                wsRef.current = ws;
            } catch (err) {
                if (mountedRef.current) {
                    onError?.(err);
                    // console.error(
                    //     `Failed to initialize WebSocket: ${err instanceof Error ? err.message : String(err)}`,
                    // );
                }
            }
        }
    }, [wsUrl, handleMessage, closeExistingConnection]);

    const sendMessage = useCallback((data: unknown) => {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
                wsRef.current.send(typeof data === "string" ? data : JSON.stringify(data));
                return true;
            } catch (err) {
                onError?.(err);
                // console.error("Error sending message:", err);
                return false;
            }
        }
        return false;
    }, []);

    // SINGLE COMBINED EFFECT to handle both mounting and URL changes
    useEffect(() => {
        // console.log("WebSocket hook effect running, url:", wsUrl);

        // Set mounted flag
        mountedRef.current = true;

        // Track if the URL has changed
        const isUrlChange = effectExecutedRef.current && wsUrl !== prevUrlRef.current;
        prevUrlRef.current = wsUrl;

        // Update our effect executed flag
        effectExecutedRef.current = true;

        // Set a delay for the initial connection
        // Use a longer delay for URL changes to avoid race conditions
        const delay = isUrlChange ? 300 : strictModeReconnectRef.current ? 500 : 200;

        // console.log(`${isUrlChange ? "URL changed" : "Initial mount"}, connecting after ${delay}ms delay`);

        const connectionTimer = setTimeout(() => {
            if (mountedRef.current) {
                connectWebSocket();
            }
        }, delay);

        // Cleanup function
        return () => {
            // console.log("WebSocket hook effect cleanup");

            // Clear our timer
            clearTimeout(connectionTimer);

            // If this is strict mode unmounting, set the reconnect flag
            // but don't close the connection yet
            if (!effectExecutedRef.current) {
                // console.log("First-time cleanup, likely StrictMode - setting reconnect flag");
                strictModeReconnectRef.current = true;
            } else {
                // This is a real unmount or effect re-execution
                // console.log("Real cleanup, closing WebSocket connection");
                mountedRef.current = false;
                closeExistingConnection();
            }
        };
    }, [wsUrl, connectWebSocket, closeExistingConnection]);

    return {
        wsRef,
        sendMessage,
        connected,
    };
};
