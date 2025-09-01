/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import stripAnsi from "strip-ansi";

import type { WaldiezDebugMessage } from "@waldiez/components/stepByStep/types";
import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat/processor";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import {
    DebugBreakpointsHandler,
    DebugErrorHandler,
    DebugEventInfoHandler,
    DebugHelpHandler,
    DebugInputRequestHandler,
    DebugPrintHandler,
    DebugStatsHandler,
} from "@waldiez/utils/stepByStep/handlers";
import type {
    WaldiezStepByStepHandler,
    WaldiezStepByStepProcessingContext,
    WaldiezStepByStepProcessingResult,
} from "@waldiez/utils/stepByStep/types";

export class WaldiezStepByStepProcessor {
    private static _handlers: WaldiezStepByStepHandler[] | null = null;
    private static get handlers(): WaldiezStepByStepHandler[] {
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
        rawMessage: any,
        context: WaldiezStepByStepProcessingContext = {},
    ): WaldiezStepByStepProcessingResult | undefined {
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
        return this._doProcess(data, context);
    }

    private static _doProcess(
        data: any,
        context: WaldiezStepByStepProcessingContext,
    ): WaldiezStepByStepProcessingResult | undefined {
        let chatHandler: WaldiezChatMessageHandler | undefined;
        const stepHandler = WaldiezStepByStepProcessor.findHandler(data.type);
        if (!stepHandler) {
            chatHandler = WaldiezChatMessageProcessor.findHandler(data.type, data);
        }
        if (!stepHandler && !chatHandler) {
            return {
                error: {
                    message: `No handler found for message type: ${data.type}`,
                    code: "UNKNOWN_MESSAGE_TYPE",
                    originalData: data,
                },
            };
        }
        try {
            return stepHandler?.handle(data, context);
        } catch (error) {
            if (chatHandler) {
                try {
                    const chatResult = chatHandler.handle(data, context);
                    if (chatResult) {
                        return WaldiezStepByStepProcessor._chatResultToStepResult(chatResult);
                    }
                } catch (_) {
                    return {
                        error: {
                            message: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
                            code: "HANDLER_ERROR",
                            originalData: data,
                        },
                    };
                }
            }
            return {
                error: {
                    message: `Handler error: ${error instanceof Error ? error.message : String(error)}`,
                    code: "HANDLER_ERROR",
                    originalData: data,
                },
            };
        }
    }

    private static _chatResultToStepResult(
        chatResult: WaldiezChatMessageProcessingResult,
    ): WaldiezStepByStepProcessingResult | undefined {
        if (chatResult.participants) {
            return {
                debugMessage: {
                    type: "print",
                    content: chatResult.participants,
                },
                stateUpdate: {
                    participants: chatResult.participants,
                },
            };
        }
        if (chatResult.timeline) {
            return {
                debugMessage: {
                    type: "print",
                    content: chatResult.timeline,
                },
                stateUpdate: {
                    timeline: chatResult.timeline,
                },
            };
        }
        if (chatResult.isWorkflowEnd) {
            return {
                debugMessage: {
                    type: "print",
                    content: "Workflow has ended.",
                },
                stateUpdate: {
                    eventHistory: [
                        {
                            type: "workflow_end",
                            ...(chatResult.runCompletion || chatResult.message || {}),
                        },
                    ],
                },
            };
        }
        if (!chatResult.message || !chatResult.message.content) {
            return undefined;
        }
        return {
            debugMessage: {
                type: "print",
                content: chatResult.message,
            },
            stateUpdate: {
                eventHistory: [chatResult],
            },
        };
    }

    private static earlyError(rawMessage: string | undefined | null): WaldiezStepByStepProcessingResult {
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
     * Parse a raw message
     */
    private static parseMessage(message: any): WaldiezDebugMessage | null {
        /* c8 ignore next 3 */
        if (!message) {
            return null;
        }
        if (typeof message !== "string") {
            if (WaldiezStepByStepProcessor.isValidDebugMessage(message)) {
                return message;
            }
        }
        const clean = stripAnsi(message).replace(/\r?\n/g, " ").trim();
        if (!clean) {
            return null;
        }
        const payload = extractFirstBalanced(clean) ?? clean;
        const asJson = safeParse(payload);
        if (asJson && WaldiezStepByStepProcessor.isValidDebugMessage(asJson)) {
            return asJson;
        }
        const converted = pyishToJson(payload);
        const asPyJson = safeParse(converted);
        return asPyJson && WaldiezStepByStepProcessor.isValidDebugMessage(asPyJson) ? asPyJson : null;
    }

    /**
     * Find a handler that can process the given message type
     */
    static findHandler(type: string): WaldiezStepByStepHandler | undefined {
        return WaldiezStepByStepProcessor.handlers.find(handler => handler.canHandle(type));
    }

    /**
     * Check if the parsed data is a valid debug message
     */
    private static isValidDebugMessage(data: any): data is WaldiezDebugMessage {
        return !!(data && typeof data === "object" && data.type && typeof data.type === "string");
    }
}
const safeParse = <T = any>(s: string): T | null => {
    try {
        return JSON.parse(s);
    } catch {
        return null;
    }
};
/**
 * Extract the first balanced \{...\} or [...] block (handles nesting).
 * Returns null if none found.
 */
// eslint-disable-next-line max-statements
const extractFirstBalanced = (s: string): string | null => {
    const openers = new Set(["{", "["]);
    const closers: Record<string, string> = { "{": "}", "[": "]" };

    let start = -1;
    const stack: string[] = [];
    let inStr: '"' | "'" | null = null;
    let escaped = false;

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === undefined) {
            continue;
        }
        if (inStr) {
            if (escaped) {
                escaped = false;
                continue;
            }
            if (ch === "\\") {
                escaped = true;
                continue;
            }
            if (ch === inStr) {
                inStr = null;
            }
            continue;
        }

        if (ch === '"' || ch === "'") {
            inStr = ch;
            continue;
        }

        if (openers.has(ch)) {
            stack.push(ch);
            if (start === -1) {
                start = i;
            }
            continue;
        }
        if (stack.length) {
            const top = stack[stack.length - 1];
            if (top !== undefined && ch === closers[top]) {
                stack.pop();
                if (!stack.length && start !== -1) {
                    return s.slice(start, i + 1);
                }
            }
        }
    }
    return null;
};

/**
 * Convert a Python-like dict/list string to valid JSON.
 * - Converts single-quoted strings → double-quoted JSON strings (with escapes)
 * - Converts True/False/None when they appear as standalone identifiers (not in strings)
 * - Leaves double-quoted strings as-is (aside from standard escape handling)
 */
// eslint-disable-next-line complexity, max-statements
const pyishToJson = (src: string): string => {
    let out = "";
    let i = 0;
    const len = src.length;

    type Quote = '"' | "'" | null;
    let inStr: Quote = null;
    let escaped = false;

    const isAlphaNum = (c: string | undefined) => /[A-Za-z0-9_]/.test(c || "");

    while (i < len) {
        const ch = src[i];

        // inside a string
        if (inStr) {
            if (escaped) {
                out += "\\" + ch; // keep escape (normalize minimally)
                escaped = false;
                i++;
                continue;
            }
            if (ch === "\\") {
                escaped = true;
                i++;
                continue;
            }

            // close string?
            if (ch === inStr) {
                if (inStr === "'") {
                    out += '"'; // close converted JSON string
                } else {
                    out += '"'; // normalize double quotes to JSON quote char
                }
                inStr = null;
                i++;
                continue;
            }

            // character inside string; if we’re in a single-quoted string, we may need to escape `"`.
            if (inStr === "'") {
                if (ch === '"') {
                    out += '\\"';
                } else {
                    out += ch;
                }
            } else {
                out += ch;
            }
            i++;
            continue;
        }

        // not in a string
        if (ch === "'" || ch === '"') {
            inStr = ch;
            // always start JSON strings with double-quote
            out += '"';
            i++;
            continue;
        }

        // identifiers: True / False / None as standalone tokens only
        if (/[A-Za-z_]/.test(ch || "")) {
            let j = i + 1;
            while (j < len && isAlphaNum(src[j])) {
                j++;
            }
            const token = src.slice(i, j);

            // check boundaries to ensure standalone token
            const prev = i > 0 ? src[i - 1] : "";
            const next = j < len ? src[j] : "";
            const prevIsWord = !!prev && isAlphaNum(prev);
            const nextIsWord = !!next && isAlphaNum(next);

            if (!prevIsWord && !nextIsWord) {
                if (token === "True") {
                    out += "true";
                    i = j;
                    continue;
                }
                if (token === "False") {
                    out += "false";
                    i = j;
                    continue;
                }
                if (token === "None") {
                    out += "null";
                    i = j;
                    continue;
                }
            }

            // otherwise, pass through unchanged
            out += token;
            i = j;
            continue;
        }

        // everything else passes through
        out += ch;
        i++;
    }

    // if we ended while still "inStr", it's malformed; return original as fallback
    if (inStr) {
        return src;
    }
    return out;
};
