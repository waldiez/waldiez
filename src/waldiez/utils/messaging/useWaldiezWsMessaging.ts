/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type Dispatch, useCallback, useRef } from "react";

import type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatParticipant,
} from "@waldiez/components/chatUI/types";
import type {
    WaldiezBreakpoint,
    WaldiezStepByStep,
    WaldiezStepHandlers,
} from "@waldiez/components/stepByStep/types";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { type WaldiezChatMessageDeduplicationOptions } from "@waldiez/utils/chat/hooks/useWaldiezChat";
import type { WaldiezChatAction } from "@waldiez/utils/chat/reducer";
import { useWaldiezMessaging } from "@waldiez/utils/messaging/useWaldiezMessaging";
import { type WaldiezStepByStepMessageDeduplicationOptions } from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import type { WaldiezStepByStepAction } from "@waldiez/utils/stepByStep/reducer";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

type PendingRequest = {
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timeout: NodeJS.Timeout;
};

type RpcRequestMessage = {
    request_id: string;
    type: string;
    payload?: any;
};

type RpcResponseMessage = {
    request_id: string;
    type: string;
    payload?: any;
    error?: string;
};

export const useWaldiezWsMessaging: (props: {
    flowId: string;
    onSave?: (contents: string, path?: string | null) => void | Promise<void>;
    onConvert?: (contents: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>;
    onRun?: (contents: string, path?: string | null) => void | Promise<void>;
    onStepRun?: (
        contents: string,
        breakpoints?: (string | WaldiezBreakpoint)[],
        checkpoint?: string | null,
        path?: string | null,
    ) => void | Promise<void>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
        rpcTimeout?: number;
    };
    chat?: {
        initialConfig?: Partial<WaldiezChatConfig>;
        handlers?: Partial<WaldiezChatHandlers>;
        preprocess?: (message: any) => { handled: boolean; updated?: any };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
    };
    stepByStep?: {
        initialConfig?: Partial<WaldiezStepByStep>;
        handlers?: WaldiezStepHandlers;
        preprocess?: (message: any) => { handled: boolean; updated?: any };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
    };
}) => {
    save: (contents: string, path?: string | null) => Promise<void>;
    convert: (contents: string, to: "py" | "ipynb", path?: string | null) => Promise<void>;
    run: (contents: string, path?: string | null) => Promise<void>;
    stepRun: (
        contents: string,
        breakpoints?: (string | WaldiezBreakpoint)[],
        path?: string | null,
    ) => Promise<void>;
    getRunningMode: () => "chat" | "step" | undefined;
    setRunningMode: (mode: "chat" | "step" | undefined) => void;
    reset: () => void;
    actions: {
        chat: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (
                request: WaldiezActiveRequest | undefined,
                message?: WaldiezChatMessage,
            ) => void;
            setError: (error: WaldiezChatError | undefined) => void;
            setTimeline: (timeline: WaldiezTimelineData | undefined) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addMessage: (message: WaldiezChatMessage, isEndOfWorkflow?: boolean) => void;
            removeMessage: (id: string) => void;
            clearMessages: () => void;
        };
        step: {
            process: (data: any) => void;
            reset: () => void;
            setActive: (active: boolean) => void;
            setShow: (show: boolean) => void;
            setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
            setPendingControl: (controlInput: { request_id: string; prompt: string } | undefined) => void;
            setBreakpoints: (breakpoints: (string | WaldiezBreakpoint)[]) => void;
            setError: (error: string) => void;
            setTimeline: (timeline: WaldiezTimelineData) => void;
            setParticipants: (participants: WaldiezChatParticipant[]) => void;
            addEvent: (event: Record<string, unknown>) => void;
            removeEvent: (id: string) => void;
            clearEvents: () => void;
        };
    };
    dispatch: {
        chat: Dispatch<WaldiezChatAction>;
        step: Dispatch<WaldiezStepByStepAction>;
    };
    chat: WaldiezChatConfig;
    stepByStep: WaldiezStepByStep;
    connected: boolean;
    getConnectionState: () => number;
    send: (message: any) => void;
    reconnect: () => void;
    disconnect: () => void;
    request: <T = any>(type: string, payload?: any) => Promise<T>;
} = ({ flowId, onSave, onConvert, onRun, chat, stepByStep, onStepRun, preprocess, ws }) => {
    const {
        save,
        convert,
        run,
        stepRun,
        getRunningMode,
        setRunningMode,
        process,
        reset,
        dispatch,
        chat: chatState,
        stepByStep: stepByStepState,
        actions,
    } = useWaldiezMessaging({
        flowId,
        onSave,
        onConvert,
        onRun,
        onStepRun,
        preprocess,
        chat,
        stepByStep,
    });
    const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
    const rpcTimeout = ws.rpcTimeout ?? 30000;
    const generateId = useCallback((): string => {
        return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    }, []);
    const handleWsMessage: WaldiezWsMessageHandler = useCallback(
        (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                if (typeof data === "object" && "request_id" in data) {
                    const message = data as RpcResponseMessage;
                    if (pendingRequestsRef.current.has(message.request_id)) {
                        const pending = pendingRequestsRef.current.get(message.request_id)!;
                        clearTimeout(pending.timeout);
                        pendingRequestsRef.current.delete(message.request_id);
                        if (message.error) {
                            pending.reject(new Error(message.error));
                        } else {
                            pending.resolve(message.payload);
                        }
                        return;
                    }
                }
                // Not an RPC response - process normally
                process(data);
            } catch (_) {
                process(event.data);
            }
        },
        [process],
    );
    const {
        send,
        connected,
        getConnectionState,
        reconnect: wsReconnect,
        disconnect: wsDisconnect,
    } = useWaldiezWs({
        wsUrl: ws.url,
        protocols: ws.protocols,
        autoPingMs: ws.autoPingMs,
        onWsMessage: handleWsMessage,
        onError: error => {
            ws?.onError?.(error);
        },
    });
    const request = useCallback(
        <T = any>(type: string, payload?: any): Promise<T> => {
            return new Promise((resolve, reject) => {
                const state = getConnectionState();
                if (state !== WebSocket.OPEN) {
                    reject(new Error("WebSocket is not connected"));
                    return;
                }

                const request_id = generateId();
                const message: RpcRequestMessage = { request_id, type, payload };

                // Set timeout
                const timeout = setTimeout(() => {
                    pendingRequestsRef.current.delete(request_id);
                    reject(new Error(`Request timeout after ${rpcTimeout}ms`));
                }, rpcTimeout);

                // Store pending request
                pendingRequestsRef.current.set(request_id, { resolve, reject, timeout });

                // Send message
                const success = send(message);
                if (!success) {
                    clearTimeout(timeout);
                    pendingRequestsRef.current.delete(request_id);
                    reject(new Error("Failed to send message"));
                }
            });
        },
        [getConnectionState, generateId, rpcTimeout, send],
    );
    const clearPendingRequests = useCallback((reason: string) => {
        // Reject all pending requests
        pendingRequestsRef.current.forEach(({ reject, timeout }) => {
            clearTimeout(timeout);
            reject(new Error(reason));
        });
        pendingRequestsRef.current.clear();
    }, []);
    const disconnect = useCallback(() => {
        clearPendingRequests("WebSocket disconnected");
        wsDisconnect();
    }, [wsDisconnect, clearPendingRequests]);

    const reconnect = useCallback(() => {
        clearPendingRequests("WebSocket reconnecting");
        wsReconnect();
    }, [wsReconnect, clearPendingRequests]);
    return {
        save,
        convert,
        run,
        stepRun,
        getRunningMode,
        setRunningMode,
        process,
        reset,
        dispatch,
        chat: chatState,
        stepByStep: stepByStepState,
        send,
        connected,
        getConnectionState,
        reconnect,
        disconnect,
        request,
        actions,
    };
};
