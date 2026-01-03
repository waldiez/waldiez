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
    describe("text message handling", () => {
        it("should handle string content", () => {
            const message = JSON.stringify({
                type: "text",
                id: "msg-123",
                timestamp: "2024-01-01T10:00:00.000Z",
                content: {
                    content: "Hello world",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "msg-123",
                    timestamp: "2024-01-01T10:00:00.000Z",
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: "Hello world",
                        },
                    ],
                    sender: "user",
                    recipient: "assistant",
                },
                requestId: null,
            });
        });

        it("should handle array content", () => {
            const contentArray = [
                { type: "text", text: "Hello" },
                { type: "text", text: "World" },
            ];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.content).toEqual(contentArray);
        });

        it("should handle object content", () => {
            const contentObject = { type: "text", text: "Hello" };

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentObject,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.content).toEqual([contentObject]);
        });

        it("should replace image URLs when provided", () => {
            const contentArray = [
                {
                    type: "image_url",
                    image_url: { url: "placeholder-url" },
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
                    image_url: { url: "https://example.com/image.jpg", alt: "Image" },
                },
            ]);
        });

        it("should handle tool_call type", () => {
            const message = JSON.stringify({
                type: "tool_call",
                content: {
                    content: "Tool call content",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.type).toBe("tool_call");
        });

        it("should generate fallback values for missing fields", async () => {
            const message = JSON.stringify({
                type: "text",
                content: {
                    content: "Hello",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.id).toBe("mock-nanoid-id");
            expect(result?.message?.timestamp).toBe("2024-01-01T12:00:00.000Z");
        });

        it("should return undefined for invalid text message structure", () => {
            const message = JSON.stringify({
                type: "text",
                content: {
                    // missing required fields
                    content: "Hello",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
