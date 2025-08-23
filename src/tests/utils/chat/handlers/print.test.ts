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

        it("should not detect workflow end with different marker", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: "Chat completed successfully - <Waldiez>",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should detect workflow end from string message directly", () => {
            const message = "<Waldiez> - Workflow finished successfully";

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                isWorkflowEnd: true,
            });
        });

        it("should detect workflow end from object with data property", () => {
            const data = {
                type: "print",
                data: "<Waldiez> - Workflow finished successfully",
            };

            const result = WaldiezChatMessageProcessor.process(JSON.stringify(data));
            expect(result).toEqual({
                isWorkflowEnd: true,
            });
        });

        it("should detect workflow end from nested content", () => {
            const data = {
                type: "print",
                content: {
                    data: {
                        message: "<Waldiez> - Workflow finished successfully",
                        status: "completed",
                    },
                },
            };

            const result = WaldiezChatMessageProcessor.process(JSON.stringify(data));
            expect(result).toEqual({
                isWorkflowEnd: true,
            });
        });

        it("should extract participants from print message", () => {
            const participantsData = {
                participants: [
                    { id: "u", name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
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
                participants: [
                    {
                        id: "u",
                        name: "user_proxy",
                        user: true,
                    },
                    {
                        id: "assistant_1",
                        name: "assistant_1",
                        user: false,
                    },
                ],
            });
        });

        it("should extract participants from object data", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                    { id: "a", name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
                ],
            };

            const message = JSON.stringify({
                type: "print",
                content: {
                    data: participantsData,
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                isWorkflowEnd: false,
                participants: [
                    {
                        id: "user_proxy",
                        name: "user_proxy",
                        user: true,
                    },
                    {
                        id: "a",
                        name: "assistant_1",
                        user: false,
                    },
                ],
            });
        });

        it("should handle double dumped participants data", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                    { name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
                    { id: "a2", name: "assistant_2", humanInputMode: "NEVER", agentType: "assistant" },
                    { name: "assistant_3", humanInputMode: "NEVER", agentType: "assistant" },
                ],
            };
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify(JSON.stringify(participantsData)),
                },
            });
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toEqual({
                isWorkflowEnd: false,
                participants: [
                    {
                        id: "user_proxy",
                        name: "user_proxy",
                        user: true,
                    },
                    {
                        id: "assistant_1",
                        name: "assistant_1",
                        user: false,
                    },
                    {
                        id: "a2",
                        name: "assistant_2",
                        user: false,
                    },
                    {
                        id: "assistant_3",
                        name: "assistant_3",
                        user: false,
                    },
                ],
            });
        });

        it("should handle case insensitive humanInputMode", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "always", agentType: "user_proxy" },
                    { name: "user_proxy2", humanInputMode: "Always", agentType: "user_proxy" },
                    { name: "assistant_1", humanInputMode: "never", agentType: "assistant" },
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
                participants: [
                    {
                        id: "user_proxy",
                        name: "user_proxy",
                        user: true,
                    },
                    {
                        id: "user_proxy2",
                        name: "user_proxy2",
                        user: true,
                    },
                    {
                        id: "assistant_1",
                        name: "assistant_1",
                        user: false,
                    },
                ],
            });
        });

        it("should handle participants with missing humanInputMode", () => {
            const participantsData = {
                participants: [
                    { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                    { name: "assistant_1", agentType: "assistant" }, // missing humanInputMode
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
                participants: [
                    {
                        id: "user_proxy",
                        name: "user_proxy",
                        user: true,
                    },
                    {
                        id: "assistant_1",
                        name: "assistant_1",
                        user: false,
                    },
                ],
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

        it("should handle non-array participants", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify({ participants: "not-an-array" }),
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle missing participants key", () => {
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: JSON.stringify({ other_data: "some value" }),
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });

        it("should handle invalid message structure", () => {
            const message = JSON.stringify({
                type: "print",
                // missing content
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
        it("should handle message with string content that is not JSON", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const message = JSON.stringify({
                type: "print",
                content: {
                    data: "plain text message without participants",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
            expect(consoleSpy).toHaveBeenCalled();
        });
    });
});
