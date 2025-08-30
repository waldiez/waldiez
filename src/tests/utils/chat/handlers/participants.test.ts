/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import { WaldiezChatParticipantsHandler } from "@waldiez/utils/chat/handlers/participants";

// Mock dependencies
vi.mock("strip-ansi", () => ({
    default: vi.fn((str: string) => str),
}));

vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("ParticipantsHandler", () => {
    it("should be able to handle participants type", () => {
        expect(new WaldiezChatParticipantsHandler().canHandle("participants")).toBe(true);
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
                    isUser: true,
                },
                {
                    id: "assistant_1",
                    name: "assistant_1",
                    isUser: false,
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
                    isUser: true,
                },
                {
                    id: "a",
                    name: "assistant_1",
                    isUser: false,
                },
            ],
        });
    });
    it("should extract participants from print data", () => {
        const participantsData = {
            participants: [
                { name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                { id: "a", name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
            ],
        };
        const message = JSON.stringify({
            type: "print",
            data: participantsData,
        });
        const result = WaldiezChatMessageProcessor.process(message);
        expect(result).toEqual({
            isWorkflowEnd: false,
            participants: [
                {
                    id: "user_proxy",
                    name: "user_proxy",
                    isUser: true,
                },
                {
                    id: "a",
                    name: "assistant_1",
                    isUser: false,
                },
            ],
        });
    });
    it("should extract direct participants from message", () => {
        const message = {
            participants: [
                { id: "u", name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                { id: "a", name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
            ],
        };

        const result = new WaldiezChatParticipantsHandler().handle(message, {});

        expect(result).toEqual({
            isWorkflowEnd: false,
            participants: [
                {
                    id: "u",
                    name: "user_proxy",
                    isUser: true,
                },
                {
                    id: "a",
                    name: "assistant_1",
                    isUser: false,
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
                    isUser: true,
                },
                {
                    id: "assistant_1",
                    name: "assistant_1",
                    isUser: false,
                },
                {
                    id: "a2",
                    name: "assistant_2",
                    isUser: false,
                },
                {
                    id: "assistant_3",
                    name: "assistant_3",
                    isUser: false,
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
                    isUser: true,
                },
                {
                    id: "user_proxy2",
                    name: "user_proxy2",
                    isUser: true,
                },
                {
                    id: "assistant_1",
                    name: "assistant_1",
                    isUser: false,
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
                    isUser: true,
                },
                {
                    id: "assistant_1",
                    name: "assistant_1",
                    isUser: false,
                },
            ],
        });
    });

    it("should handle invalid participants data", () => {
        const message = JSON.stringify({
            participants: [
                { id: "u", name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                { id: "a", humanInputMode: "NEVER", agentType: "assistant" },
            ],
        });

        const result = new WaldiezChatParticipantsHandler().handle(message, {});

        expect(result).toBeUndefined();
        expect(WaldiezChatMessageProcessor.process(message)).toBeUndefined();
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
});
