/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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
import {
    type WaldiezChatMessageDeduplicationOptions,
    useWaldiezChat,
} from "@waldiez/utils/chat/hooks/useWaldiezChat";
import type { WaldiezChatAction } from "@waldiez/utils/chat/reducer";
import { isPromise } from "@waldiez/utils/promises";
import {
    type WaldiezStepByStepMessageDeduplicationOptions,
    useWaldiezStepByStep,
} from "@waldiez/utils/stepByStep/hooks/useWaldiezStepByStep";
import type { WaldiezStepByStepAction } from "@waldiez/utils/stepByStep/reducer";

export const useWaldiezMessaging: (props: {
    flowId: string;
    onSave?: (contents: string, path?: string | null, force?: boolean) => void | Promise<void>;
    onConvert?: (contents: string, to: "py" | "ipynb", path?: string | null) => void | Promise<void>;
    onRun?: (contents: string, path?: string | null) => void | Promise<void>;
    onStepRun?: (contents: string) => void | Promise<void>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
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
    save: (contents: string) => Promise<void>;
    convert: (contents: string, to: "py" | "ipynb", path?: string | null) => Promise<void>;
    run: (contents: string, path?: string | null) => Promise<void>;
    stepRun: (contents: string) => Promise<void>;
    getRunningMode: () => "chat" | "step" | undefined;
    setRunningMode: (mode: "chat" | "step" | undefined) => void;
    process: (data: any) => void;
    reset: () => void;
    dispatch: {
        chat: Dispatch<WaldiezChatAction>;
        step: Dispatch<WaldiezStepByStepAction>;
    };
    chat: WaldiezChatConfig;
    stepByStep: WaldiezStepByStep;
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
} = ({ onSave, onConvert, onRun, chat, stepByStep, preprocess, onStepRun }) => {
    const runningMode = useRef<"chat" | "step" | undefined>(undefined);
    const stepByStepHook = useWaldiezStepByStep({ ...stepByStep });
    const chatHook = useWaldiezChat({ ...chat });
    const getRunningMode = () => {
        return runningMode.current;
    };
    const setRunningMode = (mode: "chat" | "step" | undefined) => {
        runningMode.current = mode;
    };
    const save = useCallback(
        async (contents: string, path?: string | null, force?: boolean) => {
            if (onSave) {
                const result = onSave(contents, path, force);
                if (isPromise(result)) {
                    await result;
                }
            }
        },
        [onSave],
    );
    const convert = useCallback(
        async (contents: string, to: "py" | "ipynb", path?: string | null) => {
            if (onConvert) {
                const result = onConvert(contents, to, path);
                if (isPromise(result)) {
                    await result;
                }
            }
        },
        [onConvert],
    );

    const run = useCallback(
        async (contents: string, path?: string | null) => {
            setRunningMode("chat");
            if (onRun) {
                const result = onRun(contents, path);
                if (isPromise(result)) {
                    await result;
                }
            }
            chatHook.setShow(true);
        },
        [onRun, chatHook],
    );

    const stepRun = useCallback(
        async (contents: string) => {
            setRunningMode("step");
            if (onStepRun) {
                const result = onStepRun(contents);
                if (isPromise(result)) {
                    await result;
                }
            }
            stepByStepHook.setShow(true);
        },
        [onStepRun, stepByStepHook],
    );
    const reset = useCallback(() => {
        if (runningMode.current === "chat") {
            chatHook.reset();
        } else if (runningMode.current === "step") {
            stepByStepHook.reset();
        }
        setRunningMode(undefined);
    }, [chatHook, stepByStepHook]);

    const process = useCallback((data: any) => {
        let toProcess = data;
        if (typeof data === "string") {
            try {
                toProcess = JSON.parse(data);
            } catch {
                //
            }
        }
        if (runningMode.current === "chat") {
            chatHook.process(toProcess);
        } else if (runningMode.current === "step") {
            stepByStepHook.process(toProcess);
        } else {
            preprocess?.(toProcess);
            // console.warn("No valid running mode! Is the flow running?");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        save,
        convert,
        run,
        stepRun,
        reset,
        process,
        getRunningMode,
        setRunningMode,
        actions: {
            chat: {
                process: chatHook.process,
                reset: chatHook.reset,
                setActive: chatHook.setActive,
                setShow: chatHook.setShow,
                setActiveRequest: chatHook.setActiveRequest,
                setError: chatHook.setError,
                setTimeline: chatHook.setTimeline,
                setParticipants: chatHook.setParticipants,
                addMessage: chatHook.addMessage,
                removeMessage: chatHook.removeMessage,
                clearMessages: chatHook.clearMessages,
            },
            step: {
                process: stepByStepHook.process,
                reset: stepByStepHook.reset,
                setActive: stepByStepHook.setActive,
                setShow: stepByStepHook.setShow,
                setActiveRequest: stepByStepHook.setActiveRequest,
                setError: stepByStepHook.setError,
                setTimeline: stepByStepHook.setTimeline,
                setParticipants: stepByStepHook.setParticipants,
                setBreakpoints: stepByStepHook.setBreakpoints,
                addEvent: stepByStepHook.addEvent,
                removeEvent: stepByStepHook.removeEvent,
                clearEvents: stepByStepHook.clearEvents,
                setPendingControl: stepByStepHook.setPendingControl,
            },
        },
        dispatch: {
            chat: chatHook.dispatch,
            step: stepByStepHook.dispatch,
        },
        chat: chatHook.chat,
        stepByStep: stepByStepHook.stepByStep,
    };
};
