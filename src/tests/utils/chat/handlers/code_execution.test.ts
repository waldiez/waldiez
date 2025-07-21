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

    describe("code execution reply handling", () => {
        it("should handle generate_code_execution_reply message", () => {
            const message = JSON.stringify({
                type: "generate_code_execution_reply",
                content: {
                    uuid: "code-uuid-123",
                    code_blocks: ["md"],
                    sender: "manager",
                    recipient: "executor",
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
                            text: "Generate code execution reply",
                        },
                    ],
                    sender: "manager",
                    recipient: "executor",
                },
            });
        });

        it("should return undefined for invalid code execution structure", () => {
            const message = JSON.stringify({
                type: "generate_code_execution_reply",
                content: {
                    // missing required fields
                    uuid: "code-uuid-123",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
