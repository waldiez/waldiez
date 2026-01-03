/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
/* eslint-disable max-statements,complexity */
import { type Dispatch, useCallback, useMemo, useReducer, useRef } from "react";

import type { WaldiezActiveRequest, WaldiezChatParticipant } from "@waldiez/components/chatUI/types";
import type {
    WaldiezBreakpoint,
    WaldiezStepByStep,
    WaldiezStepHandlers,
} from "@waldiez/components/stepByStep/types";
import { getEventKey } from "@waldiez/components/stepByStep/utils";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import {
    WORKFLOW_DONE,
    type WaldiezChatMessageProcessingResult,
    WaldiezChatMessageProcessor,
} from "@waldiez/utils/chat";
import { WaldiezStepByStepProcessor } from "@waldiez/utils/stepByStep/processor";
import { type WaldiezStepByStepAction, waldiezStepByStepReducer } from "@waldiez/utils/stepByStep/reducer";
import type { WaldiezStepByStepProcessingResult } from "@waldiez/utils/stepByStep/types";

/**
 * Options for message deduplication
 */
export type WaldiezStepByStepMessageDeduplicationOptions = {
    enabled?: boolean;
    keyGenerator?: (event: Record<string, unknown>) => string;
    maxCacheSize?: number;
};

/**
 * Default deduplication options
 */
const defaultStepByStepDeduplicationOptions: Required<WaldiezStepByStepMessageDeduplicationOptions> = {
    enabled: true,
    keyGenerator: getEventKey,
    maxCacheSize: 1000,
};

export const defaultStepByStep: WaldiezStepByStep = {
    show: false,
    active: false,
    stepMode: true,
    autoContinue: false,
    currentEvent: undefined,
    pendingControlInput: undefined,
    activeRequest: undefined,
    eventHistory: [],
    participants: [],
    breakpoints: [],
    lastError: undefined,
    timeline: undefined,
    stats: undefined,
    help: undefined,
    handlers: undefined,
};

const noOp = () => {};

/**
 * useWaldiezChat hook.
 */
export const useWaldiezStepByStep: (props: {
    initialConfig?: Partial<WaldiezStepByStep>;
    handlers?: Partial<WaldiezStepHandlers>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
}) => {
    stepByStep: WaldiezStepByStep;
    dispatch: Dispatch<WaldiezStepByStepAction>;
    process: (data: any) => void;
    reset: () => void;
    setActive: (active: boolean) => void;
    setShow: (show: boolean) => void;
    setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
    setPendingControl: (controlInput: { request_id: string; prompt: string } | undefined) => void;
    setBreakpoints: (breakpoints: (string | WaldiezBreakpoint)[]) => void;
    setError: (error: string | undefined) => void;
    setTimeline: (timeline: WaldiezTimelineData) => void;
    setParticipants: (participants: WaldiezChatParticipant[]) => void;
    addEvent: (event: Record<string, unknown>) => void;
    removeEvent: (id: string) => void;
    clearEvents: () => void;
} = (props: {
    initialConfig?: Partial<WaldiezStepByStep>;
    handlers?: Partial<WaldiezStepHandlers>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezStepByStepMessageDeduplicationOptions;
}) => {
    const { initialConfig, handlers, preprocess, deduplicationOptions } = props;
    const initialHandlers = useMemo<WaldiezStepHandlers>(
        () => ({
            onStart: handlers?.onStart || initialConfig?.handlers?.onStart || noOp,
            close: handlers?.close || initialConfig?.handlers?.close || noOp,
            sendControl: handlers?.sendControl || initialConfig?.handlers?.close || noOp,
            respond: handlers?.respond || initialConfig?.handlers?.respond || noOp,
        }),
        [initialConfig, handlers],
    );
    const initial = useMemo<WaldiezStepByStep>(
        () => ({
            ...defaultStepByStep,
            ...initialConfig,
            handlers: initialHandlers,
        }),
        [initialConfig, initialHandlers],
    );
    const [config, dispatch] = useReducer(waldiezStepByStepReducer, initial);
    const initialConfigRef = useRef<WaldiezStepByStep>(initial);
    const eventKeysRef = useRef<Set<string>>(new Set());
    const dedupeOptions = useMemo(
        () => ({
            ...defaultStepByStepDeduplicationOptions,
            ...deduplicationOptions,
        }),
        [deduplicationOptions],
    );
    const isEventDuplicate = useCallback(
        (event: Record<string, unknown>): boolean => {
            if (!dedupeOptions.enabled) {
                return false;
            }

            const eventKey = dedupeOptions.keyGenerator(event);

            if (eventKeysRef.current.has(eventKey)) {
                return true;
            }

            // Add to cache
            eventKeysRef.current.add(eventKey);

            // limit cache size
            if (eventKeysRef.current.size > dedupeOptions.maxCacheSize) {
                const keysArray = Array.from(eventKeysRef.current);
                const keep = keysArray.slice(-Math.floor(dedupeOptions.maxCacheSize * 0.8));
                eventKeysRef.current.clear();
                for (const k of keep) {
                    eventKeysRef.current.add(k);
                }
            }

            return false;
        },
        [dedupeOptions],
    );
    const clearEventsCache = useCallback(() => {
        eventKeysRef.current.clear();
    }, []);
    const setActive = useCallback((active: boolean) => {
        dispatch({ type: "SET_ACTIVE", active });
    }, []);

    const setShow = useCallback((show: boolean) => {
        dispatch({ type: "SET_SHOW", show });
    }, []);

    const setTimeline = useCallback((timeline: WaldiezTimelineData | undefined) => {
        dispatch({ type: "SET_TIMELINE", timeline });
    }, []);

    const setParticipants = useCallback((participants: WaldiezChatParticipant[]) => {
        dispatch({ type: "SET_PARTICIPANTS", participants });
    }, []);

    const setActiveRequest = useCallback((request: WaldiezActiveRequest | undefined) => {
        dispatch({ type: "SET_ACTIVE_REQUEST", request });
    }, []);

    const setPendingControl = useCallback(
        (controlInput: { request_id: string; prompt: string } | undefined) => {
            dispatch({ type: "SET_PENDING_CONTROL_INPUT", controlInput });
        },
        [],
    );

    const setError = useCallback((error: string | undefined, markInactive?: boolean) => {
        dispatch({ type: "SET_ERROR", error, markInactive });
    }, []);

    const setAutoContinue = useCallback((autoContinue: boolean) => {
        dispatch({ type: "SET_AUTO_CONTINUE", autoContinue });
    }, []);

    const setBreakpoints = useCallback((breakpoints: (string | WaldiezBreakpoint)[]) => {
        dispatch({ type: "SET_BREAKPOINTS", breakpoints });
    }, []);

    const addEvent = useCallback(
        (event: Record<string, unknown>) => {
            if (isEventDuplicate(event)) {
                return;
            }
            dispatch({ type: "ADD_EVENT", event, makeItCurrent: true });
        },
        [isEventDuplicate],
    );

    const addEvents = useCallback(
        (events: Record<string, unknown>[]) => {
            const newEvents: Record<string, unknown>[] = [];
            for (const event of events) {
                if (!isEventDuplicate(event)) {
                    newEvents.push(event);
                }
            }
            dispatch({ type: "ADD_EVENTS", events: newEvents, makeLastCurrent: true });
        },
        [isEventDuplicate],
    );

    const removeEvent = useCallback(
        (id: string) => {
            const eventToRemove = config.eventHistory.find(evt => getEventKey(evt) === id);
            if (eventToRemove && dedupeOptions.enabled) {
                const messageKey = dedupeOptions.keyGenerator(eventToRemove);
                eventKeysRef.current.delete(messageKey);
            }
            dispatch({ type: "REMOVE_EVENT", id });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dedupeOptions],
    );

    const clearEvents = useCallback(() => {
        dispatch({ type: "CLEAR_EVENTS" });
        clearEventsCache();
    }, [clearEventsCache]);

    const reset = useCallback(() => {
        dispatch({ type: "RESET", config: { ...initialConfigRef.current, handlers: initialHandlers } });
        clearEventsCache();
    }, [clearEventsCache, initialHandlers]);

    const handleProcessorResult = useCallback(
        (result: WaldiezStepByStepProcessingResult) => {
            if (result.stateUpdate?.participants) {
                setParticipants(result.stateUpdate.participants);
                return;
            }
            if (result.stateUpdate?.timeline) {
                setTimeline(result.stateUpdate.timeline);
                return;
            }
            if (result.stateUpdate?.pendingControlInput) {
                setPendingControl(result.stateUpdate.pendingControlInput);
                return;
            }
            if (result.stateUpdate?.activeRequest) {
                setActiveRequest(result.stateUpdate.activeRequest);
                return;
            }
            if (result.stateUpdate?.autoContinue) {
                setAutoContinue(result.stateUpdate.autoContinue);
                return;
            }
            if (result.error || result.stateUpdate?.lastError) {
                setError(
                    result.error ? result.error.message : result.stateUpdate?.lastError,
                    result.isWorkflowEnd,
                );
                return;
            }
            if (result.stateUpdate?.eventHistory) {
                addEvents(result.stateUpdate?.eventHistory);
            }
        },
        [
            setError,
            setParticipants,
            setActiveRequest,
            setTimeline,
            setPendingControl,
            setAutoContinue,
            addEvents,
        ],
    );
    const handleChatProcessorResult = useCallback(
        (result: WaldiezChatMessageProcessingResult) => {
            if (result.participants) {
                setParticipants(result.participants);
                return;
            }
            if (result.timeline) {
                setTimeline(result.timeline);
                return;
            }
            if (result.message && result.message.type === "input_request") {
                const prompt = result.message.prompt || "Enter your message:";
                const password = Boolean(result.message.password) || false;
                setActiveRequest({
                    request_id:
                        result.requestId ||
                        result.message?.request_id ||
                        config.activeRequest?.request_id ||
                        "<unknown>",
                    prompt,
                    password,
                });
                return;
            }
            if (result.message) {
                addEvent(result.message);
            }
        },
        [addEvent, setParticipants, setTimeline, setActiveRequest, config.activeRequest?.request_id],
    );

    const isWorkflowDone = useCallback((data: any) => {
        if (typeof data === "string" && WORKFLOW_DONE.includes(data)) {
            return true;
        }
        if (typeof data === "object" && data) {
            if ("data" in data && typeof data.data === "string" && WORKFLOW_DONE.includes(data.data)) {
                return true;
            }
            if (
                "content" in data &&
                typeof data.content === "string" &&
                WORKFLOW_DONE.includes(data.content)
            ) {
                return true;
            }
        }
        return false;
    }, []);

    const process = useCallback(
        (data: any) => {
            let dataToProcess = data;
            if (typeof preprocess === "function") {
                const { handled, updated } = preprocess(data);
                if (handled || !updated) {
                    return;
                }
                dataToProcess = updated;
            }
            if (isWorkflowDone(dataToProcess)) {
                dispatch({ type: "DONE" });
                return;
            }
            try {
                const result = WaldiezStepByStepProcessor.process(dataToProcess);
                if (!result) {
                    const chatResult = WaldiezChatMessageProcessor.process(dataToProcess);
                    if (!chatResult) {
                        return;
                    }
                    handleChatProcessorResult(chatResult);
                    return;
                }
                handleProcessorResult(result);
            } catch (error) {
                const msg = (error as Error).message;
                // console.error("Failed to process chat data:", error);
                setError(msg);
            }
        },
        [preprocess, setError, handleChatProcessorResult, handleProcessorResult, isWorkflowDone],
    );

    return {
        stepByStep: config,
        dispatch,
        process,
        reset,
        setActive,
        setShow,
        setActiveRequest,
        setPendingControl,
        setBreakpoints,
        setError,
        setTimeline,
        setParticipants,
        addEvent,
        removeEvent,
        clearEvents,
    };
};
