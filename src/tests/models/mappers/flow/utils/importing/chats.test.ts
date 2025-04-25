/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getChats } from "@waldiez/models/mappers/flow/utils";

describe("getChats", () => {
    it("should return the correct chats", () => {
        const json = {
            chats: [
                {
                    id: "wc-1",
                    type: "chat",
                    data: {
                        source: "wa-1",
                        target: "wa-2",
                        name: "agent1 => agent2",
                        description: "New connection",
                        position: 1,
                        order: 1,
                        clearHistory: true,
                        maxTurns: 4,
                        summary: {
                            method: "last_msg",
                            prompt: "",
                            args: {},
                        },
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
                        maxRounds: 20,
                        afterWork: null,
                    },
                },
                {
                    id: "wd-2",
                },
            ],
        };
        const nodes = [
            {
                id: "wa-1",
                type: "agent",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {
                    label: "agent1",
                },
            },
            {
                id: "wa-2",
                type: "agent",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {
                    label: "agent2",
                },
            },
        ];
        const edges = [
            {
                id: "wc-1",
                type: "chat",
                source: "wa-1",
                target: "wa-2",
                hidden: false,
                data: {},
            },
        ];
        const { chats, edges: updatedEdges } = getChats(json, nodes, edges);
        expect(chats).toEqual([
            {
                id: "wc-1",
                data: {
                    source: "wa-1",
                    target: "wa-2",
                    name: "agent1 => agent2",
                    description: "New connection",
                    position: 1,
                    order: 1,
                    clearHistory: true,
                    maxTurns: 4,
                    summary: {
                        method: "last_msg",
                        prompt: "",
                        args: {},
                    },
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
                    maxRounds: 20,
                    afterWork: null,
                    flowAfterWork: null,
                    contextVariables: {},
                    available: {
                        type: "none",
                        value: null,
                    },
                    realSource: null,
                    realTarget: null,
                },
                rest: {
                    type: "chat",
                    animated: false,
                    hidden: false,
                    markerEnd: {
                        type: "arrowclosed",
                        width: 10,
                        height: 10,
                        color: undefined,
                    },
                    sourceHandle: null,
                    style: {
                        stroke: undefined,
                        strokeWidth: 3,
                    },
                    targetHandle: null,
                },
            },
        ]);
        const edgeData = chats[0].data as any;
        delete edgeData.name;
        expect(updatedEdges).toEqual([
            {
                id: "wc-1",
                type: "chat",
                source: "wa-1",
                target: "wa-2",
                hidden: false,
                animated: false,
                data: {
                    ...edgeData,
                    label: "agent1 => agent2",
                },
                markerEnd: {
                    type: "arrowclosed",
                    width: 10,
                    height: 10,
                    color: undefined,
                },
                sourceHandle: null,
                style: {
                    stroke: undefined,
                    strokeWidth: 3,
                },
                targetHandle: null,
            },
        ]);
    });
    it("should not return chats if chats is not an array", () => {
        const json = {
            chats: {},
        };
        const nodes: any[] = [];
        const edges: any[] = [];
        const { chats, edges: updatedEdges } = getChats(json, nodes, edges);
        expect(chats).toEqual([]);
        expect(updatedEdges).toEqual(edges);
    });
    it("should not return chats if chats is not in the json", () => {
        const json = {};
        const nodes: any[] = [];
        const edges: any[] = [];
        const { chats, edges: updatedEdges } = getChats(json, nodes, edges);
        expect(chats).toEqual([]);
        expect(updatedEdges).toEqual(edges);
    });
});
