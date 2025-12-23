/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/*
 * Step-by-step (debug) models for the Waldiez frontend.
 * These mirror the Python models in `step_by_step_models.py` and the
 * messages emitted by `WaldiezStepByStepRunner`.
 */
import type {
    WaldiezActiveRequest,
    WaldiezChatParticipant,
    WaldiezChatUserInput,
} from "@waldiez/components/chatUI/types";
import type { WaldiezTimelineData } from "@waldiez/components/timeline/types";

export type * from "@waldiez/components/stepByStep/event_types";

/**
 * Explicit response codes allowed by the backend for step control.
 */
export type WaldiezDebugResponseCode =
    | ""
    | "c"
    | "s"
    | "r"
    | "q"
    | "i"
    | "h"
    | "st"
    | "ab"
    | "rb"
    | "lb"
    | "cb";

/**
 * Help command info (match Python `WaldiezDebugHelpCommand`).
 */
export type WaldiezDebugHelpCommand = {
    /** List of command aliases, e.g., ["continue","c"] */
    cmds?: string[];
    /** Description */
    desc: string;
};

/**
 * Grouped help commands (match Python `WaldiezDebugHelpCommandGroup`).
 */
export type WaldiezDebugHelpCommandGroup = {
    title: string;
    commands: WaldiezDebugHelpCommand[];
};

/**
 * `debug_print` message
 */
export type WaldiezDebugPrint = {
    type: "debug_print" | "print";
    content: any;
};

/**
 * `debug_input_request` message (sent by backend when waiting for a command/input)
 */
export type WaldiezDebugInputRequest = {
    type: "debug_input_request" | "input_request";
    // cspell: disable-next-line
    prompt: string; // e.g. "[Step] (c)ontinue, (r)un, ..."
    request_id: string; // opaque id; replies must echo this
};

/**
 * `debug_input_response` message (client - backend). Prefer sending this
 * structured form over raw strings so the backend can validate `request_id`.
 */
export type WaldiezDebugInputResponse = {
    type: "debug_input_response" | "input_response";
    request_id: string;
    data: WaldiezDebugResponseCode | string; // allow future prompts
};

export type WaldiezDebugBreakpointsList = {
    type: "debug_breakpoints_list" | "breakpoints_list";
    breakpoints: Array<string | WaldiezBreakpoint>;
};

export type WaldiezDebugBreakpointAdded = {
    type: "debug_breakpoint_added" | "breakpoint_added";
    breakpoint: string | WaldiezBreakpoint;
};

export type WaldiezDebugBreakpointRemoved = {
    type: "debug_breakpoint_removed" | "breakpoint_removed";
    breakpoint: string | WaldiezBreakpoint;
};

export type WaldiezDebugBreakpointCleared = {
    type: "debug_breakpoint_cleared" | "breakpoint_cleared";
    message: string;
};

/**
 * `debug_event_info` message (backend - client)
 * Contains the raw event payload emitted by the runner.
 */
export type WaldiezDebugEventInfo = {
    type: "debug_event_info" | "event_info";
    event: Record<string, unknown>; // opaque; consumer can pretty-print
};

export type WaldiezDebugStats = {
    events_processed: number;
    total_events: number;
    step_mode: boolean;
    auto_continue: boolean;
    breakpoints: string[];
    event_history_count: number;
    // Allow future extensions without breaking consumers
    [k: string]: unknown;
};

/**
 * `debug_stats` message (backend - client)
 */
export type WaldiezDebugStatsMessage = {
    type: "debug_stats" | "stats";
    stats: WaldiezDebugStats;
};

/**
 * `debug_help` message (backend - client)
 */
export type WaldiezDebugHelpMessage = {
    type: "debug_help" | "help";
    help: WaldiezDebugHelpCommandGroup[];
};

/**
 * `debug_error` message (backend - client)
 */
export type WaldiezDebugError = {
    type: "debug_error" | "error";
    error: string;
};

/**
 * Discriminated union of all step-by-step debug messages.
 * (Matches Python `WaldiezDebugMessage` union, discriminator `type`).
 */
export type WaldiezDebugMessage =
    | WaldiezDebugPrint
    | WaldiezDebugInputRequest
    | WaldiezDebugInputResponse
    | WaldiezDebugBreakpointsList
    | WaldiezDebugBreakpointAdded
    | WaldiezDebugBreakpointRemoved
    | WaldiezDebugBreakpointCleared
    | WaldiezDebugEventInfo
    | WaldiezDebugStatsMessage
    | WaldiezDebugHelpMessage
    | WaldiezDebugError;

/**
 * Outgoing control commands from UI to the runner.
 */
export type WaldiezDebugControl =
    | { kind: "continue" }
    | { kind: "step" }
    | { kind: "run" }
    | { kind: "quit" }
    | { kind: "info" }
    | { kind: "help" }
    | { kind: "stats" }
    | { kind: "add_breakpoint" }
    | { kind: "remove_breakpoint" }
    | { kind: "list_breakpoints" }
    | { kind: "clear_breakpoints" }
    | { kind: "raw"; value: string };

/**
 * Maps a UI-level control to the wire-level `response` string.
 */
export function controlToResponse(control: WaldiezDebugControl | string): string {
    if (typeof control === "string") {
        return control;
    }
    if (
        typeof control !== "object" ||
        control === null ||
        !("kind" in control) ||
        typeof control.kind !== "string"
    ) {
        return String(control);
    }
    switch (control.kind) {
        case "continue":
            return "c";
        case "step":
            return "s";
        case "run":
            return "r";
        case "quit":
            return "q";
        case "info":
            return "i";
        case "help":
            return "h";
        case "stats":
            return "st";
        case "add_breakpoint":
            return "ab";
        case "remove_breakpoint":
            return "rb";
        case "list_breakpoints":
            return "lb";
        case "clear_breakpoints":
            return "cb";
        case "raw":
            return control.value;
        default: {
            // Exhaustiveness guard
            const _never: never = control as never;
            return String(_never);
        }
    }
}

export type WaldiezBreakpointType = "event" | "agent" | "agent_event" | "all";

/**
 * Breakpoint definition.
 */
export type WaldiezBreakpoint = {
    type: WaldiezBreakpointType;
    event_type?: string; // Required for EVENT and AGENT_EVENT
    agent?: string; // Required for AGENT and AGENT_EVENT
    description?: string; // Human-readable description
};

/**
 * Step-by-step specific handlers for the UI layer.
 * These are distinct from the chat handlers to keep concerns separated.
 * @param sendControl - Send a control command to the backend.
 * @param respond - Respond to an input request (in chat, not control)
 * @param close - Close the panel view.
 */
export type WaldiezStepHandlers = {
    /** optional action to perform when the run starts (like select breakpoints or checkpoint) */
    onStart?: () => void | Promise<void>;
    /** Send a control command (e.g., Continue/Run/Step/Quit/Info/Help/Stats...). */
    sendControl: (input: Pick<WaldiezDebugInputResponse, "request_id" | "data">) => void | Promise<void>;
    /** Send a user input response (not a control command). */
    respond: (response: WaldiezChatUserInput) => void | Promise<void>;
    /** Close the step-by-step session.*/
    close?: () => void | Promise<void>;
};

/**
 * UI state slice for step-by-step mode.
 * @param show - Whether to show the related view
 * @param active - If true, step-by-step mode is active (a flow is running)
 * @param stepMode - Whether step mode is enabled
 * @param autoContinue - Whether auto continue is enabled
 * @param breakpoints - The list of event types to break on
 * @param stats - Last stats snapshot (from `debug_stats`)
 * @param eventHistory - Raw event history accumulated client-side (optional, for UI display)
 * @param currentEvent - The most recent `debug_event_info` payload
 * @param help - Debug help content (from `debug_help`)
 * @param lastError - Last error (from `debug_error`)
 * @param pendingControlInput - Pending input (if backend is waiting). Mirrors `debug_input_request`.
 * @param handlers - Step-by-step specific handlers for UI actions
 */
export type WaldiezStepByStep = {
    // Whether to show the related view
    show: boolean;
    /** If true, step-by-step mode is active (a flow is running) */
    active: boolean;
    /** If true, runner will pause at breakpoints */
    stepMode: boolean;
    /** If true, backend auto-continues without user input */
    autoContinue: boolean;
    /** Event types to break on (empty means break on all) */
    breakpoints: (string | WaldiezBreakpoint)[];
    /**Last stats snapshot (from `debug_stats`).*/
    stats?: WaldiezDebugStats;
    /** Raw event history accumulated client-side */
    eventHistory: Array<Record<string, unknown>>;
    /** The most recent `debug_event_info` payload */
    currentEvent?: Record<string, unknown>;
    /** Debug help content (from `debug_help`) */
    help?: WaldiezDebugHelpCommandGroup[];
    /** Last error (from `debug_error`) */
    lastError?: string;
    /** List of participants in the chat */
    participants?: WaldiezChatParticipant[];
    /** Timeline of events */
    timeline?: WaldiezTimelineData;
    /**
     * Pending control action input. For replying to messages
     * of type `debug_input_request`.
     * Separate from the normal chat's `activeRequest`s.
     */
    pendingControlInput?: {
        request_id: string;
        prompt: string;
    } | null;
    /**
     * Active user's input request. For replying to messages
     * of type `input_request` (Not for control messages)
     */
    activeRequest?: WaldiezActiveRequest | null;
    /** Handlers for step-specific actions */
    handlers?: WaldiezStepHandlers;
};
