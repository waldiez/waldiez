/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type Dispatch, useCallback, useRef } from "react";

import type { WaldiezChatConfig, WaldiezChatUserInput } from "@waldiez/components/chatUI/types";
import type {
    WaldiezBreakpoint,
    WaldiezDebugInputResponse,
    WaldiezStepByStep,
} from "@waldiez/components/stepByStep/types";
import { useWaldiezWsMessaging } from "@waldiez/utils";
import type { WaldiezChatAction } from "@waldiez/utils/chat/reducer";
import type { WaldiezStepByStepAction } from "@waldiez/utils/stepByStep/reducer";

import { useMessagePreprocessor } from "./preprocessor";

export const useWaldiezWrapper = ({
    flowId,
    wsUrl = "ws://localhost:8765",
    protocols = undefined,
    onError = undefined,
}: {
    flowId: string;
    wsUrl: string;
    protocols?: string | string[] | undefined;
    onError?: (error: any) => void;
}): {
    chat: WaldiezChatConfig;
    stepByStep: WaldiezStepByStep;
    onRun: (flowJson: string, path?: string | null) => void;
    onStepRun: (
        flowJson: string,
        breakpoints?: (string | WaldiezBreakpoint)[],
        checkpoint?: string | null,
        path?: string | null,
    ) => void;
    onSave: (flowJson: string, path?: string | null) => void;
    onConvert: (flowJson: string, to: "py" | "ipynb", path?: string | null) => void;
    sendMessage: (message: unknown) => boolean | void;
    checkpoints?: {
        get: (flowName: string) => Promise<Record<string, any> | null>;
        set: (flowName: string, checkpoint: Record<string, any> | null) => Promise<void>;
    };
    reset: () => void;
} => {
    const messageSender = useRef<((msg: any) => boolean | void) | undefined>(undefined);
    const chatDispatchRef = useRef<Dispatch<WaldiezChatAction> | null>(null);
    const stepDispatchRef = useRef<Dispatch<WaldiezStepByStepAction> | null>(null);
    const { preprocess, getSessionId, getPendingInputId, clearPendingInput } = useMessagePreprocessor(flowId);
    const onRunCb = useCallback((data: string, path?: string | null) => {
        messageSender.current?.({
            type: "run",
            data,
            mode: "standard",
            path,
        });
    }, []);
    const onStepRunCb = useCallback(
        (
            data: string,
            breakpoints?: (string | WaldiezBreakpoint)[],
            checkpoint?: string | null,
            path?: string | null,
        ) => {
            messageSender.current?.({
                type: "step_run",
                data,
                breakpoints,
                checkpoint,
                path,
            });
        },
        [],
    );
    const onInterrupt = useCallback(
        (sessionId?: string, force = false) => {
            const sid = typeof sessionId === "string" ? sessionId : getSessionId();
            if (!sid) {
                console.warn("No session id :(");
                return;
            }
            messageSender.current?.({ type: "stop", session_id: sid, force });
            chatDispatchRef.current?.({ type: "SET_ACTIVE", active: false });
        },
        [getSessionId],
    );
    const onSave = useCallback((data: string, path?: string | null, force = true) => {
        messageSender.current?.({ type: "save", data, path, force });
    }, []);
    const onConvert = useCallback((data: string, to: "py" | "ipynb", path?: string | null) => {
        messageSender.current?.({
            type: "convert",
            data,
            format: to,
            path,
        });
    }, []);
    const onUserInput = useCallback(
        (input: WaldiezChatUserInput & { session_id?: string }) => {
            const sid = input.session_id ?? getSessionId();
            const rid = input.request_id ?? getPendingInputId();
            clearPendingInput();
            if (!sid || !rid) {
                console.warn("Sth missing :(", { sid, rid });
                return;
            }
            messageSender.current?.({
                type: "user_input",
                session_id: sid,
                request_id: rid,
                data: input.data,
            });
        },
        [clearPendingInput, getPendingInputId, getSessionId],
    );
    const onChatUserInput = useCallback(
        (input: WaldiezChatUserInput & { session_id?: string }) => {
            onUserInput(input);
            chatDispatchRef.current?.({ type: "SET_ACTIVE_REQUEST", request: undefined });
        },
        [onUserInput],
    );
    const onStepUserInput = useCallback(
        (input: WaldiezChatUserInput & { session_id?: string }) => {
            onUserInput(input);
            stepDispatchRef.current?.({ type: "SET_ACTIVE_REQUEST", request: undefined });
        },
        [onUserInput],
    );
    const sendControl = useCallback(
        (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => {
            const request_id = input.request_id !== "<unknown>" ? input.request_id : getPendingInputId();
            clearPendingInput();
            messageSender.current?.({
                type: "step_control",
                action: input.data,
                request_id,
                session_id: getSessionId() ?? "<unknown>",
            });
            stepDispatchRef.current?.({ type: "SET_PENDING_CONTROL_INPUT", controlInput: undefined });
        },
        [getPendingInputId, clearPendingInput, getSessionId],
    );
    const onCloseChat = useCallback(() => {
        const sid = getSessionId() ?? "<unknown>";
        messageSender.current?.({ type: "stop", session_id: sid, force: true });
        stepDispatchRef.current?.({ type: "RESET" });
    }, [getSessionId]);
    const onCloseStepView = useCallback(() => {
        const sid = getSessionId() ?? "<unknown>";
        messageSender.current?.({ type: "stop", session_id: sid, force: true });
        stepDispatchRef.current?.({ type: "RESET" });
    }, [getSessionId]);
    const {
        send: sendMessage,
        chat,
        stepByStep,
        reset,
        dispatch,
        run: onRun,
        stepRun: onStepRun,
        request,
    } = useWaldiezWsMessaging({
        flowId,
        onRun: onRunCb,
        onSave,
        onConvert,
        onStepRun: onStepRunCb,
        preprocess,
        chat: {
            handlers: {
                onInterrupt,
                onUserInput: onChatUserInput,
                onClose: onCloseChat,
            },
            preprocess,
        },
        stepByStep: {
            preprocess,
            handlers: {
                respond: onStepUserInput,
                sendControl,
                onStart: () => {},
                close: onCloseStepView,
            },
        },
        ws: {
            url: wsUrl,
            protocols,
            onError,
        },
    });
    const onGetCheckpoints = useCallback(
        async (flowName: string) => {
            try {
                return await request("get_checkpoints", { flow_name: flowName });
            } catch (error) {
                console.error(error);
                return null;
            }
        },
        [request],
    );
    const onSetCheckpoint = useCallback(
        async (flowName: string, checkpoint: Record<string, any> | null) => {
            try {
                await request("set_checkpoint", { flow_name: flowName, checkpoint });
            } catch {
                //
            }
        },
        [request],
    );

    messageSender.current = sendMessage;
    chatDispatchRef.current = dispatch.chat;
    stepDispatchRef.current = dispatch.step;
    return {
        chat,
        stepByStep,
        sendMessage,
        onConvert,
        onRun,
        onStepRun,
        onSave,
        reset,
        checkpoints: {
            get: onGetCheckpoints,
            set: onSetCheckpoint,
        },
    };
};
