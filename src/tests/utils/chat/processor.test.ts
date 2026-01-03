/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";

// Mock dependencies
vi.mock("strip-ansi", () => ({
    default: vi.fn((str: string) => str),
}));

vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("WaldiezChatMessageProcessor", () => {
    let mockDate: Date;

    beforeEach(() => {
        mockDate = new Date("2024-01-01T12:00:00.000Z");
        vi.setSystemTime(mockDate);
    });

    describe("process method", () => {
        it("should return undefined for null/undefined messages", () => {
            expect(WaldiezChatMessageProcessor.process(null)).toBeUndefined();
            expect(WaldiezChatMessageProcessor.process(undefined)).toBeUndefined();
            expect(WaldiezChatMessageProcessor.process("")).toBeUndefined();
        });

        it("should allow passing already parsed messages", () => {
            const parsedMessage = { type: "input_request", request_id: "test", prompt: "Enter your input:" };
            const result = WaldiezChatMessageProcessor.process(parsedMessage);
            expect(result).toBeDefined();
            expect(result?.message?.id).toBe("test");
        });

        it("should return undefined for non-JSON messages", () => {
            const result = WaldiezChatMessageProcessor.process("invalid json");
            expect(result).toBeUndefined();
        });

        it("should return undefined for empty data", () => {
            const result = WaldiezChatMessageProcessor.process("null");
            expect(result).toBeUndefined();
        });

        it("should return undefined for unknown message types", () => {
            const message = JSON.stringify({ type: "unknown_type" });
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle ANSI escape sequences", async () => {
            const stripAnsi = vi.mocked(await import("strip-ansi")).default;
            const message = JSON.stringify({ type: "input_request", request_id: "test" });

            WaldiezChatMessageProcessor.process("\u001b[31m" + message + "\u001b[0m");

            expect(stripAnsi).toHaveBeenCalledWith("\u001b[31m" + message + "\u001b[0m");
        });

        it("should handle newline characters in raw messages", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "test",
                prompt: "Enter input:",
            });
            const messageWithNewlines = message + "\n";

            const result = WaldiezChatMessageProcessor.process(messageWithNewlines);

            expect(result).toBeDefined();
            expect(result?.message?.id).toBe("test");
        });

        it("should fall back to print handler when JSON parsing fails", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

            // This should trigger the fallback to print handler
            const message = "<Waldiez> - Workflow finished successfully";
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({ isWorkflowEnd: true, message });

            consoleSpy.mockRestore();
        });
    });

    describe("timeline message handling", () => {
        it("should handle print message with timeline data", () => {
            const timelineData = {
                type: "print",
                data: {
                    type: "timeline",
                    content: {
                        timeline: [
                            { timestamp: "2024-01-01T10:00:00Z", event: "start", agent: "user" },
                            { timestamp: "2024-01-01T10:01:00Z", event: "message", agent: "assistant" },
                        ],
                        cost_timeline: [
                            { timestamp: "2024-01-01T10:00:00Z", cost: 0.001 },
                            { timestamp: "2024-01-01T10:01:00Z", cost: 0.002 },
                        ],
                        summary: {
                            total_messages: 2,
                            total_cost: 0.003,
                            duration: 60,
                        },
                        metadata: {
                            model: "gpt-4",
                            temperature: 0.7,
                        },
                        agents: ["user", "assistant"],
                    },
                },
            };

            const message = JSON.stringify(timelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                timeline: {
                    timeline: [
                        { timestamp: "2024-01-01T10:00:00Z", event: "start", agent: "user" },
                        { timestamp: "2024-01-01T10:01:00Z", event: "message", agent: "assistant" },
                    ],
                    cost_timeline: [
                        { timestamp: "2024-01-01T10:00:00Z", cost: 0.001 },
                        { timestamp: "2024-01-01T10:01:00Z", cost: 0.002 },
                    ],
                    summary: {
                        total_messages: 2,
                        total_cost: 0.003,
                        duration: 60,
                    },
                    metadata: {
                        model: "gpt-4",
                        temperature: 0.7,
                    },
                    agents: ["user", "assistant"],
                },
            });
        });

        it("should handle print message with invalid timeline data", () => {
            const timelineData = {
                type: "print",
                data: {
                    type: "timeline",
                    content: {
                        // Missing required fields
                        timeline: [],
                        summary: null,
                    },
                },
            };

            const message = JSON.stringify(timelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle direct timeline message type", () => {
            const timelineData = {
                type: "timeline",
                content: {
                    timeline: [{ timestamp: "2024-01-01T10:00:00Z", event: "start", agent: "user" }],
                    cost_timeline: [{ timestamp: "2024-01-01T10:00:00Z", cost: 0.001 }],
                    summary: {
                        total_messages: 1,
                        total_cost: 0.001,
                    },
                    metadata: {
                        model: "gpt-4",
                    },
                    agents: ["user"],
                },
            };

            const message = JSON.stringify(timelineData);
            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                timeline: {
                    timeline: [{ timestamp: "2024-01-01T10:00:00Z", event: "start", agent: "user" }],
                    cost_timeline: [{ timestamp: "2024-01-01T10:00:00Z", cost: 0.001 }],
                    summary: {
                        total_messages: 1,
                        total_cost: 0.001,
                    },
                    metadata: {
                        model: "gpt-4",
                    },
                    agents: ["user"],
                },
            });
        });
    });

    describe("participants handling", () => {
        it("should handle participants data directly", () => {
            const participantsData = {
                participants: [
                    { id: "user", name: "User" },
                    { id: "assistant", name: "Assistant", humanInputMode: "NEVER" },
                ],
            };
            const message = JSON.stringify(participantsData);
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                participants: [
                    { id: "user", name: "User", isUser: false },
                    { id: "assistant", name: "Assistant", isUser: false },
                ],
                isWorkflowEnd: false,
            });
        });
        it("should handle participants data if using print type", () => {
            const participantsData = {
                type: "print",
                data: {
                    participants: [
                        { id: "user", name: "User", humanInputMode: "ALWAYS" },
                        { id: "assistant", name: "Assistant" },
                    ],
                },
            };
            const message = JSON.stringify(participantsData);
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                participants: [
                    { id: "user", name: "User", isUser: true },
                    { id: "assistant", name: "Assistant", isUser: false },
                ],
                isWorkflowEnd: false,
            });
        });
        it("should return undefined if invalid participants are passed", () => {
            const invalidData = {
                participants: [
                    { id: "assistant", name: "Assistant", humanInputMode: "ALWAYS" },
                    { id: "other", humanInputMode: "NEVER" }, // missing name
                ],
            };
            const message = JSON.stringify(invalidData);
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });
    });

    describe("image URL replacement", () => {
        it("should not modify non-image content", () => {
            const contentArray = [{ type: "text", text: "Hello" }];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(
                message,
                null,
                "https://example.com/image.jpg",
            );

            expect(result?.message?.content).toEqual(contentArray);
        });

        it("should not preserve other image_url properties", () => {
            const contentArray = [
                {
                    type: "image_url",
                    image_url: {
                        url: "placeholder-url",
                        detail: "high",
                        alt: "Placeholder Image",
                    },
                },
            ];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(
                message,
                null,
                "https://example.com/image.jpg",
            );

            expect(result?.message?.content).toEqual([
                {
                    type: "image_url",
                    image_url: {
                        url: "https://example.com/image.jpg",
                        alt: "Placeholder Image",
                    },
                },
            ]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty JSON object", () => {
            const message = JSON.stringify({});
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle JSON parse errors gracefully", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const message = "not json but contains participants";
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });

        it("should handle null content gracefully", () => {
            const message = JSON.stringify({
                type: "text",
                content: null,
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle message with no type property", () => {
            const message = JSON.stringify({
                content: { data: "some data" },
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle print message that is not timeline but has data property", () => {
            const message = JSON.stringify({
                type: "print",
                data: "regular print message data",
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should pass context correctly to handlers", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "test-req",
                prompt: "Enter input:",
            });

            const result = WaldiezChatMessageProcessor.process(message, "context-req", "https://image.url");

            expect(result?.message?.request_id).toBe("context-req");
            expect(result?.requestId).toBe("test-req");
        });
    });
});
