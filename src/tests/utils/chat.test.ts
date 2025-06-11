/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines, max-lines-per-function */
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

    describe("process method", () => {
        it("should return undefined for non-JSON messages", () => {
            const result = WaldiezChatMessageProcessor.process("invalid json");
            expect(result).toBeUndefined();
        });

        it("should return undefined for empty data", () => {
            const result = WaldiezChatMessageProcessor.process("null");
            expect(result).toBeUndefined();
        });

        it("should return undefined for unknown message types", () => {
            const message = JSON.stringify({ type: "unknown_type" });
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle ANSI escape sequences", async () => {
            const stripAnsi = vi.mocked(await import("strip-ansi")).default;
            const message = JSON.stringify({ type: "input_request", request_id: "test" });

            WaldiezChatMessageProcessor.process("\u001b[31m" + message + "\u001b[0m");

            expect(stripAnsi).toHaveBeenCalledWith("\u001b[31m" + message + "\u001b[0m");
        });
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
                userParticipants: [],
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
                userParticipants: ["user_proxy", "assistant_1"],
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
                userParticipants: ["user_proxy", "assistant_1", "assistant_2", "assistant_3"],
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

    describe("text message handling", () => {
        it("should handle string content", () => {
            const message = JSON.stringify({
                type: "text",
                id: "msg-123",
                timestamp: "2024-01-01T10:00:00.000Z",
                content: {
                    content: "Hello world",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "msg-123",
                    timestamp: "2024-01-01T10:00:00.000Z",
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: "Hello world",
                        },
                    ],
                    sender: "user",
                    recipient: "assistant",
                },
                requestId: null,
            });
        });

        it("should handle array content", () => {
            const contentArray = [
                { type: "text", text: "Hello" },
                { type: "text", text: "World" },
            ];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.content).toEqual(contentArray);
        });

        it("should handle object content", () => {
            const contentObject = { type: "text", text: "Hello" };

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentObject,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.content).toEqual([contentObject]);
        });

        it("should replace image URLs when provided", () => {
            const contentArray = [
                {
                    type: "image_url",
                    image_url: { url: "placeholder-url" },
                },
            ];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(
                message,
                null,
                "https://example.com/image.jpg",
            );

            expect(result?.message?.content).toEqual([
                {
                    type: "image_url",
                    image_url: { url: "https://example.com/image.jpg" },
                },
            ]);
        });

        it("should handle tool_call type", () => {
            const message = JSON.stringify({
                type: "tool_call",
                content: {
                    content: "Tool call content",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.type).toBe("tool_call");
        });

        it("should generate fallback values for missing fields", async () => {
            const message = JSON.stringify({
                type: "text",
                content: {
                    content: "Hello",
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result?.message?.id).toBe("mock-nanoid-id");
            expect(result?.message?.timestamp).toBe("2024-01-01T12:00:00.000Z");
        });

        it("should return undefined for invalid text message structure", () => {
            const message = JSON.stringify({
                type: "text",
                content: {
                    // missing required fields
                    content: "Hello",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toBeUndefined();
        });
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

    describe("image URL replacement", () => {
        it("should not modify non-image content", () => {
            const contentArray = [{ type: "text", text: "Hello" }];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(
                message,
                null,
                "https://example.com/image.jpg",
            );

            expect(result?.message?.content).toEqual(contentArray);
        });

        it("should preserve other image_url properties", () => {
            const contentArray = [
                {
                    type: "image_url",
                    image_url: {
                        url: "placeholder-url",
                        detail: "high",
                    },
                },
            ];

            const message = JSON.stringify({
                type: "text",
                content: {
                    content: contentArray,
                    sender: "user",
                    recipient: "assistant",
                },
            });

            const result = WaldiezChatMessageProcessor.process(
                message,
                null,
                "https://example.com/image.jpg",
            );

            expect(result?.message?.content).toEqual([
                {
                    type: "image_url",
                    image_url: {
                        url: "https://example.com/image.jpg",
                        detail: "high",
                    },
                },
            ]);
        });
    });

    describe("edge cases", () => {
        it("should handle empty JSON object", () => {
            const message = JSON.stringify({});
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });

        it("should handle JSON parse errors gracefully", () => {
            const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
            const message = "not json but contains participants";
            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
            consoleSpy.mockRestore();
        });

        it("should handle null content gracefully", () => {
            const message = JSON.stringify({
                type: "text",
                content: null,
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });
    });
});
