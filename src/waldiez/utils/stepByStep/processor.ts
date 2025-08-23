/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import stripAnsi from "strip-ansi";

import {
    WaldiezDebugMessage,
    isDebugBreakpointAdded,
    isDebugBreakpointCleared,
    isDebugBreakpointRemoved,
    isDebugBreakpointsList,
    isDebugError,
    isDebugEventInfo,
    isDebugHelp,
    isDebugInputRequest,
    isDebugStats,
} from "@waldiez/components/stepByStep";
import {
    DebugBreakpointsHandler,
    DebugErrorHandler,
    DebugEventInfoHandler,
    DebugHelpHandler,
    DebugInputRequestHandler,
    DebugPrintHandler,
    DebugStatsHandler,
} from "@waldiez/utils/stepByStep/handlers";
import { StepByStepUtils } from "@waldiez/utils/stepByStep/stepByStepUtils";
import {
    type StepByStepHandler,
    StepByStepProcessingContext,
    StepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

export class WaldiezStepByStepProcessor {
    private static _handlers: StepByStepHandler[] | null = null;
    private static get handlers(): StepByStepHandler[] {
        if (!this._handlers) {
            this._handlers = [
                new DebugInputRequestHandler(),
                new DebugEventInfoHandler(),
                new DebugStatsHandler(),
                new DebugErrorHandler(),
                new DebugHelpHandler(),
                new DebugBreakpointsHandler(),
                new DebugPrintHandler(),
            ];
        }
        return this._handlers;
    }

    /**
     * Process a raw debug message and return the result
     * @param rawMessage - The raw message string to process (JSON from Python backend)
     * @param context - Processing context with request ID, flow ID, etc.
     */
    static process(
        rawMessage: string | undefined | null,
        context: StepByStepProcessingContext = {},
    ): StepByStepProcessingResult | undefined {
        if (!rawMessage) {
            return undefined;
        }

        let data: WaldiezDebugMessage | null = null;
        if (typeof rawMessage === "string") {
            data = WaldiezStepByStepProcessor.parseMessage(rawMessage);
        } else if (typeof rawMessage === "object") {
            // Already parsed content from subprocess_output
            if (WaldiezStepByStepProcessor.isValidDebugMessage(rawMessage)) {
                data = rawMessage as WaldiezDebugMessage;
            }
        }

        if (!data) {
            return WaldiezStepByStepProcessor.earlyError(rawMessage);
        }

        // Find appropriate handler
        const handler = WaldiezStepByStepProcessor.findHandler(data.type);
        if (!handler) {
            return {
                error: {
                    message: `No handler found for message type: ${data.type}`,
                    code: "UNKNOWN_MESSAGE_TYPE",
                    originalData: data,
                },
            };
        }

        // Process with handler
        try {
            return handler.handle(data, context);
        } catch (error) {
            return {
                error: {
                    message: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
                    code: "HANDLER_ERROR",
                    originalData: data,
                },
            };
        }
    }

    private static earlyError(rawMessage: string | undefined | null): StepByStepProcessingResult {
        try {
            const parsed = JSON.parse(rawMessage || "");
            const messageType = parsed.type;
            return {
                error: {
                    message: `No handler found for message type: ${messageType}`,
                    originalData: rawMessage,
                },
            };
        } catch {
            return {
                error: {
                    message: "Failed to parse debug message as JSON",
                    originalData: rawMessage,
                },
            };
        }
    }

    /**
     * Parse a raw message into a debug message
     * Handles both JSON strings and Python dict format from step-by-step runner
     */
    // eslint-disable-next-line max-statements
    private static parseMessage(message: string): WaldiezDebugMessage | null {
        if (!message || typeof message !== "string") {
            return null;
        }

        try {
            // Clean the message
            const cleanMessage = stripAnsi(message.replace(/\n/g, "")).trim();

            // Try direct JSON parsing first
            try {
                const parsed = JSON.parse(cleanMessage);
                if (WaldiezStepByStepProcessor.isValidDebugMessage(parsed)) {
                    return parsed as WaldiezDebugMessage;
                }
            } catch {
                // Continue to Python dict parsing
            }

            // Handle Python dict string format: {'type': 'debug_...', ...}
            if (cleanMessage.includes("'type':") && cleanMessage.includes("debug_")) {
                const jsonContent = cleanMessage
                    .replace(/'/g, '"') // Replace single quotes with double quotes
                    .replace(/True/g, "true")
                    .replace(/False/g, "false")
                    .replace(/None/g, "null");
                try {
                    const parsed = JSON.parse(jsonContent);
                    if (WaldiezStepByStepProcessor.isValidDebugMessage(parsed)) {
                        return parsed as WaldiezDebugMessage;
                    }
                } catch {
                    // Ignore parse errors
                }
            }

            return null;
        } catch {
            return null;
        }
    }

    /**
     * Check if the parsed data is a valid debug message
     */
    private static isValidDebugMessage(data: any): data is WaldiezDebugMessage {
        return !!(
            data &&
            typeof data === "object" &&
            data.type &&
            typeof data.type === "string" &&
            data.type.startsWith("debug_")
        );
    }

    /**
     * Find a handler that can process the given message type
     */
    private static findHandler(type: string): StepByStepHandler | undefined {
        return WaldiezStepByStepProcessor.handlers.find(handler => handler.canHandle(type));
    }

    /**
     * Get all supported message types
     */
    static getSupportedMessageTypes(): string[] {
        return [
            "debug_print",
            "debug_input_request",
            "debug_input_response", // Not handled (outgoing only)
            "debug_event_info",
            "debug_stats",
            "debug_help",
            "debug_error",
            "debug_breakpoints_list",
            "debug_breakpoint_added",
            "debug_breakpoint_removed",
            "debug_breakpoint_cleared",
        ];
    }

    /**
     * Check if a message type is supported for processing
     */
    static isSupported(messageType: string): boolean {
        return WaldiezStepByStepProcessor.getSupportedMessageTypes().includes(messageType);
    }

    /**
     * Check if the content can be processed by the step-by-step processor
     */
    static canProcess(content: any): boolean {
        return StepByStepUtils.isStepByStepMessage(content);
    }

    /**
     * Validate a debug message structure against TypeScript types
     */
    static validateMessage(data: any): data is WaldiezDebugMessage {
        if (!WaldiezStepByStepProcessor.isValidDebugMessage(data)) {
            return false;
        }

        // Use the existing type guards for validation
        switch (data.type) {
            case "debug_print":
                return typeof data.content === "string";
            case "debug_input_request":
                return isDebugInputRequest(data);
            case "debug_event_info":
                return isDebugEventInfo(data);
            case "debug_stats":
                return isDebugStats(data);
            case "debug_help":
                return isDebugHelp(data);
            case "debug_error":
                return isDebugError(data);
            case "debug_breakpoints_list":
                return isDebugBreakpointsList(data);
            case "debug_breakpoint_added":
                return isDebugBreakpointAdded(data);
            case "debug_breakpoint_removed":
                return isDebugBreakpointRemoved(data);
            case "debug_breakpoint_cleared":
                return isDebugBreakpointCleared(data);
            default:
                return false;
        }
    }
    /**
     * Parse subprocess_output content specifically for step-by-step messages
     */
    static parseSubprocessContent(content: string): WaldiezDebugMessage | null {
        if (!content || typeof content !== "string") {
            return null;
        }

        try {
            // Try direct JSON parse first
            const parsed = JSON.parse(content);
            if (WaldiezStepByStepProcessor.isValidDebugMessage(parsed)) {
                return parsed as WaldiezDebugMessage;
            }
        } catch {
            // Handle Python dict string format
            if (content.includes("'type':") && content.includes("debug_")) {
                const jsonContent = content
                    .replace(/'/g, '"')
                    .replace(/True/g, "true")
                    .replace(/False/g, "false")
                    .replace(/None/g, "null");
                try {
                    const parsed = JSON.parse(jsonContent);
                    if (WaldiezStepByStepProcessor.isValidDebugMessage(parsed)) {
                        return parsed as WaldiezDebugMessage;
                    }
                } catch {
                    // Ignore parse errors
                }
            }
        }

        return null;
    }
}
