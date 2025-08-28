/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    WaldiezChatUserInput,
    WaldiezDebugInputResponse,
    WaldiezStepByStep,
    WaldiezTimelineData,
} from "@waldiez/components";
import { WaldiezChatMessage, WaldiezChatParticipant } from "@waldiez/types";

import { useMessageHandler } from "./messageHandler";
import { useWebSocketSender } from "./sender";
import { WaldiezWrapperActions, WaldiezWrapperState } from "./types";
import { useUIMessageProcessor } from "./uiProcessor";
import { useWebsocket } from "./ws";

export const useWaldiezWrapper = ({
    flowId,
    wsUrl = "ws://localhost:8765",
    onError = undefined,
}: {
    flowId: string;
    wsUrl: string;
    onError?: (error: any) => void;
}): [WaldiezWrapperState, WaldiezWrapperActions] => {
    // Workflow state
    const [isRunning, setIsRunning] = useState(false);
    const [isDebugging, setIsDebugging] = useState(false);
    const [participants, setParticipants] = useState<WaldiezChatParticipant[]>([]);
    const [timeline, setTimeline] = useState<WaldiezTimelineData | undefined>(undefined);
    const [messages, setMessages] = useState<WaldiezChatMessage[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [inputPrompt, setInputPrompt] = useState<
        | {
              prompt: string;
              request_id: string;
              password?: boolean;
          }
        | undefined
    >(undefined);

    const { sendJson, connected, setMessageHandler } = useWebsocket({
        wsUrl,
        onError: e => console.error("WebSocket error:", e),
        autoPingMs: 25000,
    });

    // Message handler - manages sessions and triggers state changes
    const { handleMessage, getSessionId, getPendingInputId, clearPendingInput } = useMessageHandler({
        onRunStart: () => {
            setIsRunning(true);
            setIsDebugging(false);
        },
        onDebugStart: () => {
            setIsRunning(false);
            setIsDebugging(true);
        },
        onWorkflowComplete: () => {
            // setIsRunning(false);
            // setIsDebugging(false);
            setInputPrompt(undefined);
        },
        onError: errorMsg => {
            setError(errorMsg);
            setIsRunning(false);
            setIsDebugging(false);
            setInputPrompt(undefined);
            onError?.(errorMsg);
        },
    });

    // WebSocket sender - pure actions
    const {
        runWorkflow,
        stepRunWorkflow,
        sendDebugControl,
        sendDebugUserInput,
        sendUserInput,
        stopWorkflow,
        saveFlow,
        convertWorkflow,
        uploadFiles,
    } = useWebSocketSender({
        sendJson,
        getSessionId,
        getPendingInputId,
        clearPendingInput,
    });

    // Step-by-step state - simplified to avoid infinite loops
    const [stepByStepState, setStepByStepState] = useState<WaldiezStepByStep>(() => ({
        active: false,
        stepMode: false,
        autoContinue: false,
        breakpoints: [],
        eventHistory: [],
        pendingControlInput: null,
        activeRequest: null,
        handlers: {
            sendControl: () => {}, // Will be updated by main.tsx
            respond: () => {}, // Will be updated by main.tsx
            close: () => {
                setStepByStepState(prev => ({
                    ...prev,
                    active: false,
                    stepMode: false,
                    autoContinue: false,
                    breakpoints: [],
                    eventHistory: [],
                    pendingControlInput: null,
                    activeRequest: null,
                }));
            },
        },
    }));

    // Create the current step-by-step state with live handlers and debugging status
    const currentStepByStepState = useMemo(
        () => ({
            ...stepByStepState,
            active: isDebugging,
            handlers: {
                ...stepByStepState.handlers,
                sendControl: (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => {
                    sendDebugControl(input);
                    setStepByStepState(prev => ({
                        ...prev,
                        pendingControlInput: null,
                        activeRequest: null,
                    }));
                },
                respond: (response: WaldiezChatUserInput) => {
                    sendDebugUserInput(response);
                    setStepByStepState(prev => ({
                        ...prev,
                        activeRequest: null,
                        pendingControlInput: null,
                    }));
                },
            },
        }),
        [stepByStepState, isDebugging, sendDebugControl, sendDebugUserInput],
    );

    // UI message processor - handles UI-specific message processing
    const { processUIMessage } = useUIMessageProcessor({
        flowId,
        isRunning,
        isDebugging,
        setTimeline,
        setMessages,
        setParticipants,
        setInputPrompt,
        setError,
        getPendingInputId,
        stepByStepState,
        setStepByStepState,
    });

    // Main WebSocket message handler
    const onWsMessage = useCallback(
        (event: MessageEvent) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch {
                return;
            }
            if (!data || typeof data !== "object" || !("type" in data)) {
                return;
            }

            // Process message for session/state management
            handleMessage(data);

            // Process message for UI updates
            processUIMessage(data);
        },
        [handleMessage, processUIMessage],
    );

    // Register message handler
    useEffect(() => {
        setMessageHandler(onWsMessage);
    }, [onWsMessage, setMessageHandler]);

    // Reset function
    const reset = useCallback(() => {
        setMessages([]);
        setParticipants([]);
        setInputPrompt(undefined);
        setError(null);
        clearPendingInput();
        // Reset step-by-step state
        setStepByStepState(prev => ({
            ...prev,
            eventHistory: [],
            pendingControlInput: null,
            activeRequest: null,
        }));
    }, [clearPendingInput]);

    // Public API
    const handleRun = useCallback(
        (flow: string) => {
            reset();
            runWorkflow(flow);
        },
        [reset, runWorkflow],
    );

    const handleStepRun = useCallback(
        (flow: string, opts?: { auto_continue?: boolean; breakpoints?: string[] }) => {
            reset();
            stepRunWorkflow(flow, opts);
        },
        [reset, stepRunWorkflow],
    );

    const handleUserInput = useCallback(
        (input: WaldiezChatUserInput) => {
            sendUserInput(input);
        },
        [sendUserInput],
    );

    return [
        {
            timeline,
            messages,
            participants,
            isRunning,
            isDebugging,
            connected,
            error,
            inputPrompt,
            stepByStepState: currentStepByStepState,
        },
        {
            run: handleRun,
            stepRun: handleStepRun,
            stop: stopWorkflow,
            save: saveFlow,
            upload: uploadFiles,
            convert: convertWorkflow,
            userInput: handleUserInput,
            sendMessage: sendJson,
            reset,
        },
    ];
};
