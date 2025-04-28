/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getAvailable,
    getChatAfterWork,
    getChatClearHistory,
    getChatDescription,
    getChatMaxRounds,
    getChatMaxTurns,
    getChatName,
    getChatOrder,
    getChatPosition,
    getChatRest,
    getContextVariables,
    getRealSource,
    getRealTarget,
    updateEdge,
} from "@waldiez/models/mappers/chat/utils";

import { updateData } from "./data";

describe("getChatClearHistory", () => {
    it("should return the clearHistory value", () => {
        expect(getChatClearHistory({ clearHistory: true })).toBe(true);
        expect(getChatClearHistory({ clearHistory: false })).toBe(false);
        expect(getChatClearHistory({})).toBe(true);
    });
});

describe("getChatName", () => {
    it("should return the label value", () => {
        expect(getChatName({ label: "Chat" })).toBe("Chat");
        expect(getChatName({ label: "" })).toBe("Chat");
        expect(getChatName({ label: 5 })).toBe("Chat");
        expect(getChatName({})).toBe("Chat");
    });
});

describe("getChatDescription", () => {
    it("should return the description value", () => {
        expect(getChatDescription({ description: "Chat Description" })).toBe("Chat Description");
        expect(getChatDescription({ description: "" })).toBe("Chat Description");
        expect(getChatDescription({ description: 5 })).toBe("Chat Description");
        expect(getChatDescription({})).toBe("Chat Description");
    });
});

describe("getChatPosition", () => {
    it("should return the position value", () => {
        expect(getChatPosition({ position: 0 }, 1)).toBe(0);
        expect(getChatPosition({ position: 1 }, 1)).toBe(1);
        expect(getChatPosition({ position: 2 }, 1)).toBe(2);
        expect(getChatPosition({ position: -1 }, 1)).toBe(-1);
        expect(getChatPosition({ position: 1.5 }, 1)).toBe(1);
        expect(getChatPosition({ position: "1" }, 2)).toBe(2);
        expect(getChatPosition({ position: "1.5" }, 3)).toBe(3);
        expect(getChatPosition({} as any, 1)).toBe(1);
    });
});

describe("getChatMaxTurns", () => {
    it("should return the maxTurns value", () => {
        expect(getChatMaxTurns({ maxTurns: 0 })).toBe(0);
        expect(getChatMaxTurns({ maxTurns: 1 })).toBe(1);
        expect(getChatMaxTurns({ maxTurns: 2 })).toBe(2);
        expect(getChatMaxTurns({ maxTurns: -1 })).toBe(-1);
        expect(getChatMaxTurns({ maxTurns: 1.5 })).toBe(1);
        expect(getChatMaxTurns({ maxTurns: "1" })).toBe(null);
        expect(getChatMaxTurns({ maxTurns: "1.5" })).toBe(null);
        expect(getChatMaxTurns({} as any)).toBe(null);
    });
});

describe("getChatOrder", () => {
    it("should return the order value", () => {
        expect(getChatOrder({ order: 0 })).toBe(0);
        expect(getChatOrder({ order: 1 })).toBe(1);
        expect(getChatOrder({ order: 2 })).toBe(2);
        expect(getChatOrder({ order: -1 })).toBe(-1);
        expect(getChatOrder({ order: 1.5 })).toBe(1);
        expect(getChatOrder({ order: "1" })).toBe(-1);
        expect(getChatOrder({ order: "1.5" })).toBe(-1);
        expect(getChatOrder({} as any)).toBe(-1);
    });
});

describe("getChatMaxRounds", () => {
    it("should return the maxRounds value", () => {
        expect(getChatMaxRounds({ maxRounds: 0 })).toBe(0);
        expect(getChatMaxRounds({ maxRounds: 1 })).toBe(1);
        expect(getChatMaxRounds({ maxRounds: 2 })).toBe(2);
        expect(getChatMaxRounds({ maxRounds: -1 })).toBe(-1);
        expect(getChatMaxRounds({ maxRounds: 1.5 })).toBe(1);
        expect(getChatMaxRounds({ maxRounds: "1" })).toBe(20);
        expect(getChatMaxRounds({ maxRounds: "1.5" })).toBe(20);
        expect(getChatMaxRounds({} as any)).toBe(20);
    });
});

describe("getContextVariables", () => {
    it("should return the contextVariables value", () => {
        expect(
            getContextVariables({
                contextVariables: {
                    context_key1: "context_value",
                    context_key2: 5,
                    context_key3: true,
                    context_key4: null,
                },
            }),
        ).toEqual({
            context_key1: "context_value",
            context_key2: "5",
            context_key3: "true",
            context_key4: "",
        });
        expect(getContextVariables({ contextVariables: {} })).toEqual({});
        expect(getContextVariables({})).toEqual({});
    });
});

describe("getAvailable", () => {
    it("should return the available value", () => {
        expect(getAvailable({ available: { type: "string", value: "value" } })).toEqual({
            type: "string",
            value: "value",
        });
        expect(getAvailable({ available: { type: "callable", value: "value" } })).toEqual({
            type: "callable",
            value: "value",
        });
        expect(getAvailable({ available: { type: "none", value: null } })).toEqual({
            type: "none",
            value: null,
        });
        expect(getAvailable({ available: {} })).toEqual({
            type: "none",
            value: null,
        });
        expect(getAvailable({})).toEqual({
            type: "none",
            value: null,
        });
    });
});

describe("getChatAfterWork", () => {
    it("should return the afterWork value", () => {
        expect(
            getChatAfterWork({
                afterWork: { recipientType: "agent", recipient: "wa-2" },
            }),
        ).toEqual({
            recipientType: "agent",
            recipient: "wa-2",
        });
        expect(getChatAfterWork({ afterWork: {} })).toBeNull();
        expect(getChatAfterWork({})).toBeNull();
    });
});

describe("getRealSource", () => {
    it("should return the realSource value", () => {
        expect(getRealSource({ realSource: "wa-1" })).toBe("wa-1");
        expect(getRealSource({})).toBeNull();
    });
});

describe("getRealTarget", () => {
    it("should return the realTarget value", () => {
        expect(getRealTarget({ realTarget: "wa-2" })).toBe("wa-2");
        expect(getRealTarget({})).toBeNull();
    });
});

describe("getChatRest", () => {
    it("should return the rest value", () => {
        expect(
            getChatRest({
                id: "1",
                data: { source: "wa-1", target: "wa-2" },
                type: "chat",
            }),
        ).toEqual({});
        expect(
            getChatRest({
                id: "1",
                data: { source: "wa-1", target: "wa-2" },
                type: "chat",
                custom: "value",
            }),
        ).toEqual({
            custom: "value",
        });
    });
});

describe("updateEdge", () => {
    it("should update the edge", () => {
        const { edge, chat, json, expected } = updateData;
        const sourceNode = {
            data: { agentType: "agent" },
            id: "wa-1",
            position: { x: 0, y: 0 },
        };
        const targetNode = {
            data: { agentType: "agent" },
            id: "wa-2",
            position: { x: 20, y: 20 },
        };
        const rest = {
            sourceHandle: "agent-handle-top-source-wa-1",
            targetHandle: "agent-handle-top-target-wa-2",
        };

        const updatedEdge = updateEdge(edge, chat, json, sourceNode, targetNode, rest);
        expect(updatedEdge).toEqual(expected);
    });
    it("should handle the case when the target node is a swarm_container and the realTarget is not null", () => {
        const { edge } = updateData;
        const json = structuredClone({
            ...updateData.json,
            realTarget: "wa-3",
            swarm_agents: [
                {
                    id: "wa-3",
                },
            ],
        });
        const chatData = structuredClone({
            ...updateData.chat,
            realTarget: "wa-3",
        });
        const sourceNode = {
            data: { agentType: "agent" },
            id: "wa-1",
            position: { x: 0, y: 0 },
        };
        const targetNode = {
            data: { agentType: "swarm_container" },
            id: "wc-2",
            position: { x: 20, y: 20 },
        };
        const rest = {
            sourceHandle: "agent-handle-top-source-wa-1",
            targetHandle: "agent-handle-top-target-wa-2",
        };

        const updatedEdge = updateEdge(edge, chatData, json, sourceNode, targetNode, rest);
        const expected = structuredClone({
            ...updateData.expected,
            target: "wa-3",
            targetHandle: "agent-handle-top-target-wa-3",
            data: {
                ...updateData.expected.data,
                target: "wa-3",
                realTarget: "wa-3",
            },
        });
        expect(updatedEdge).toEqual(expected);
    });
    it("should handle the case when the target node is a swarm_container and the realTarget is null", () => {
        const { edge } = updateData;
        const json = structuredClone({
            ...updateData.json,
            realTarget: null,
            swarm_agents: [
                {
                    id: "wa-3",
                },
            ],
        });
        const chatData = structuredClone({
            ...updateData.chat,
            realTarget: null,
        });
        const sourceNode = {
            data: { agentType: "agent" },
            id: "wa-1",
            position: { x: 0, y: 0 },
        };
        const targetNode = {
            data: { agentType: "swarm_container" },
            id: "wc-2",
            position: { x: 20, y: 20 },
        };
        const rest = {
            sourceHandle: "agent-handle-top-source-wa-1",
            targetHandle: "agent-handle-top-target-wa-2",
        };

        const updatedEdge = updateEdge(edge, chatData, json, sourceNode, targetNode, rest);
        const expected = structuredClone({
            ...updateData.expected,
            target: "wa-3",
            targetHandle: "agent-handle-top-target-wa-3",
            data: {
                ...updateData.expected.data,
                target: "wa-3",
                realTarget: "wa-3",
            },
        });
        expect(updatedEdge).toEqual(expected);
    });
});
