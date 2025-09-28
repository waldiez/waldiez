/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type Dispatch, useCallback, useMemo, useReducer, useRef } from "react";

import type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatParticipant,
} from "@waldiez/components/chatUI/types";
import { getMessageKey } from "@waldiez/components/chatUI/utils/messageKey";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";
import { WORKFLOW_DONE } from "@waldiez/utils/chat/constants";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat/processor";
import { type WaldiezChatAction, waldiezChatReducer } from "@waldiez/utils/chat/reducer";
import type { WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

/**
 * Default chat configuration
 */
export const defaultChatConfig: WaldiezChatConfig = {
    show: false,
    active: false,
    messages: [],
    userParticipants: [],
    activeRequest: undefined,
    error: undefined,
    handlers: undefined,
    timeline: undefined,
    mediaConfig: undefined,
};

/**
 * Options for message deduplication
 */
export type WaldiezChatMessageDeduplicationOptions = {
    enabled?: boolean;
    keyGenerator?: (message: WaldiezChatMessage) => string;
    maxCacheSize?: number;
};

/**
 * Default deduplication options
 */
const defaultChatDeduplicationOptions: Required<WaldiezChatMessageDeduplicationOptions> = {
    enabled: true,
    keyGenerator: getMessageKey,
    maxCacheSize: 1000,
};

/**
 * useWaldiezChat hook.
 */
export const useWaldiezChat: (props: {
    initialConfig?: Partial<WaldiezChatConfig>;
    handlers?: Partial<WaldiezChatHandlers>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
}) => {
    chat: WaldiezChatConfig;
    dispatch: Dispatch<WaldiezChatAction>;
    process: (message: any) => void;
    reset: () => void;
    setActive: (active: boolean) => void;
    setShow: (show: boolean) => void;
    setActiveRequest: (request: WaldiezActiveRequest | undefined) => void;
    setError: (error: WaldiezChatError | undefined) => void;
    setTimeline: (timeline: WaldiezTimelineData | undefined) => void;
    setParticipants: (participants: WaldiezChatParticipant[]) => void;
    addMessage: (message: WaldiezChatMessage) => void;
    removeMessage: (messageId: string) => void;
    clearMessages: () => void;
} = (props: {
    initialConfig?: Partial<WaldiezChatConfig>;
    handlers?: Partial<WaldiezChatHandlers>;
    preprocess?: (message: any) => { handled: boolean; updated?: any };
    onPreview?: (requestId: string) => string;
    deduplicationOptions?: WaldiezChatMessageDeduplicationOptions;
}) => {
    const { initialConfig, handlers, preprocess, onPreview, deduplicationOptions } = props;
    const initial = useMemo<WaldiezChatConfig>(
        () => ({
            ...defaultChatConfig,
            ...initialConfig,
            handlers: {
                ...(initialConfig?.handlers ?? {}),
                ...(handlers ?? {}),
            },
        }),
        [initialConfig, handlers],
    );
    const [config, dispatch] = useReducer(waldiezChatReducer, initial);
    const initialConfigRef = useRef<WaldiezChatConfig>(initial);
    const messageKeysRef = useRef<Set<string>>(new Set());
    const dedupeOptions = useMemo(
        () => ({
            ...defaultChatDeduplicationOptions,
            ...deduplicationOptions,
        }),
        [deduplicationOptions],
    );
    const isMessageDuplicate = useCallback(
        (message: WaldiezChatMessage): boolean => {
            if (!dedupeOptions.enabled) {
                return false;
            }

            const messageKey = dedupeOptions.keyGenerator(message);

            if (messageKeysRef.current.has(messageKey)) {
                return true;
            }

            // Add to cache
            messageKeysRef.current.add(messageKey);

            // limit cache size
            if (messageKeysRef.current.size > dedupeOptions.maxCacheSize) {
                const keysArray = Array.from(messageKeysRef.current);
                const keep = keysArray.slice(-Math.floor(dedupeOptions.maxCacheSize * 0.8));
                messageKeysRef.current.clear();
                for (const k of keep) {
                    messageKeysRef.current.add(k);
                }
            }

            return false;
        },
        [dedupeOptions],
    );

    const clearMessageCache = useCallback(() => {
        messageKeysRef.current.clear();
    }, []);

    const setActiveRequest = useCallback(
        (request: WaldiezActiveRequest | undefined, message?: WaldiezChatMessage) => {
            dispatch({ type: "SET_ACTIVE_REQUEST", request, message });
        },
        [],
    );

    const setError = useCallback((error: WaldiezChatError | undefined) => {
        dispatch({ type: "SET_ERROR", error });
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

    const addMessage = useCallback(
        (message: WaldiezChatMessage, isEndOfWorkflow?: boolean) => {
            if (isMessageDuplicate(message)) {
                return;
            }
            dispatch({ type: "ADD_MESSAGE", message, isEndOfWorkflow });
        },
        [isMessageDuplicate],
    );

    const removeMessage = useCallback(
        (id: string) => {
            const messageToRemove = config.messages.find(msg => msg.id === id);
            if (messageToRemove && dedupeOptions.enabled) {
                const messageKey = dedupeOptions.keyGenerator(messageToRemove);
                messageKeysRef.current.delete(messageKey);
            }
            dispatch({ type: "REMOVE_MESSAGE", id });
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [dedupeOptions],
    );

    const clearMessages = useCallback(() => {
        dispatch({ type: "CLEAR_MESSAGES" });
        clearMessageCache();
    }, [clearMessageCache]);

    const reset = useCallback(() => {
        dispatch({ type: "RESET", config: initialConfigRef.current });
        clearMessageCache();
    }, [clearMessageCache]);

    const handleProcessorResult = useCallback(
        (result: WaldiezChatMessageProcessingResult) => {
            // console.debug("Result: ", result);
            if (result.timeline) {
                setTimeline(result.timeline);
                return;
            }
            if (result.participants) {
                setParticipants(result.participants);
                return;
            }
            if (result.message && result.message.type === "input_request") {
                const prompt = result.message.prompt || "Enter your message:";
                const password = Boolean(result.message.password) || false;
                setActiveRequest(
                    {
                        request_id:
                            result.requestId ||
                            result.message?.request_id ||
                            config.activeRequest?.request_id ||
                            "<unknown>",
                        prompt,
                        password,
                    },
                    result.message,
                );
                return;
            }
            if (result.message) {
                addMessage(result.message, result.isWorkflowEnd);
            }
        },
        [addMessage, config.activeRequest?.request_id, setActiveRequest, setParticipants, setTimeline],
    );

    const process = useCallback(
        // eslint-disable-next-line max-statements
        (data: any) => {
            const requestId = config.activeRequest?.request_id;
            const previewUrl = requestId ? onPreview?.(requestId) : undefined;
            let dataToProcess = data;
            if (typeof preprocess === "function") {
                const { handled, updated } = preprocess(data);
                if (handled || !updated) {
                    return;
                }
                dataToProcess = updated;
            }
            if (typeof dataToProcess === "string" && dataToProcess.includes(WORKFLOW_DONE)) {
                dispatch({ type: "SET_ACTIVE", active: false });
                return;
            }
            try {
                const result = WaldiezChatMessageProcessor.process(dataToProcess, requestId, previewUrl);
                if (!result) {
                    return;
                }
                handleProcessorResult(result);
            } catch (error) {
                const msg = (error as Error).message;
                setError({
                    message: msg,
                    code: "PROCESSING_ERROR",
                });
            }
        },
        [config.activeRequest?.request_id, handleProcessorResult, preprocess, onPreview, setError],
    );

    return {
        chat: config,
        dispatch,
        process,
        reset,
        setActive,
        setShow,
        setActiveRequest,
        setError,
        setTimeline,
        setParticipants,
        addMessage,
        removeMessage,
        clearMessages,
    };
};
