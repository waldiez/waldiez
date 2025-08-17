/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useRef, useState } from "react";

type MessageHandler = (event: MessageEvent) => void;

export const useWebsocket = (props: {
    wsUrl: string;
    onError?: (error: any) => void;
    onWsMessage?: MessageHandler;
    autoPingMs?: number; // optional
}) => {
    const { wsUrl, onWsMessage, onError, autoPingMs } = props;

    const wsRef = useRef<WebSocket | undefined>(undefined);
    // Track the reconnect timeout
    const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    // Track the number of reconnect attempts
    const reconnectAttemptsRef = useRef(0);
    // Track if the component is mounted
    const mountedRef = useRef(true);
    const effectRanRef = useRef(false);
    const prevUrlRef = useRef(wsUrl);
    // StrictMode detection flag
    const strictModeReconnectRef = useRef(false);
    // Connected state
    const [connected, setConnected] = useState(false);
    const maxReconnectAttempts = 5;

    const handlerRef = useRef<MessageHandler | undefined>(onWsMessage);
    const setMessageHandler = useCallback((fn?: MessageHandler) => {
        handlerRef.current = fn;
    }, []);
    useEffect(() => {
        handlerRef.current = onWsMessage;
    }, [onWsMessage]);

    const getReconnectDelay = () => Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);

    const closeExistingConnection = useCallback(() => {
        if (wsRef.current) {
            try {
                if (
                    wsRef.current.readyState !== WebSocket.CLOSING &&
                    wsRef.current.readyState !== WebSocket.CLOSED
                ) {
                    wsRef.current.close();
                }
            } catch {}
            wsRef.current = undefined;
        }
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }
    }, []);

    const connectWebSocket = useCallback(() => {
        if (!mountedRef.current) {
            return;
        }

        if (strictModeReconnectRef.current) {
            const t = setTimeout(() => {
                if (mountedRef.current) {
                    strictModeReconnectRef.current = false;
                    actuallyConnect();
                }
            }, 500);
            return () => clearTimeout(t);
        }

        actuallyConnect();

        function actuallyConnect() {
            closeExistingConnection();
            try {
                const ws = new WebSocket(wsUrl);

                ws.onopen = () => {
                    if (!mountedRef.current) {
                        return;
                    }
                    setConnected(true);
                    reconnectAttemptsRef.current = 0;
                };

                ws.onclose = evt => {
                    if (!mountedRef.current) {
                        return;
                    }
                    setConnected(false);

                    if (
                        wsRef.current === ws &&
                        evt.code !== 1000 &&
                        reconnectAttemptsRef.current < maxReconnectAttempts
                    ) {
                        const delay = getReconnectDelay();
                        reconnectAttemptsRef.current += 1;
                        reconnectTimeoutRef.current = setTimeout(() => {
                            if (mountedRef.current) {
                                actuallyConnect();
                            }
                        }, delay);
                    }
                };

                ws.onerror = err => {
                    if (!mountedRef.current) {
                        return;
                    }
                    onError?.(err);
                };

                ws.onmessage = event => {
                    handlerRef.current?.(event);
                };

                wsRef.current = ws;
            } catch (err) {
                onError?.(err);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [wsUrl]);

    const sendRaw = useCallback((data: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(data);
            return true;
        }
        return false;
    }, []);

    const sendJson = useCallback(
        (data: unknown) => {
            try {
                return sendRaw(typeof data === "string" ? data : JSON.stringify(data));
            } catch (err) {
                onError?.(err);
                return false;
            }
        },
        [sendRaw, onError],
    );

    // optional auto-ping to keep connections fresh
    useEffect(() => {
        if (!autoPingMs) {
            return;
        }
        const id = setInterval(() => {
            sendJson({ type: "ping", echo_data: { t: Date.now() } });
        }, autoPingMs);
        return () => clearInterval(id);
    }, [autoPingMs, sendJson]);

    useEffect(() => {
        mountedRef.current = true;

        const isUrlChange = effectRanRef.current && wsUrl !== prevUrlRef.current;
        prevUrlRef.current = wsUrl;
        effectRanRef.current = true;

        const delay = isUrlChange ? 300 : strictModeReconnectRef.current ? 500 : 200;
        const timer = setTimeout(() => {
            if (mountedRef.current) {
                connectWebSocket();
            }
        }, delay);

        return () => {
            clearTimeout(timer);
            if (!effectRanRef.current) {
                strictModeReconnectRef.current = true;
            } else {
                mountedRef.current = false;
                closeExistingConnection();
            }
        };
    }, [wsUrl, connectWebSocket, closeExistingConnection]);

    return { wsRef, sendJson, connected, setMessageHandler };
};
