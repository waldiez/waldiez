/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import type { WaldiezChatConfig, WaldiezChatHandlers } from "@waldiez/components/chatUI/types";
import {
    type WaldiezChatMessageDeduplicationOptions,
    useWaldiezChat,
} from "@waldiez/utils/chat/hooks/useWaldiezChat";
import type { WaldiezChatAction } from "@waldiez/utils/chat/reducer";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

export const useWaldiezWsChat: (props: {
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
    };
    chat?: {
        initialConfig?: Partial<WaldiezChatConfig>;
        handlers?: WaldiezChatHandlers;
        preprocess?: (message: any) => { handled: boolean; updated?: any };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
    };
}) => {
    chat: WaldiezChatConfig;
    dispatch: React.Dispatch<WaldiezChatAction>;
    reset: () => void;
    connected: boolean;
    getConnectionState: () => number;
    send: (msg: unknown) => boolean | void;
    reconnect: () => void;
} = ({ ws, chat }) => {
    const chatHook = useWaldiezChat({ ...chat });
    const handleWsMessage: WaldiezWsMessageHandler = useCallback(
        (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                chatHook.process(data);
            } catch (_) {
                chatHook.process(event.data);
            }
            // console.debug(chatHook.chat.messages);
        },
        [chatHook],
    );
    const wsHook = useWaldiezWs({
        wsUrl: ws.url,
        protocols: ws.protocols,
        autoPingMs: ws.autoPingMs,
        onWsMessage: handleWsMessage,
        onError: error => {
            ws?.onError?.(error);
            chatHook.setError({
                message: "Connection error occurred",
                code: "CONNECTION_ERROR",
            });
        },
    });

    return {
        chat: chatHook.chat,
        dispatch: chatHook.dispatch,
        connected: wsHook.connected,
        reset: chatHook.reset,
        getConnectionState: wsHook.getConnectionState,
        send: wsHook.send,
        reconnect: wsHook.reconnect,
    };
};
