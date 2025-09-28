/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    WaldiezChatToolCallHandler,
    WaldiezChatToolResponseHandler,
} from "@waldiez/utils/chat/handlers/tools";

// Mock dependencies
vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("Tools Handlers", () => {
    let mockDate: Date;

    beforeEach(() => {
        mockDate = new Date("2024-01-01T12:00:00.000Z");
        vi.setSystemTime(mockDate);
        vi.clearAllMocks();
    });

    describe("WaldiezChatToolCallHandler", () => {
        let handler: WaldiezChatToolCallHandler;

        beforeEach(() => {
            handler = new WaldiezChatToolCallHandler();
        });

        describe("canHandle", () => {
            it("should return true for tool_call type", () => {
                expect(handler.canHandle("tool_call")).toBe(true);
            });

            it("should return false for other types", () => {
                expect(handler.canHandle("text")).toBe(false);
                expect(handler.canHandle("tool_response")).toBe(false);
                expect(handler.canHandle("system")).toBe(false);
            });
        });

        describe("isValidToolCall", () => {
            it("should return true for valid tool call structure", () => {
                const validData = {
                    type: "tool_call",
                    content: {
                        sender: "user",
                        recipient: "assistant",
                    },
                };

                expect(WaldiezChatToolCallHandler.isValidToolCall(validData)).toBe(true);
            });

            it("should return false for null or undefined data", () => {
                expect(WaldiezChatToolCallHandler.isValidToolCall(null)).toBe(false);
                expect(WaldiezChatToolCallHandler.isValidToolCall(undefined)).toBe(false);
            });

            it("should return false for non-object data", () => {
                expect(WaldiezChatToolCallHandler.isValidToolCall("string")).toBe(false);
                expect(WaldiezChatToolCallHandler.isValidToolCall(123)).toBe(false);
                expect(WaldiezChatToolCallHandler.isValidToolCall(true)).toBe(false);
            });

            it("should return false for wrong type", () => {
                const invalidData = {
                    type: "text",
                    content: {},
                };

                expect(WaldiezChatToolCallHandler.isValidToolCall(invalidData)).toBe(false);
            });

            it("should return false for missing content", () => {
                const invalidData = {
                    type: "tool_call",
                };

                expect(WaldiezChatToolCallHandler.isValidToolCall(invalidData)).toBe(false);
            });

            it("should return false for non-object content", () => {
                const invalidData = {
                    type: "tool_call",
                    content: "string-content",
                };

                expect(WaldiezChatToolCallHandler.isValidToolCall(invalidData)).toBe(false);
            });
        });

        describe("extractToolFunctionNames", () => {
            it("should extract function names from tool calls", () => {
                const data = {
                    content: {
                        tool_calls: [
                            {
                                function: {
                                    name: "get_weather",
                                    arguments: '{"location": "New York"}',
                                },
                            },
                            {
                                function: {
                                    name: "search_database",
                                    arguments: '{"query": "users"}',
                                },
                            },
                        ],
                    },
                };

                const result = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
                expect(result).toEqual(["get_weather", "search_database"]);
            });

            it("should return empty array when tool_calls is not an array", () => {
                const data = {
                    content: {
                        tool_calls: "not-an-array",
                    },
                };

                const result = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
                expect(result).toEqual([]);
            });

            it("should return empty array when tool_calls is missing", () => {
                const data = {
                    content: {},
                };

                const result = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
                expect(result).toEqual([]);
            });

            it("should filter out tool calls without function names", () => {
                const data = {
                    content: {
                        tool_calls: [
                            {
                                function: {
                                    name: "valid_function",
                                    arguments: "{}",
                                },
                            },
                            {
                                function: {
                                    // missing name
                                    arguments: "{}",
                                },
                            },
                            {
                                // missing function
                            },
                            {
                                function: {
                                    name: 123, // non-string name
                                    arguments: "{}",
                                },
                            },
                        ],
                    },
                };

                const result = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
                expect(result).toEqual(["valid_function"]);
            });

            it("should handle empty tool_calls array", () => {
                const data = {
                    content: {
                        tool_calls: [],
                    },
                };

                const result = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
                expect(result).toEqual([]);
            });
        });

        describe("handle", () => {
            it("should handle valid tool call with function names", () => {
                const data = {
                    type: "tool_call",
                    content: {
                        uuid: "tool-call-uuid-123",
                        sender: "user",
                        recipient: "assistant",
                        tool_calls: [
                            {
                                function: {
                                    name: "get_weather",
                                    arguments: '{"location": "New York"}',
                                },
                            },
                            {
                                function: {
                                    name: "search_database",
                                    arguments: '{"query": "users"}',
                                },
                            },
                        ],
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-call-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_call",
                        content: [
                            {
                                type: "text",
                                text: "Tool call: get_weather, search_database",
                            },
                        ],
                        sender: "user",
                        recipient: "assistant",
                    },
                });
            });

            it("should handle tool call without function names", () => {
                const data = {
                    type: "tool_call",
                    content: {
                        uuid: "tool-call-uuid-123",
                        sender: "user",
                        recipient: "assistant",
                        tool_calls: [],
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-call-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_call",
                        content: [
                            {
                                type: "text",
                                text: "Tool call",
                            },
                        ],
                        sender: "user",
                        recipient: "assistant",
                    },
                });
            });

            it("should generate nanoid when uuid is missing", () => {
                const data = {
                    type: "tool_call",
                    content: {
                        sender: "user",
                        recipient: "assistant",
                    },
                };

                const result = handler.handle(data);

                expect(result?.message?.id).toBe("mock-nanoid-id");
            });

            it("should return undefined for invalid tool call", () => {
                const data = {
                    type: "invalid",
                    content: {},
                };

                const result = handler.handle(data);

                expect(result).toBeUndefined();
            });

            it("should handle tool call with missing sender/recipient", () => {
                const data = {
                    type: "tool_call",
                    content: {
                        uuid: "tool-call-uuid-123",
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-call-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_call",
                        content: [
                            {
                                type: "text",
                                text: "Tool call",
                            },
                        ],
                        sender: undefined,
                        recipient: undefined,
                    },
                });
            });
        });
    });

    describe("WaldiezChatToolResponseHandler", () => {
        let handler: WaldiezChatToolResponseHandler;

        beforeEach(() => {
            handler = new WaldiezChatToolResponseHandler();
        });

        describe("canHandle", () => {
            it("should return true for tool_response type", () => {
                expect(handler.canHandle("tool_response")).toBe(true);
            });

            it("should return false for other types", () => {
                expect(handler.canHandle("text")).toBe(false);
                expect(handler.canHandle("tool_call")).toBe(false);
                expect(handler.canHandle("system")).toBe(false);
            });
        });

        describe("isValidToolResponse", () => {
            it("should return true for valid tool response structure", () => {
                const validData = {
                    type: "tool_response",
                    content: {
                        tool_responses: [
                            { tool_call_id: "call-1", role: "assistant", content: "Response 1" },
                        ],
                    },
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(validData)).toBe(true);
            });

            it("should return false for null or undefined data", () => {
                expect(WaldiezChatToolResponseHandler.isValidToolResponse(null)).toBe(false);
                expect(WaldiezChatToolResponseHandler.isValidToolResponse(undefined)).toBe(false);
            });

            it("should return false for non-object data", () => {
                expect(WaldiezChatToolResponseHandler.isValidToolResponse("string")).toBe(false);
                expect(WaldiezChatToolResponseHandler.isValidToolResponse(123)).toBe(false);
            });

            it("should return false for wrong type", () => {
                const invalidData = {
                    type: "tool_call",
                    content: {
                        tool_responses: [],
                    },
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(invalidData)).toBe(false);
            });

            it("should return false for missing content", () => {
                const invalidData = {
                    type: "tool_response",
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(invalidData)).toBe(false);
            });

            it("should return false for non-object content", () => {
                const invalidData = {
                    type: "tool_response",
                    content: "string-content",
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(invalidData)).toBe(false);
            });

            it("should return false for missing tool_responses", () => {
                const invalidData = {
                    type: "tool_response",
                    content: {},
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(invalidData)).toBe(false);
            });

            it("should return false for non-array tool_responses", () => {
                const invalidData = {
                    type: "tool_response",
                    content: {
                        tool_responses: "not-an-array",
                    },
                };

                expect(WaldiezChatToolResponseHandler.isValidToolResponse(invalidData)).toBe(false);
            });
        });

        describe("handle", () => {
            it("should handle valid tool response with multiple responses", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        uuid: "tool-response-uuid-123",
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [
                            { tool_call_id: "call-1", role: "assistant", content: "Response 1" },
                            { tool_call_id: "call-2", role: "assistant", content: "Response 2" },
                        ],
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-response-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_response",
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [
                            { tool_call_id: "call-1", role: "assistant", content: "Response 1" },
                            { tool_call_id: "call-2", role: "assistant", content: "Response 2" },
                        ],
                    },
                });
            });

            it("should handle tool response with empty responses array", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        uuid: "tool-response-uuid-123",
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [],
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-response-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_response",
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [],
                    },
                });
            });

            it("should generate nanoid when uuid is missing", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [],
                    },
                };

                const result = handler.handle(data);

                expect(result?.message?.id).toBe("mock-nanoid-id");
            });

            it("should return undefined for invalid tool response", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        // missing tool_responses array
                    },
                };

                const result = handler.handle(data);

                expect(result).toBeUndefined();
            });

            it("should handle tool response with missing sender/recipient", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        uuid: "tool-response-uuid-123",
                        content: "Tool response content",
                        tool_responses: [],
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "tool-response-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "tool_response",
                        content: "Tool response content",
                        sender: undefined,
                        recipient: undefined,
                        tool_responses: [],
                    },
                });
            });

            it("should preserve tool response properties", () => {
                const data = {
                    type: "tool_response",
                    content: {
                        uuid: "tool-response-uuid-123",
                        content: "Tool response content",
                        sender: "system",
                        recipient: "user",
                        tool_responses: [
                            {
                                tool_call_id: "call-1",
                                role: "assistant",
                                content: "Complex response",
                                additional_prop: "should-be-ignored",
                            },
                        ],
                    },
                };

                const result = handler.handle(data);

                expect(result?.message?.tool_responses).toEqual([
                    {
                        tool_call_id: "call-1",
                        role: "assistant",
                        content: "Complex response",
                    },
                ]);
            });
        });
    });
});
