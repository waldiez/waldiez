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
    describe("termination message handling", () => {
        it("should handle termination message", () => {
            const message = JSON.stringify({
                type: "termination",
                content: {
                    termination_reason: "Chat completed successfully",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Chat completed successfully",
                        },
                    ],
                },
            });
        });

        it("should return undefined for invalid termination structure", () => {
            const message = JSON.stringify({
                type: "termination",
                content: {
                    // missing termination_reason
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
