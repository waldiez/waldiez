/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines, max-lines-per-function */
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointCleared,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugHelp,
    WaldiezDebugInputRequest,
    WaldiezDebugPrint,
    WaldiezDebugStats,
} from "@waldiez/components";
import { WaldiezStepByStepProcessor } from "@waldiez/utils/stepByStep/processor";
import type { WaldiezStepByStepProcessingContext } from "@waldiez/utils/stepByStep/types";

// Mock the handlers to isolate processor tests
vi.mock("@waldiez/utils/stepByStep/handlers", () => ({
    DebugInputRequestHandler: class {
        canHandle(type: string) {
            return type === "debug_input_request";
        }
        handle(data: any) {
            return {
                debugMessage: data,
                stateUpdate: { pendingControlInput: { request_id: data.request_id, prompt: data.prompt } },
            };
        }
    },
    DebugEventInfoHandler: class {
        canHandle(type: string) {
            return type === "debug_event_info";
        }
        handle(data: any) {
            return { debugMessage: data, stateUpdate: { currentEvent: data.event } };
        }
    },
    DebugStatsHandler: class {
        canHandle(type: string) {
            return type === "debug_stats";
        }
        handle(data: any) {
            return { debugMessage: data, stateUpdate: { stats: data.stats } };
        }
    },
    DebugErrorHandler: class {
        canHandle(type: string) {
            return type === "debug_error";
        }
        handle(data: any) {
            return { debugMessage: data, stateUpdate: { lastError: data.error } };
        }
    },
    DebugHelpHandler: class {
        canHandle(type: string) {
            return type === "debug_help";
        }
        handle(data: any) {
            return { debugMessage: data, stateUpdate: { help: data.help } };
        }
    },
    DebugBreakpointsHandler: class {
        canHandle(type: string) {
            return [
                "debug_breakpoints_list",
                "debug_breakpoint_added",
                "debug_breakpoint_removed",
                "debug_breakpoint_cleared",
            ].includes(type);
        }
        handle(data: any) {
            if (data.type === "debug_breakpoints_list") {
                return { debugMessage: data, stateUpdate: { breakpoints: data.breakpoints } };
            }
            return { debugMessage: data };
        }
    },
    DebugPrintHandler: class {
        canHandle(type: string) {
            return type === "debug_print" || type === "print";
        }
        handle(data: any) {
            const isWorkflowEnd = data.content?.includes("Workflow finished");
            return { debugMessage: data, isWorkflowEnd };
        }
    },
}));

describe("WaldiezStepByStepProcessor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("process", () => {
        describe("input validation", () => {
            it("should return undefined for null input", () => {
                const result = WaldiezStepByStepProcessor.process(null);
                expect(result).toBeUndefined();
            });

            it("should return undefined for undefined input", () => {
                const result = WaldiezStepByStepProcessor.process(undefined);
                expect(result).toBeUndefined();
            });

            it("should return undefined for empty string input", () => {
                const result = WaldiezStepByStepProcessor.process("");
                expect(result).toBeUndefined();
            });

            it("should return error for whitespace-only string input", () => {
                const result = WaldiezStepByStepProcessor.process("   \n\t   ");
                expect(result?.error).toBeDefined();
            });
        });

        describe("JSON parsing", () => {
            it("should parse valid JSON debug message", () => {
                const message = JSON.stringify({
                    type: "debug_print",
                    content: "Hello world",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_print",
                    content: "Hello world",
                });
                expect(result?.error).toBeUndefined();
            });

            it("should handle malformed JSON", () => {
                const message = '{"type": "debug_print", "content":}';

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("Failed to parse debug message as JSON");
                expect(result?.error?.originalData).toBe(message);
            });

            it("should handle non-debug message JSON", () => {
                const message = JSON.stringify({
                    type: "regular_message",
                    content: "Not a debug message",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("No handler found for message type: regular_message");
            });
        });

        describe("Python dict parsing", () => {
            it("should parse Python dict format with single quotes", () => {
                const message = "{'type': 'debug_print', 'content': 'Hello from Python'}";

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_print",
                    content: "Hello from Python",
                });
            });

            it("should convert Python boolean values", () => {
                const message =
                    "{'type': 'debug_stats', 'stats': {'step_mode': True, 'auto_continue': False}}";

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_stats",
                    stats: { step_mode: true, auto_continue: false },
                });
            });

            it("should convert Python None to null", () => {
                const message = "{'type': 'debug_error', 'error': None}";

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_error",
                    error: null,
                });
            });

            it("should handle complex Python dict structures", () => {
                const message =
                    "{'type': 'debug_event_info', 'event': {'sender': 'user', 'data': [1, 2, 3], 'nested': {'key': True}}}";

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_event_info",
                    event: { sender: "user", data: [1, 2, 3], nested: { key: true } },
                });
            });

            it("should handle malformed Python dict", () => {
                const message = "{'type': 'debug_print', 'content':}";

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("Failed to parse debug message as JSON");
            });
        });

        describe("ANSI stripping", () => {
            it("should strip ANSI codes from message", () => {
                const message = JSON.stringify({
                    type: "debug_print",
                    content: "\x1b[31mRed text\x1b[0m",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage).toEqual({
                    type: "debug_print",
                    content: "\x1b[31mRed text\x1b[0m", // Content itself is not stripped, just the message wrapper
                });
            });

            it("should handle newlines in message", () => {
                const messageWithNewlines = '{\n"type": "debug_print",\n"content": "Hello"\n}';

                const result = WaldiezStepByStepProcessor.process(messageWithNewlines);

                expect(result?.debugMessage).toEqual({
                    type: "debug_print",
                    content: "Hello",
                });
            });
        });

        describe("handler delegation", () => {
            it("should delegate to appropriate handler", () => {
                const message = JSON.stringify({
                    type: "debug_input_request",
                    request_id: "req-123",
                    prompt: "Enter command:",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.debugMessage?.type).toBe("debug_input_request");
                expect(result?.stateUpdate?.pendingControlInput).toEqual({
                    request_id: "req-123",
                    prompt: "Enter command:",
                });
            });

            it("should return error when no handler found", () => {
                const message = JSON.stringify({
                    type: "debug_unknown_type",
                    data: "some data",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("No handler found for message type: debug_unknown_type");
                expect(result?.error?.code).toBe("UNKNOWN_MESSAGE_TYPE");
            });

            it("should handle handler exceptions", () => {
                // Mock a handler that throws
                const throwingHandler = {
                    canHandle: () => true,
                    handle: () => {
                        throw new Error("Handler failed");
                    },
                };

                // Temporarily replace handlers
                const originalHandlers = (WaldiezStepByStepProcessor as any)._handlers;
                (WaldiezStepByStepProcessor as any)._handlers = [throwingHandler];

                const message = JSON.stringify({
                    type: "debug_print",
                    content: "test",
                });

                const result = WaldiezStepByStepProcessor.process(message);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("Handler error: Handler failed");
                expect(result?.error?.code).toBe("HANDLER_ERROR");

                // Restore original handlers
                (WaldiezStepByStepProcessor as any)._handlers = originalHandlers;
            });
        });

        describe("context passing", () => {
            it("should pass context to handlers", () => {
                const context: WaldiezStepByStepProcessingContext = {
                    requestId: "req-123",
                    flowId: "flow-456",
                    timestamp: "2025-01-01T00:00:00Z",
                };

                const message = JSON.stringify({
                    type: "debug_print",
                    content: "test message",
                });

                const result = WaldiezStepByStepProcessor.process(message, context);

                expect(result?.debugMessage).toBeDefined();
                // Context is passed to handler, but we can't directly test it without mocking deeper
            });

            it("should work with empty context", () => {
                const message = JSON.stringify({
                    type: "debug_print",
                    content: "test message",
                });

                const result = WaldiezStepByStepProcessor.process(message, {});

                expect(result?.debugMessage).toBeDefined();
            });
        });

        describe("object input handling", () => {
            it("should handle pre-parsed object input", () => {
                const messageObject = {
                    type: "debug_print",
                    content: "Already parsed",
                };

                const result = WaldiezStepByStepProcessor.process(messageObject as any);

                expect(result?.debugMessage).toEqual(messageObject);
            });

            it("should reject invalid pre-parsed object", () => {
                const messageObject = {
                    type: "regular_message",
                    content: "Not a debug message",
                };

                const result = WaldiezStepByStepProcessor.process(messageObject as any);

                expect(result?.error).toBeDefined();
                expect(result?.error?.message).toBe("No handler found for message type: regular_message");
            });
        });
    });

    describe("canProcess", () => {
        it("should delegate to WaldiezStepByStepUtils.isStepByStepMessage", () => {
            expect(WaldiezStepByStepProcessor.canProcess({ type: "debug_print" })).toBe(true);
            expect(WaldiezStepByStepProcessor.canProcess({ type: "print" })).toBe(true);
            expect(WaldiezStepByStepProcessor.canProcess({ type: "regular_message" })).toBe(true);
            expect(WaldiezStepByStepProcessor.canProcess(null)).toBe(false);
        });
    });

    describe("validateMessage", () => {
        it("should validate debug_print messages", () => {
            const validMessage: WaldiezDebugPrint = {
                type: "debug_print",
                content: "Hello world",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_print",
                content: 123, // Should be string
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate debug_input_request messages", () => {
            const validMessage: WaldiezDebugInputRequest = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: "Enter command:",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_input_request",
                request_id: "req-123",
                // Missing prompt
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate debug_event_info messages", () => {
            const validMessage: WaldiezDebugEventInfo = {
                type: "debug_event_info",
                event: { type: "message", sender: "user" },
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_event_info",
                event: "not an object",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate debug_stats messages", () => {
            const validMessage: WaldiezDebugStats = {
                type: "debug_stats",
                stats: {
                    events_processed: 10,
                    total_events: 20,
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: [],
                    event_history_count: 5,
                },
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_stats",
                stats: "not an object",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate debug_help messages", () => {
            const validMessage: WaldiezDebugHelp = {
                type: "debug_help",
                help: [
                    {
                        title: "Basic Commands",
                        commands: [{ cmds: ["continue", "c"], desc: "Continue execution" }],
                    },
                ],
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_help",
                help: "not an array",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate debug_error messages", () => {
            const validMessage: WaldiezDebugError = {
                type: "debug_error",
                error: "Something went wrong",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_error",
                error: 123, // Should be string
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should validate breakpoint messages", () => {
            const validListMessage: WaldiezDebugBreakpointsList = {
                type: "debug_breakpoints_list",
                breakpoints: ["message", "tool_call"],
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validListMessage)).toBe(true);

            const validAddedMessage: WaldiezDebugBreakpointAdded = {
                type: "debug_breakpoint_added",
                breakpoint: "message",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validAddedMessage)).toBe(true);

            const validRemovedMessage: WaldiezDebugBreakpointRemoved = {
                type: "debug_breakpoint_removed",
                breakpoint: { type: "event", event_type: "message" },
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validRemovedMessage)).toBe(true);

            const validClearedMessage: WaldiezDebugBreakpointCleared = {
                type: "debug_breakpoint_cleared",
                message: "All breakpoints cleared",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(validClearedMessage)).toBe(true);

            const invalidMessage = {
                type: "debug_breakpoints_list",
                breakpoints: "not an array",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(invalidMessage)).toBe(false);
        });

        it("should return false for unknown message types", () => {
            const unknownMessage = {
                type: "debug_unknown",
                data: "some data",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(unknownMessage)).toBe(false);
        });

        it("should return false for non-debug messages", () => {
            const regularMessage = {
                type: "regular_message",
                content: "Not a debug message",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(regularMessage)).toBe(false);
        });

        it("should return false for invalid input", () => {
            expect(WaldiezStepByStepProcessor.validateMessage(null)).toBe(false);
            expect(WaldiezStepByStepProcessor.validateMessage(undefined)).toBe(false);
            expect(WaldiezStepByStepProcessor.validateMessage("string")).toBe(false);
            expect(WaldiezStepByStepProcessor.validateMessage(123)).toBe(false);
            expect(WaldiezStepByStepProcessor.validateMessage({})).toBe(false);
        });
    });

    describe("parseSubprocessContent", () => {
        it("should parse valid JSON content", () => {
            const content = JSON.stringify({
                type: "debug_print",
                content: "Subprocess output",
            });

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toEqual({
                type: "debug_print",
                content: "Subprocess output",
            });
        });

        it("should parse Python dict format", () => {
            const content = "{'type': 'debug_event_info', 'event': {'sender': 'user', 'type': 'message'}}";

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toEqual({
                type: "debug_event_info",
                event: { sender: "user", type: "message" },
            });
        });

        it("should handle Python boolean and None values", () => {
            const content =
                "{'type': 'debug_stats', 'stats': {'step_mode': True, 'auto_continue': False, 'error': None}}";

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toEqual({
                type: "debug_stats",
                stats: { step_mode: true, auto_continue: false, error: null },
            });
        });

        it("should return null for invalid content", () => {
            // @ts-expect-error null is not expected
            expect(WaldiezStepByStepProcessor.parseSubprocessContent(null)).toBeNull();
            // @ts-expect-error undefined is not expected
            expect(WaldiezStepByStepProcessor.parseSubprocessContent(undefined)).toBeNull();
            expect(WaldiezStepByStepProcessor.parseSubprocessContent("")).toBeNull();
            expect(WaldiezStepByStepProcessor.parseSubprocessContent("invalid json")).toBeNull();
        });

        it("should handle malformed Python dict", () => {
            const content = "{'type': 'debug_print', 'content':}";

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toBeNull();
        });

        it("should only parse messages with debug_ type", () => {
            const content = "{'type': 'print', 'content': 'Regular print'}";

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toBeNull();
        });
    });

    describe("edge cases and error handling", () => {
        it("should handle mixed content types gracefully", () => {
            // Test with number input
            const result1 = WaldiezStepByStepProcessor.process(123 as any);
            expect(result1?.error).toBeDefined();

            // Test with array input
            const result2 = WaldiezStepByStepProcessor.process([] as any);
            expect(result2?.error).toBeDefined();

            // Test with boolean input
            const result3 = WaldiezStepByStepProcessor.process(true as any);
            expect(result3?.error).toBeDefined();
        });

        it("should handle deeply nested JSON structures", () => {
            const message = JSON.stringify({
                type: "debug_event_info",
                event: {
                    nested: {
                        deeply: {
                            very: {
                                deep: {
                                    data: "value",
                                    array: [1, 2, { inner: "object" }],
                                },
                            },
                        },
                    },
                },
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.debugMessage?.type).toBe("debug_event_info");
            expect((result?.debugMessage as any)?.event?.nested?.deeply?.very?.deep?.data).toBe("value");
        });

        it("should handle special characters in content", () => {
            const message = JSON.stringify({
                type: "debug_print",
                content: "Special chars: éñ中文🚀\n\t\r\"'\\",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.debugMessage?.type).toBe("debug_print");
            expect((result?.debugMessage as any)?.content).toBe("Special chars: éñ中文🚀\n\t\r\"'\\");
        });

        it("should handle large payloads", () => {
            const largeContent = "A".repeat(10000);
            const message = JSON.stringify({
                type: "debug_print",
                content: largeContent,
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.debugMessage?.type).toBe("debug_print");
            expect((result?.debugMessage as any)?.content).toBe(largeContent);
        });
    });

    describe("integration with real handlers", () => {
        it("should process workflow end messages correctly", () => {
            const message = JSON.stringify({
                type: "debug_print",
                content: "<Waldiez step-by-step> - Workflow finished successfully",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.isWorkflowEnd).toBe(true);
            expect(result?.debugMessage?.type).toBe("debug_print");
        });

        it("should process input requests correctly", () => {
            const message = JSON.stringify({
                type: "debug_input_request",
                request_id: "req-456",
                prompt: "[Step] (c)ontinue, (s)tep, (q)uit:",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.debugMessage?.type).toBe("debug_input_request");
            expect(result?.stateUpdate?.pendingControlInput).toEqual({
                request_id: "req-456",
                prompt: "[Step] (c)ontinue, (s)tep, (q)uit:",
            });
        });

        it("should process event info correctly", () => {
            const eventData = {
                type: "message",
                sender: "user",
                recipient: "assistant",
                content: "Hello AI!",
                timestamp: "2025-01-01T12:00:00Z",
            };

            const message = JSON.stringify({
                type: "debug_event_info",
                event: eventData,
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.debugMessage?.type).toBe("debug_event_info");
            expect(result?.stateUpdate?.currentEvent).toEqual(eventData);
        });
    });
});
