/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatRunCompletionHandler } from "@waldiez/utils/chat/handlers/chat_completion";

describe("WaldiezChatRunCompletionHandler", () => {
    let handler: WaldiezChatRunCompletionHandler;

    beforeEach(() => {
        handler = new WaldiezChatRunCompletionHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for run_completion type", () => {
            expect(handler.canHandle("run_completion")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("text")).toBe(false);
            expect(handler.canHandle("error")).toBe(false);
            expect(handler.canHandle("print")).toBe(false);
            expect(handler.canHandle("tool_call")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid run completion data", () => {
            const data = {
                type: "run_completion",
                content: {
                    summary: "Chat completed successfully",
                    history: [
                        { content: "Hello", role: "user" },
                        { content: "Hi there!", role: "assistant", name: "assistant_1" },
                    ],
                    cost: {
                        total: 0.002,
                        tokens: 150,
                    },
                },
            };

            const result = handler.handle(data);

            expect(result).toEqual({
                isWorkflowEnd: true,
                runCompletion: {
                    summary: "Chat completed successfully",
                    history: [
                        { content: "Hello", role: "user" },
                        { content: "Hi there!", role: "assistant", name: "assistant_1" },
                    ],
                    cost: {
                        total: 0.002,
                        tokens: 150,
                    },
                },
            });
        });

        it("should return undefined for null data", () => {
            const result = handler.handle(null);
            expect(result).toBeUndefined();
        });

        it("should return undefined for undefined data", () => {
            const result = handler.handle(undefined);
            expect(result).toBeUndefined();
        });

        it("should return undefined for non-object data", () => {
            const result = handler.handle("string");
            expect(result).toBeUndefined();
        });

        it("should return undefined for data without content", () => {
            const data = {
                type: "run_completion",
            };

            const result = handler.handle(data);
            expect(result).toBeUndefined();
        });

        it("should return undefined for data with non-object content", () => {
            const data = {
                type: "run_completion",
                content: "string-content",
            };

            const result = handler.handle(data);
            expect(result).toBeUndefined();
        });

        it("should handle empty content object", () => {
            const data = {
                type: "run_completion",
                content: {},
            };

            const result = handler.handle(data);

            expect(result).toEqual({
                isWorkflowEnd: true,
                runCompletion: {},
            });
        });

        it("should handle minimal run completion data", () => {
            const data = {
                type: "run_completion",
                content: {
                    summary: "Minimal completion",
                },
            };

            const result = handler.handle(data);

            expect(result).toEqual({
                isWorkflowEnd: true,
                runCompletion: {
                    summary: "Minimal completion",
                },
            });
        });

        it("should handle complex run completion data", () => {
            const data = {
                type: "run_completion",
                content: {
                    summary: "Complex chat session",
                    history: [
                        { content: "What's the weather?", role: "user" },
                        { content: "Let me check that for you.", role: "assistant", name: "weather_agent" },
                        { content: "The weather is sunny, 75°F", role: "assistant", name: "weather_agent" },
                    ],
                    cost: {
                        total: 0.005,
                        tokens: 250,
                        prompt_tokens: 120,
                        completion_tokens: 130,
                    },
                    metadata: {
                        duration: 1500,
                        model: "gpt-4",
                        agent_count: 2,
                    },
                },
            };

            const result = handler.handle(data);

            expect(result).toEqual({
                isWorkflowEnd: true,
                runCompletion: data.content,
            });
        });
    });
});
