/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
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
                message: "<Waldiez> - Workflow finished successfully",
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
