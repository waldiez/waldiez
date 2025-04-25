/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezEdge } from "@waldiez/models";
import { chatMapper } from "@waldiez/models/mappers";

describe("chatMapper.exportChat", () => {
    it("should export an edge", () => {
        const edge: WaldiezEdge = {
            id: "1",
            source: "wa-1",
            target: "wa-2",
            data: {
                label: "custom_chat",
                description: "custom_description",
                position: 0,
                order: 0,
                clearHistory: false,
                message: {
                    type: "none",
                    use_carryover: false,
                    content: null,
                    context: {},
                },
                summary: {
                    method: "last_msg",
                    prompt: "summarize the conversation",
                    args: {
                        summary_role: "user",
                    },
                },
                nestedChat: {
                    message: null,
                    reply: null,
                },
                prerequisites: [],
                maxTurns: 0,
                maxRounds: 0,
                afterWork: {
                    recipientType: "agent",
                    recipient: "wa-2",
                },
                flowAfterWork: null,
                contextVariables: {},
                available: {
                    type: "none",
                    value: null,
                },
                realSource: "wa-1",
                realTarget: "wa-2",
            },
        };
        const json = chatMapper.exportChat(edge, 0);
        expect(json).toBeTruthy();
        expect(json.id).toBe("1");
        expect(json.data.source).toBe("wa-1");
        expect(json.data.target).toBe("wa-2");
        expect(json.data.name).toBe("custom_chat");
        expect(json.data.description).toBe("custom_description");
        expect(json.data.position).toBe(0);
        expect(json.data.order).toBe(0);
        expect(json.data.clearHistory).toBe(false);
        expect(json.data.message).toEqual({
            type: "none",
            use_carryover: false,
            content: null,
            context: {},
        });
        expect(json.data.nestedChat).toEqual({
            message: null,
            reply: null,
        });
        expect(json.data.summary).toEqual({
            method: "last_msg",
            prompt: "summarize the conversation",
            args: {
                summary_role: "user",
            },
        });
        expect(json.data.maxTurns).toBe(0);
        expect(json.data.maxRounds).toBe(0);
        expect(json.data.afterWork).toEqual({
            recipientType: "agent",
            recipient: "wa-2",
        });
        expect((json.data as any).label).toBeFalsy();
    });
    it("should export an edge without afterWork", () => {
        const edge: WaldiezEdge = {
            id: "1",
            source: "wa-1",
            target: "wa-2",
            data: {
                label: "custom_chat",
                description: "custom_description",
                position: 0,
                order: 0,
                clearHistory: false,
                message: {
                    type: "none",
                    use_carryover: false,
                    content: null,
                    context: {},
                },
                nestedChat: {
                    message: null,
                    reply: null,
                },
                prerequisites: [],
                summary: {
                    method: "last_msg",
                    prompt: "summarize the conversation",
                    args: {
                        summary_role: "user",
                    },
                },
                maxTurns: 0,
                maxRounds: 0,
                afterWork: null,
                flowAfterWork: null,
                contextVariables: {},
                available: {
                    type: "none",
                    value: null,
                },
                realSource: "wa-1",
                realTarget: "wa-2",
            },
        };
        const json = chatMapper.exportChat(edge, 0);
        expect(json).toBeTruthy();
        expect(json.data.afterWork).toBeNull();
    });
});
