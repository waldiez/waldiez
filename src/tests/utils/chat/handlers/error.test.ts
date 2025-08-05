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
    describe("error handling", () => {
        it("should handle error messages with valid structure", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    uuid: "error-uuid-123",
                    error: "An error occurred",
                    sender: "system",
                    recipient: "user",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "error-uuid-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Error: An error occurred",
                        },
                    ],
                    sender: "system",
                    recipient: "user",
                    error: "An error occurred", // Include error content in the message
                },
            });
        });

        it("should handle error messages with alternative structure (direct error property)", () => {
            const message = JSON.stringify({
                type: "error",
                error: {
                    uuid: "error-uuid-456",
                    error: "Alternative error structure",
                    sender: "system",
                    recipient: "user",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id", // uuid not available in this structure
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Error: Alternative error structure",
                        },
                    ],
                    sender: undefined,
                    recipient: undefined,
                    error: "Alternative error structure",
                },
            });
        });

        it("should generate nanoid when uuid is missing", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    error: "Error without UUID",
                    sender: "system",
                    recipient: "user",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.id).toBe("mock-nanoid-id");
            expect(result?.message?.error).toBe("Error without UUID");
        });

        it("should handle missing sender and recipient", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    uuid: "error-uuid-123",
                    error: "Error without sender/recipient",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "error-uuid-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Error: Error without sender/recipient",
                        },
                    ],
                    sender: undefined,
                    recipient: undefined,
                    error: "Error without sender/recipient",
                },
            });
        });

        it("should return undefined for invalid error structure (missing error content)", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    uuid: "error-uuid-123",
                    // missing error field
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined for non-string error content", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    uuid: "error-uuid-123",
                    error: { type: "object", message: "not a string" },
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should return undefined for null data", () => {
            const result = WaldiezChatMessageProcessor.process(null as any);
            expect(result).toBeUndefined();
        });

        it("should return undefined for non-object data", () => {
            const message = JSON.stringify("not an object");
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should return undefined for wrong message type", () => {
            const message = JSON.stringify({
                type: "not_error",
                content: {
                    error: "This should not be processed",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should return undefined when neither content nor error property exists", () => {
            const message = JSON.stringify({
                type: "error",
                // missing both content and error properties
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should return undefined when content is not an object", () => {
            const message = JSON.stringify({
                type: "error",
                content: "string-content",
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should return the error message when error property is not an object", () => {
            const message = JSON.stringify({
                type: "error",
                error: "string-error",
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id", // uuid not available in this structure
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Error: string-error",
                        },
                    ],
                    sender: undefined,
                    recipient: undefined,
                    error: "string-error",
                },
            });
        });

        it("should handle complex error messages", () => {
            const complexError =
                "Error code: 529 - {'type': 'error', 'error': {'type': 'overloaded_error', 'message': 'Overloaded'}}";

            const message = JSON.stringify({
                type: "error",
                content: {
                    uuid: "error-uuid-complex",
                    error: complexError,
                    sender: "api_gateway",
                    recipient: "client",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "error-uuid-complex",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: `Error: ${complexError}`,
                        },
                    ],
                    sender: "api_gateway",
                    recipient: "client",
                    error: complexError,
                },
            });
        });
    });
});
