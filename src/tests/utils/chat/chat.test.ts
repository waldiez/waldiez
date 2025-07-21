/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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
    });
});
