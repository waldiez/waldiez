/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type {
    WaldiezActiveRequest,
    WaldiezChatConfig,
    WaldiezChatError,
    WaldiezChatHandlers,
    WaldiezChatMessage,
    WaldiezChatParticipant,
} from "@waldiez/components/chatUI/types";
import { getMessageString } from "@waldiez/components/chatUI/utils/toString";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export type WaldiezChatAction =
    | { type: "RESET"; config?: WaldiezChatConfig }
    | { type: "SET_ACTIVE"; active: boolean }
    | { type: "SET_SHOW"; show: boolean }
    | { type: "SET_ERROR"; error?: WaldiezChatError }
    | { type: "ADD_MESSAGE"; message: WaldiezChatMessage; isEndOfWorkflow?: boolean }
    | { type: "REMOVE_MESSAGE"; id: string }
    | { type: "CLEAR_MESSAGES" }
    | { type: "SET_TIMELINE"; timeline?: WaldiezTimelineData }
    | { type: "SET_PARTICIPANTS"; participants: WaldiezChatParticipant[] }
    | { type: "SET_ACTIVE_REQUEST"; request?: WaldiezActiveRequest; message?: WaldiezChatMessage }
    | { type: "SET_CHAT_HANDLERS"; handlers?: Partial<WaldiezChatHandlers> | undefined }
    | { type: "SET_STATE"; state: Partial<WaldiezChatConfig> }
    | { type: "DONE" };

export const waldiezChatReducer = (
    state: WaldiezChatConfig,
    action: WaldiezChatAction,
): WaldiezChatConfig => {
    switch (action.type) {
        case "RESET":
            if (action.config) {
                return { ...action.config };
            }
            return {
                show: false,
                active: false,
                messages: [],
                userParticipants: [],
                activeRequest: undefined,
                error: undefined,
                timeline: undefined,
                mediaConfig: undefined,
                handlers: state.handlers,
            };
        case "SET_ACTIVE":
            return { ...state, active: action.active };
        case "SET_SHOW":
            return { ...state, show: action.show };
        case "SET_ERROR":
            return { ...state, error: action.error };
        case "ADD_MESSAGE":
            if (action.message.type === "error") {
                return {
                    ...state,
                    error: {
                        message: getMessageString(action.message),
                    },
                    messages: [...state.messages, action.message],
                };
            }
            return {
                ...state,
                active: action.isEndOfWorkflow !== true,
                messages: [...state.messages, action.message],
            };
        case "REMOVE_MESSAGE":
            return {
                ...state,
                messages: [...state.messages].filter(message => message.id !== action.id),
            };
        case "CLEAR_MESSAGES":
            return {
                ...state,
                messages: [],
            };
        case "SET_ACTIVE_REQUEST":
            return {
                ...state,
                activeRequest: action.request,
                messages: action.message ? [...state.messages, action.message] : state.messages,
            };
        case "SET_PARTICIPANTS":
            return {
                ...state,
                show: true,
                active: true,
                activeRequest: undefined,
                userParticipants: action.participants.filter(participant => participant.isUser),
            };
        case "SET_TIMELINE":
            return {
                ...state,
                show: true,
                active: false,
                activeRequest: undefined,
                timeline: action.timeline,
            };
        /* c8 ignore next -- @preserve */
        case "SET_CHAT_HANDLERS":
            return {
                ...state,
                handlers: {
                    ...state.handlers,
                    ...action.handlers,
                },
            };
        /* c8 ignore next -- @preserve */
        case "SET_STATE":
            return {
                ...state,
                ...action.state,
            };
        /* c8 ignore next -- @preserve */
        case "DONE":
            return {
                ...state,
                active: false,
                activeRequest: undefined,
            };
        /* c8 ignore next -- @preserve */
        default:
            return state;
    }
};
