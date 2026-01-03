/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezChat, WaldiezChatData, WaldiezMessage } from "@waldiez/models/Chat";

describe("WaldiezChat", () => {
    it("should create an instance", () => {
        const chatData = new WaldiezChatData();
        const chat = new WaldiezChat({
            id: "1",
            data: chatData,
            type: "chat",
            source: "source",
            target: "target",
        });
        expect(chat).toBeTruthy();
        expect(chat.id).toBe("1");
        expect(chat.source).toBe("source");
        expect(chat.target).toBe("target");
        expect(chat.data.name).toBe("Chat");
        expect(chat.data.description).toBe("New connection");
        const chat2 = WaldiezChat.create({
            type: "chat",
            source: "source1",
            target: "target1",
        });
        expect(chat2).toBeTruthy();
        expect(chat2.source).toBe("source1");
        expect(chat2.target).toBe("target1");
    });
    it("should create an instance with custom data", () => {
        const message = new WaldiezMessage({
            type: "string",
            useCarryover: false,
            content: "Hello",
            context: {
                name: "World",
            },
        });
        const nestedChatMessage = new WaldiezMessage({
            type: "method",
            useCarryover: false,
            content: "method",
            context: {
                name: "World",
            },
        });
        const nestedChatReply = new WaldiezMessage({
            type: "none",
            useCarryover: false,
            content: null,
        });
        const chatData = new WaldiezChatData({
            sourceType: "reasoning",
            targetType: "assistant",
            name: "custom_chat",
            description: "custom_description",
            clearHistory: false,
            maxTurns: 10,
            summary: {
                method: "lastMsg",
                prompt: "",
                args: {},
            },
            position: 2,
            order: 1,
            message,
            nestedChat: {
                message: nestedChatMessage,
                reply: nestedChatReply,
            },
            prerequisites: [],
            condition: {
                conditionType: "string_llm",
                prompt: "",
            },
            available: {
                type: "none",
                value: "",
            },
            afterWork: null,
            realSource: "agent1",
            realTarget: "agent2",
        });
        const chat = new WaldiezChat({
            id: "1",
            type: "chat",
            source: "agent1",
            target: "agent2",
            data: chatData,
            rest: { key: "42" },
        });
        expect(chat).toBeTruthy();
        expect(chat.id).toBe("1");
        expect(chat.source).toBe("agent1");
        expect(chat.target).toBe("agent2");
        expect(chat.data.name).toBe("custom_chat");
        expect(chat.data.description).toBe("custom_description");
        expect(chat.data.position).toBe(2);
        expect(chat.data.order).toBe(1);
        expect(chat.data.clearHistory).toBe(false);
        expect(chat.data.maxTurns).toBe(10);
        expect(chat.data.summary.method).toBe("lastMsg");
        expect(chat.data.message).toEqual(message);
    });
});
