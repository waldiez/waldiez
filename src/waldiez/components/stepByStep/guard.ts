/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointCleared,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugHelp,
    WaldiezDebugInputRequest,
    WaldiezDebugMessage,
    WaldiezDebugStats,
} from "@waldiez/components/stepByStep/types";

export const isDebugInputRequest = (m: WaldiezDebugMessage): m is WaldiezDebugInputRequest =>
    Boolean(
        m &&
            m.type === "debug_input_request" &&
            typeof m.request_id === "string" &&
            typeof m.prompt === "string",
    );

export const isDebugEventInfo = (m: WaldiezDebugMessage): m is WaldiezDebugEventInfo =>
    Boolean(
        m &&
            (m.type === "debug_event_info" || m.type === "event_info") &&
            m.event &&
            typeof m.event === "object",
    );

export const isDebugStats = (m: WaldiezDebugMessage): m is WaldiezDebugStats =>
    Boolean(m && (m.type === "debug_stats" || m.type === "stats") && m.stats && typeof m.stats === "object");

export const isDebugHelp = (m: WaldiezDebugMessage): m is WaldiezDebugHelp =>
    Boolean(m && (m.type === "debug_help" || m.type === "help") && Array.isArray(m.help));

export const isDebugError = (m: WaldiezDebugMessage): m is WaldiezDebugError =>
    Boolean(m && (m.type === "debug_error" || m.type === "error") && typeof m.error === "string");

export const isDebugBreakpointsList = (m: WaldiezDebugMessage): m is WaldiezDebugBreakpointsList =>
    Boolean(
        m &&
            (m.type === "debug_breakpoints_list" || m.type === "breakpoints_list") &&
            Array.isArray(m.breakpoints),
    );

export const isDebugBreakpointAdded = (m: WaldiezDebugMessage): m is WaldiezDebugBreakpointAdded =>
    Boolean(
        m &&
            (m.type === "debug_breakpoint_added" || m.type === "breakpoint_added") &&
            m.breakpoint &&
            (typeof m.breakpoint === "object" || typeof m.breakpoint === "string"),
    );

export const isDebugBreakpointRemoved = (m: WaldiezDebugMessage): m is WaldiezDebugBreakpointRemoved =>
    Boolean(
        m &&
            (m.type === "debug_breakpoint_removed" || m.type === "breakpoint_removed") &&
            m.breakpoint &&
            (typeof m.breakpoint === "object" || typeof m.breakpoint === "string"),
    );

export const isDebugBreakpointCleared = (m: WaldiezDebugMessage): m is WaldiezDebugBreakpointCleared =>
    Boolean(
        m &&
            (m.type === "debug_breakpoint_cleared" || m.type === "breakpoint_cleared") &&
            typeof m.message === "string",
    );
