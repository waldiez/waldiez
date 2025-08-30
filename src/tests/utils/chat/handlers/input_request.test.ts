/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import { WaldiezChatInputRequestHandler } from "@waldiez/utils/chat/handlers";

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

    describe("input_request handling", () => {
        it("should handle basic input request", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter your input:",
            });

            const result = WaldiezChatMessageProcessor.process(message, "current-req");

            expect(result).toEqual({
                message: {
                    id: "req-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    request_id: "current-req",
                    type: "input_request",
                    content: [
                        {
                            type: "text",
                            text: "Enter your input:",
                        },
                    ],
                    password: false,
                    prompt: "Enter your input:",
                },
                requestId: "req-123",
            });
        });

        it("should handle generic prompt symbols", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: ">",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.content).toEqual([
                {
                    type: "text",
                    text: "Enter your message to start the conversation:",
                },
            ]);
        });

        it("should handle prompt with trailing space", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "> ",
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result?.message?.content).toEqual([
                {
                    type: "text",
                    text: "Enter your message to start the conversation:",
                },
            ]);
        });

        it("should detect password prompts with boolean true", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter password:",
                password: true,
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.password).toBe(true);
        });

        it('should detect password prompts with string "true"', () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter password:",
                password: "true",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.password).toBe(true);
        });

        it("should handle case-insensitive password string", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter password:",
                password: "TRUE",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.password).toBe(true);
        });

        it("should handle non-password prompts", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter input:",
                password: false,
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.password).toBe(false);
        });

        it("should handle missing password field", () => {
            const message = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
                prompt: "Enter input:",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.password).toBe(false);
        });
    });
    describe("input_request_invalid_input handling", () => {
        it("should return undefined for invalid input request", () => {
            const message = JSON.stringify({
                type: "input_request_invalid_input",
                request_id: "req-123",
                prompt: "Invalid input provided.",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
        it("should not process non-input_request messages", () => {
            const message = {
                type: "non_input_request",
                request_id: "req-123",
                prompt: "This should not be processed.",
            };
            const isValid = WaldiezChatInputRequestHandler.isValidInputRequest(message);
            expect(isValid).toBe(false);
            const messageWithoutRequestId = {
                type: "input_request",
                prompt: "This should not be processed.",
            };
            const isValid2 = WaldiezChatInputRequestHandler.isValidInputRequest(messageWithoutRequestId);
            expect(isValid2).toBe(false);
            const stringMessage = "input_request";
            const isValid3 = WaldiezChatInputRequestHandler.isValidInputRequest(stringMessage);
            expect(isValid3).toBe(false);
            const messageWithoutPrompt = JSON.stringify({
                type: "input_request",
                request_id: "req-123",
            });
            const result = WaldiezChatMessageProcessor.process(messageWithoutPrompt);
            expect(result).toBeUndefined();
            const result2 = new WaldiezChatInputRequestHandler().handle(message, {});
            expect(result2).toBeUndefined();
        });
    });
    describe("UsingAutoReplyHandler", () => {
        it("should handle using auto reply", () => {
            const message = JSON.stringify({
                type: "using_auto_reply",
                request_id: "req-123",
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
                            text: "Using auto reply",
                        },
                    ],
                    sender: undefined,
                    recipient: undefined,
                },
            });
        });
    });
});
