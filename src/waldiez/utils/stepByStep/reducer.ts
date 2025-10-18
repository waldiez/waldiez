/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
import type { WaldiezActiveRequest, WaldiezChatParticipant } from "@waldiez/components/chatUI/types";
import type {
    WaldiezBreakpoint,
    WaldiezDebugHelpCommandGroup,
    WaldiezDebugStats,
    WaldiezStepByStep,
    WaldiezStepHandlers,
} from "@waldiez/components/stepByStep/types";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export type WaldiezStepByStepAction =
    | { type: "RESET"; config?: WaldiezStepByStep }
    | { type: "SET_SHOW"; show: boolean }
    | { type: "SET_ACTIVE"; active: boolean }
    | { type: "SET_STEP_MODE"; mode: boolean }
    | { type: "SET_AUTO_CONTINUE"; autoContinue: boolean }
    | { type: "SET_ERROR"; error?: string; markInactive?: boolean }
    | { type: "SET_BREAKPOINTS"; breakpoints: (string | WaldiezBreakpoint)[] }
    | { type: "SET_STATS"; stats: WaldiezDebugStats | undefined }
    | { type: "SET_HELP"; help: WaldiezDebugHelpCommandGroup[] | undefined }
    | { type: "SET_PARTICIPANTS"; participants: WaldiezChatParticipant[] }
    | { type: "SET_TIMELINE"; timeline?: WaldiezTimelineData }
    | { type: "SET_CURRENT_EVENT"; event?: Record<string, unknown> }
    | { type: "SET_PENDING_CONTROL_INPUT"; controlInput?: { request_id: string; prompt: string } | null }
    | { type: "SET_ACTIVE_REQUEST"; request?: WaldiezActiveRequest }
    | { type: "SET_STEP_HANDLERS"; handlers?: WaldiezStepHandlers }
    | { type: "ADD_EVENT"; event: Record<string, unknown>; makeItCurrent?: boolean }
    | { type: "ADD_EVENTS"; events: Record<string, unknown>[]; makeLastCurrent?: boolean }
    | { type: "REMOVE_EVENT"; id: string }
    | { type: "CLEAR_EVENTS" }
    | { type: "SET_STATE"; state: Partial<WaldiezStepByStep> }
    | { type: "DONE" };

export const waldiezStepByStepReducer = (
    state: WaldiezStepByStep,
    action: WaldiezStepByStepAction,
): WaldiezStepByStep => {
    switch (action.type) {
        case "RESET":
            if (action.config) {
                return { ...action.config };
            }
            return {
                show: false,
                active: false,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
                eventHistory: [],
                participants: [],
                currentEvent: undefined,
                activeRequest: undefined,
                pendingControlInput: undefined,
                timeline: undefined,
                lastError: undefined,
                stats: undefined,
                help: undefined,
                handlers: state.handlers,
            };
        case "SET_ACTIVE":
            return { ...state, active: action.active };
        case "SET_SHOW":
            return { ...state, show: action.show };
        case "SET_ERROR":
            if (action.markInactive === true) {
                return { ...state, lastError: action.error, active: false };
            }
            return { ...state, lastError: action.error };
        case "SET_STEP_MODE":
            return { ...state, stepMode: action.mode };
        case "SET_AUTO_CONTINUE":
            return { ...state, autoContinue: action.autoContinue };
        case "SET_PARTICIPANTS":
            return { ...state, show: true, active: true, participants: action.participants };
        case "SET_TIMELINE":
            return { ...state, show: true, active: false, timeline: action.timeline };
        case "SET_BREAKPOINTS":
            return { ...state, breakpoints: action.breakpoints };
        case "SET_CURRENT_EVENT":
            return { ...state, currentEvent: action.event };
        case "SET_PENDING_CONTROL_INPUT":
            return { ...state, pendingControlInput: action.controlInput };
        case "SET_ACTIVE_REQUEST":
            return { ...state, activeRequest: action.request };
        case "SET_HELP":
            return { ...state, help: action.help };
        case "SET_STATS":
            return { ...state, stats: action.stats };
        case "SET_STEP_HANDLERS":
            return { ...state, handlers: action.handlers };
        case "CLEAR_EVENTS":
            return { ...state, eventHistory: [], currentEvent: undefined };
        case "ADD_EVENT":
            if (action.makeItCurrent === true) {
                return {
                    ...state,
                    eventHistory: [action.event, ...state.eventHistory],
                    currentEvent: action.event,
                };
            }
            return {
                ...state,
                eventHistory: [action.event, ...state.eventHistory],
            };
        case "ADD_EVENTS":
            if (action.events.length < 1) {
                return state;
            }
            if (action.makeLastCurrent === true) {
                const lastEvent = action.events[action.events.length - 1];
                return {
                    ...state,
                    eventHistory: [...action.events.reverse(), ...state.eventHistory],
                    currentEvent: lastEvent,
                };
            }
            return {
                ...state,
                eventHistory: [...action.events.reverse(), ...state.eventHistory],
            };
        case "REMOVE_EVENT":
            return {
                ...state,
                eventHistory: [...state.eventHistory].filter(event => event.id || event.uuid !== action.id),
            };
        case "SET_STATE":
            return {
                ...state,
                ...action.state,
            };
        case "DONE":
            return {
                ...state,
                active: false,
                activeRequest: undefined,
                pendingControlInput: undefined,
            };
        default:
            return state;
    }
};
