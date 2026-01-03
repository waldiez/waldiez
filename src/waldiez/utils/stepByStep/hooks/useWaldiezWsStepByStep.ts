/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type Dispatch, useCallback } from "react";

import type { WaldiezStepByStep, WaldiezStepHandlers } from "@waldiez/components/stepByStep/types";
import {
    type WaldiezStepByStepMessageDeduplicationOptions,
    useWaldiezStepByStep,
} from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import type { WaldiezStepByStepAction } from "@waldiez/utils/stepByStep/reducer";
import { type WaldiezWsMessageHandler, useWaldiezWs } from "@waldiez/utils/ws";

/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
export const useWaldiezWsStepByStep: (props: {
    ws: {
        url: string;
        protocols?: string | string[] | undefined;
        autoPingMs?: number;
        onError?: (error: any) => void;
    };
    stepByStep?: {
        initialConfig?: Partial<WaldiezStepByStep>;
        handlers?: Partial<WaldiezStepHandlers>;
        preprocess?: (message: any) => { handled: boolean; updated?: any };
        onPreview?: (requestId: string) => string;
        deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
    };
}) => {
    stepByStep: WaldiezStepByStep;
    dispatch: Dispatch<WaldiezStepByStepAction>;
    reset: () => void;
    connected: boolean;
    getConnectionState: () => number;
    send: (msg: unknown) => boolean | void;
    reconnect: () => void;
} = ({ ws, stepByStep }) => {
    const stepByStepHook = useWaldiezStepByStep({ ...stepByStep });
    const handleWsMessage: WaldiezWsMessageHandler = useCallback(
        (event: MessageEvent) => {
            try {
                const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
                stepByStepHook.process(data);
            } catch (_) {
                stepByStepHook.process(event.data);
            }
            // console.debug(chatHook.chat.messages);
        },
        [stepByStepHook],
    );
    const wsHook = useWaldiezWs({
        wsUrl: ws.url,
        protocols: ws.protocols,
        autoPingMs: ws.autoPingMs,
        onWsMessage: handleWsMessage,
        onError: error => {
            ws?.onError?.(error);
        },
    });
    return {
        stepByStep: stepByStepHook.stepByStep,
        dispatch: stepByStepHook.dispatch,
        connected: wsHook.connected,
        reset: stepByStepHook.reset,
        getConnectionState: wsHook.getConnectionState,
        send: wsHook.send,
        reconnect: wsHook.reconnect,
    };
};
