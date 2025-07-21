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

    describe("tool response handling", () => {
        it("should handle tool response messages with valid structure", () => {
            const message = JSON.stringify({
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
            });

            const result = WaldiezChatMessageProcessor.process(message);

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

        it("should return undefined for invalid tool response structure", () => {
            const message = JSON.stringify({
                type: "tool_response",
                content: {
                    // missing required fields
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
