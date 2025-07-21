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

    describe("print message handling", () => {
        it("should detect workflow end", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: "<Waldiez> - Workflow finished successfully",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                isWorkflowEnd: true,
            });
        });

        it("should extract participants from print message", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                    { name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
                ],
            };

            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify(participantsData),
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                isWorkflowEnd: false,
                participants: {
                    all: ["user_proxy", "assistant_1"],
                    users: ["user_proxy"],
                },
            });
        });

        it("should handle double dumped participants data", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                    { name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
                    { name: "assistant_2", humanInputMode: "NEVER", agentType: "assistant" },
                    { name: "assistant_3", humanInputMode: "NEVER", agentType: "assistant" },
                ],
            };
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify(participantsData),
                },
            });
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                isWorkflowEnd: false,
                participants: {
                    all: ["user_proxy", "assistant_1", "assistant_2", "assistant_3"],
                    users: ["user_proxy"],
                },
            });
        });

        it("should handle invalid participants data", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: "invalid json",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle malformed participants structure", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify({ participants: [{ invalid: "structure" }] }),
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
    });
});
