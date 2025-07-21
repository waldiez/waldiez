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

    describe("group_chat_run_chat handling", () => {
        it("should handle group chat run message", () => {
            const message = JSON.stringify({
                type: "group_chat_run_chat",
                content: {
                    uuid: "chat-uuid-123",
                    speaker: "executor",
                    silent: false,
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "chat-uuid-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Group chat run",
                        },
                    ],
                    sender: "executor",
                },
            });
        });

        it("should return undefined for invalid group chat structure", () => {
            const message = JSON.stringify({
                type: "group_chat_run_chat",
                content: {
                    // missing required fields
                    speaker: "executor",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });

    describe("speaker selection handling", () => {
        it("should handle select_speaker message", () => {
            const message = JSON.stringify({
                type: "select_speaker",
                content: {
                    uuid: "selection-uuid-123",
                    agents: ["agent1", "agent2", "agent3"],
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.id).toBe("selection-uuid-123");
            expect(result?.message?.type).toBe("system");
        });

        it("should handle select_speaker_invalid_input message", () => {
            const message = JSON.stringify({
                type: "select_speaker_invalid_input",
                content: {
                    uuid: "selection-uuid-123",
                    agents: ["agent1", "agent2"],
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.type).toBe("system");
            expect(Array.isArray(result?.message?.content)).toBe(true);
        });

        it("should return undefined for invalid speaker selection structure", () => {
            const message = JSON.stringify({
                type: "select_speaker",
                content: {
                    uuid: "selection-uuid-123",
                    agents: [123, "agent2"], // invalid agent type
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
