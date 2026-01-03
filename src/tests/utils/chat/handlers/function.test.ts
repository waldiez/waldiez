/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
    WaldiezChatExecuteFunctionHandler,
    WaldiezChatExecutedFunctionHandler,
} from "@waldiez/utils/chat/handlers/function";

// Mock dependencies
vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("Function Handlers", () => {
    let mockDate: Date;

    beforeEach(() => {
        mockDate = new Date("2024-01-01T12:00:00.000Z");
        vi.setSystemTime(mockDate);
        vi.clearAllMocks();
    });
    describe("WaldiezChatExecutedFunctionHandler", () => {
        let handler: WaldiezChatExecutedFunctionHandler;

        beforeEach(() => {
            handler = new WaldiezChatExecutedFunctionHandler();
        });

        describe("canHandle", () => {
            it("should return true for executed_function type", () => {
                expect(handler.canHandle("executed_function")).toBe(true);
            });

            it("should return false for other types", () => {
                expect(handler.canHandle("text")).toBe(false);
                expect(handler.canHandle("tool_call")).toBe(false);
                expect(handler.canHandle("tool_response")).toBe(false);
            });
        });

        describe("handle", () => {
            it("should handle valid executed function message", () => {
                const data = {
                    type: "executed_function",
                    content: {
                        uuid: "executed-function-uuid-123",
                        func_name: "calculate_sum",
                        sender: "system",
                        recipient: "user",
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "executed-function-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "executed_function",
                        content: [
                            {
                                type: "text",
                                text: "Executed function: calculate_sum",
                            },
                        ],
                        sender: "system",
                        recipient: "user",
                    },
                });
            });

            it("should generate nanoid when uuid is missing", () => {
                const data = {
                    type: "executed_function",
                    content: {
                        func_name: "calculate_sum",
                        sender: "system",
                        recipient: "user",
                    },
                };

                const result = handler.handle(data);

                expect(result?.message?.id).toBe("mock-nanoid-id");
            });

            it("should return undefined for null data", () => {
                const result = handler.handle(null);
                expect(result).toBeUndefined();
            });

            it("should return undefined for non-object data", () => {
                const result = handler.handle("string");
                expect(result).toBeUndefined();
            });

            it("should return undefined for wrong type", () => {
                const data = {
                    type: "other_function",
                    content: {
                        func_name: "calculate_sum",
                    },
                };

                const result = handler.handle(data);
                expect(result).toBeUndefined();
            });

            it("should handle executed function with missing sender/recipient", () => {
                const data = {
                    type: "executed_function",
                    content: {
                        uuid: "executed-function-uuid-123",
                        func_name: "calculate_sum",
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "executed-function-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "executed_function",
                        content: [
                            {
                                type: "text",
                                text: "Executed function: calculate_sum",
                            },
                        ],
                        sender: undefined,
                        recipient: undefined,
                    },
                });
            });

            it("should handle executed function with undefined func_name", () => {
                const data = {
                    type: "executed_function",
                    content: {
                        uuid: "executed-function-uuid-123",
                        sender: "system",
                        recipient: "user",
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "executed-function-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "executed_function",
                        content: [
                            {
                                type: "text",
                                text: "Executed function: undefined",
                            },
                        ],
                        sender: "system",
                        recipient: "user",
                    },
                });
            });

            it("should handle executed function with empty func_name", () => {
                const data = {
                    type: "executed_function",
                    content: {
                        uuid: "executed-function-uuid-123",
                        func_name: "",
                        sender: "system",
                        recipient: "user",
                    },
                };

                const result = handler.handle(data);

                expect(result).toEqual({
                    message: {
                        id: "executed-function-uuid-123",
                        timestamp: "2024-01-01T12:00:00.000Z",
                        type: "executed_function",
                        content: [
                            {
                                type: "text",
                                text: "Executed function: ",
                            },
                        ],
                        sender: "system",
                        recipient: "user",
                    },
                });
            });
        });
    });
    describe("WaldiezChatExecuteFunctionHandler", () => {
        let handler: WaldiezChatExecuteFunctionHandler;

        beforeEach(() => {
            handler = new WaldiezChatExecuteFunctionHandler();
        });

        it("should handle valid execute_function message with arguments", () => {
            const data = {
                type: "execute_function",
                content: {
                    uuid: "execute-function-uuid-123",
                    func_name: "calculate_sum",
                    arguments: { a: 1, b: 2 },
                    sender: "system",
                    recipient: "user",
                },
            };

            const result = handler.handle(data);

            expect(result).toEqual({
                message: {
                    id: "execute-function-uuid-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "execute_function",
                    content: [
                        {
                            type: "text",
                            text: "Execute function: calculate_sum",
                        },
                        {
                            type: "text",
                            text: "Arguments: [object Object]",
                        },
                    ],
                    sender: "system",
                    recipient: "user",
                },
            });
        });

        it("should generate nanoid and handle missing arguments", () => {
            const data = {
                type: "execute_function",
                content: {
                    func_name: "doSomething",
                    sender: "assistant",
                    recipient: "system",
                },
            };

            const result = handler.handle(data);

            expect(result?.message?.id).toBe("mock-nanoid-id");
            expect((result?.message?.content as any)[0].text).toBe("Execute function: doSomething");
            expect((result?.message?.content as any)[1].text).toBe("Arguments: undefined");
        });
    });
});
