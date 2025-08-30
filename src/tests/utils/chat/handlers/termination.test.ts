/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import { WaldiezChatTerminationHandler } from "@waldiez/utils/chat/handlers/termination";

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

        it("should handle termination wit hreason in data", () => {
            const message = {
                type: "termination",
                termination_reason: "Chat ended due to inactivity",
            };

            const result = WaldiezChatMessageProcessor.process(JSON.stringify(message));

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Chat ended due to inactivity",
                        },
                    ],
                },
            });
            const result2 = new WaldiezChatTerminationHandler().handle(message);
            expect(result2).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "system",
                    content: [
                        {
                            type: "text",
                            text: "Chat ended due to inactivity",
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
    describe("Termination And Human Reply No Input handling", () => {
        it("should handle termination and human reply without input", () => {
            const message = JSON.stringify({
                type: "termination_and_human_reply_no_input",
                content: {
                    termination_reason: "Chat ended without user input",
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
                            text: "Chat ended without user input",
                        },
                    ],
                    sender: undefined,
                    recipient: undefined,
                },
            });
        });

        it("should not return undefined for invalid termination and human reply structure", () => {
            const message = JSON.stringify({
                type: "termination_and_human_reply_no_input",
                content: {
                    // missing termination_reason
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).not.toBeUndefined();
        });
    });
});
