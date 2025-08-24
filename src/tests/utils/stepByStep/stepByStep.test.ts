/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezStepByStepProcessor } from "@waldiez/utils/stepByStep";

// Mock dependencies
vi.mock("strip-ansi", () => ({
    default: vi.fn((str: string) => str),
}));

describe("WaldiezStepByStepProcessor", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe("process method", () => {
        it("should return undefined for null/undefined messages", () => {
            expect(WaldiezStepByStepProcessor.process(null)).toBeUndefined();
            expect(WaldiezStepByStepProcessor.process(undefined)).toBeUndefined();
            expect(WaldiezStepByStepProcessor.process("")).toBeUndefined();
        });

        it("should handle valid debug_print message", () => {
            const message = JSON.stringify({
                type: "debug_print",
                content: "Test message",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_print");
            expect((result?.debugMessage as any).content).toBe("Test message");
        });

        it("should handle valid debug_input_request message", () => {
            const message = JSON.stringify({
                type: "debug_input_request",
                request_id: "test-req",
                prompt: "Enter command:",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_input_request");
            expect(result?.controlAction?.type).toBe("debug_input_request_received");
        });

        it("should handle valid debug_error message", () => {
            const message = JSON.stringify({
                type: "debug_error",
                error: "Something went wrong",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_error");
            expect(result?.stateUpdate?.lastError).toBe("Something went wrong");
            expect(result?.controlAction?.type).toBe("show_notification");
            expect((result?.controlAction as any).severity).toBe("error");
        });

        it("should handle debug_event_info message", () => {
            const message = JSON.stringify({
                type: "debug_event_info",
                event: {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                    content: "Hello",
                },
                metadata: {
                    timestamp: "2024-01-01T10:00:00Z",
                },
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_event_info");
        });

        it("should handle debug_stats message", () => {
            const message = JSON.stringify({
                type: "debug_stats",
                stats: {
                    messages_sent: 10,
                    tokens_used: 1500,
                },
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_stats");
        });

        it("should handle debug_help message", () => {
            const message = JSON.stringify({
                type: "debug_help",
                help: [],
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_help");
        });

        it("should handle debug_breakpoints_list message", () => {
            const message = JSON.stringify({
                type: "debug_breakpoints_list",
                breakpoints: ["message", "tool_call"],
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_breakpoints_list");
            expect(result?.stateUpdate?.breakpoints).toEqual(["message", "tool_call"]);
        });

        it("should return error for invalid JSON", () => {
            const result = WaldiezStepByStepProcessor.process("invalid json");

            expect(result).toBeDefined();
            expect(result?.error?.message).toBe("Failed to parse debug message as JSON");
        });

        it("should return error for unknown message type", () => {
            const message = JSON.stringify({
                type: "unknown_debug_type",
                content: "test",
            });

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result).toBeDefined();
            expect(result?.error?.message).toContain("No handler found for message type");
        });

        it("should handle Python dict format", () => {
            const pythonDict = "{'type': 'debug_print', 'content': 'Python message'}";

            const result = WaldiezStepByStepProcessor.process(pythonDict);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_print");
            expect((result?.debugMessage as any).content).toBe("Python message");
        });

        it("should handle Python dict with boolean values", () => {
            const pythonDict = "{'type': 'debug_print', 'content': 'Test', 'active': True}";

            const result = WaldiezStepByStepProcessor.process(pythonDict);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_print");
        });

        it("should handle ANSI escape sequences", async () => {
            const stripAnsi = vi.mocked(await import("strip-ansi")).default;
            const message = JSON.stringify({ type: "debug_print", content: "test" });

            WaldiezStepByStepProcessor.process("\u001b[31m" + message + "\u001b[0m");

            expect(stripAnsi).toHaveBeenCalledWith(
                expect.stringContaining("\u001b[31m" + message + "\u001b[0m"),
            );
        });

        it("should handle newline characters in messages", () => {
            const message = JSON.stringify({
                type: "debug_print",
                content: "Test message",
            });
            const messageWithNewlines = message + "\n";

            const result = WaldiezStepByStepProcessor.process(messageWithNewlines);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_print");
        });
    });

    describe("parseSubprocessContent", () => {
        it("should parse valid JSON content", () => {
            const content = JSON.stringify({
                type: "debug_print",
                content: "Subprocess message",
            });

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toBeDefined();
            expect(result?.type).toBe("debug_print");
            expect((result as any).content).toBe("Subprocess message");
        });

        it("should parse Python dict format", () => {
            const content = "{'type': 'debug_print', 'content': 'Python subprocess'}";

            const result = WaldiezStepByStepProcessor.parseSubprocessContent(content);

            expect(result).toBeDefined();
            expect(result?.type).toBe("debug_print");
            expect((result as any).content).toBe("Python subprocess");
        });

        it("should return null for invalid content", () => {
            expect(WaldiezStepByStepProcessor.parseSubprocessContent("")).toBeNull();
            expect(WaldiezStepByStepProcessor.parseSubprocessContent("invalid")).toBeNull();
            // @ts-expect-error expecting not null
            expect(WaldiezStepByStepProcessor.parseSubprocessContent(null)).toBeNull();
            // @ts-expect-error expecting not undefined
            expect(WaldiezStepByStepProcessor.parseSubprocessContent(undefined)).toBeNull();
        });
    });

    describe("validateMessage", () => {
        it("should validate debug_print messages", () => {
            const message = { type: "debug_print", content: "test" };
            expect(WaldiezStepByStepProcessor.validateMessage(message)).toBe(true);
        });

        it("should validate debug_input_request messages", () => {
            const message = {
                type: "debug_input_request",
                request_id: "req-1",
                prompt: "Enter command:",
            };
            expect(WaldiezStepByStepProcessor.validateMessage(message)).toBe(true);
        });
    });

    describe("error handling", () => {
        it("should handle handler exceptions gracefully", () => {
            // Create a message that might cause handler to throw
            const message = JSON.stringify({
                type: "debug_print",
                content: "test",
            });

            // Mock the handler to throw an error
            const originalHandlers = (WaldiezStepByStepProcessor as any)._handlers;
            (WaldiezStepByStepProcessor as any)._handlers = [
                {
                    canHandle: () => true,
                    handle: () => {
                        throw new Error("Handler error");
                    },
                },
            ];

            const result = WaldiezStepByStepProcessor.process(message);

            expect(result?.error?.message).toContain("Handler error");
            expect(result?.error?.code).toBe("HANDLER_ERROR");

            // Restore original handlers
            (WaldiezStepByStepProcessor as any)._handlers = originalHandlers;
        });
    });

    describe("context handling", () => {
        it("should pass context to handlers", () => {
            const message = JSON.stringify({
                type: "debug_input_request",
                request_id: "test-req",
                prompt: "Enter command:",
            });

            const context = {
                requestId: "context-req",
                flowId: "flow-1",
                timestamp: "2024-01-01T10:00:00Z",
            };

            const result = WaldiezStepByStepProcessor.process(message, context);

            expect(result).toBeDefined();
            expect(result?.debugMessage?.type).toBe("debug_input_request");
        });
    });
});
