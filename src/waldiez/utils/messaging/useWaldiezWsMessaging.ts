/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type Dispatch, useCallback } from "react";

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

export const useWaldiezWsMessaging: (props: {
    flowId: string;
    onSave?: (contents: string, path?: string | null) => void | Promise<void>;
    onConvert?: (contents: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>;
    onRun?: (contents: string) => void | Promise<void>;
    onStepRun?: (contents: string) => void | Promise<void>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
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
    run: (contents: string) => Promise<void>;
    stepRun: (contents: string) => Promise<void>;
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
    const handleWsMessage: WaldiezWsMessageHandler = useCallback(
        (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                process(data);
            } catch (_) {
                process(event.data);
            }
            // console.debug(chatHook.chat.messages);
        },
        [process],
    );
    const { send, connected, getConnectionState, reconnect, disconnect } = useWaldiezWs({
        wsUrl: ws.url,
        protocols: ws.protocols,
        autoPingMs: ws.autoPingMs,
        onWsMessage: handleWsMessage,
        onError: error => {
            ws?.onError?.(error);
        },
    });
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
        actions,
    };
};
