/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezChat, WaldiezChatData } from "@waldiez/models";
import { chatMapper } from "@waldiez/models/mappers";

describe("chatMapper.asEdge", () => {
    it("should convert a chat to edge", () => {
        const chatData: WaldiezChatData = {
            source: "wa-1",
            target: "wa-2",
            name: "custom_chat",
            description: "custom_description",
            position: 0,
            order: 0,
            clearHistory: false,
            message: {
                type: "none",
                useCarryover: false,
                content: null,
                context: {},
            },
            nestedChat: {
                message: null,
                reply: null,
            },
            summary: {
                method: "lastMsg",
                prompt: "summarize the conversation",
                args: {
                    summary_role: "user",
                },
            },
            prerequisites: [],
            maxTurns: 0,
            maxRounds: 0,
            realSource: "wa-1",
            realTarget: "wa-2",
        };
        const chat = new WaldiezChat({ id: "1", data: chatData });
        const edge = chatMapper.asEdge(chat);
        expect(edge).toBeTruthy();
        expect(edge.id).toBe("1");
        expect(edge.data?.label).toBe("custom_chat");
    });
});
