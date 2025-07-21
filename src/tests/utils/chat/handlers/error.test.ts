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

        it("should return undefined for invalid error structure", () => {
            const message = JSON.stringify({
                type: "error",
                content: {
                    // missing required fields
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
