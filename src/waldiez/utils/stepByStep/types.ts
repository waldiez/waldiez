/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type {
    WaldiezBreakpoint,
    WaldiezDebugMessage,
    WaldiezStepByStep,
} from "@waldiez/components/stepByStep/types";

/**
 * Control actions that the UI should perform in response to debug messages
 */
export type WaldiezStepByStepControlAction =
    | { type: "debug_input_request_received"; requestId: string; prompt: string }
    | { type: "show_notification"; message: string; severity: "info" | "warning" | "error" | "success" }
    | { type: "update_breakpoints"; breakpoints: Array<string | WaldiezBreakpoint> }
    | { type: "workflow_ended"; reason?: string }
    | { type: "scroll_to_latest" };

/**
 * Processing context passed to handlers
 */
export type WaldiezStepByStepProcessingContext = {
    /** Optional request ID for correlation */
    requestId?: string;
    /** Flow ID being debugged */
    flowId?: string;
    /** Message timestamp */
    timestamp?: string;
    /** Current UI state (for handlers that need context) */
    currentState?: Partial<WaldiezStepByStep>;
};

/**
 * Result of processing a debug message
 */
export type WaldiezStepByStepProcessingResult = {
    /** The parsed debug message (if valid) */
    debugMessage?: WaldiezDebugMessage;
    /** Partial state updates to apply to WaldiezStepByStep */
    stateUpdate?: Partial<WaldiezStepByStep>;
    /** Control action for the UI to perform */
    controlAction?: WaldiezStepByStepControlAction;
    /** Whether this indicates workflow end */
    isWorkflowEnd?: boolean;
    /** Error information if processing failed */
    error?: {
        message: string;
        code?: string;
        originalData?: any;
    };
};

/**
 * Handler interface for processing specific debug message types
 */
export type WaldiezStepByStepHandler = {
    /**
     * Check if this handler can process the given message type
     */
    canHandle(type: string): boolean;

    /**
     * Process the debug message data
     */
    handle(
        data: WaldiezDebugMessage,
        context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult | undefined;
};
