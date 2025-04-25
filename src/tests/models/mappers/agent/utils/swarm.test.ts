/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getIsInitial,
    getSwarmFunctions,
    getSwarmHandoffs,
    getSwarmUpdateAgentStateBeforeReply,
} from "@waldiez/models/mappers/agent/utils/swarm";

describe("getSwarmFunctions", () => {
    it("should return an empty array if no functions", () => {
        const functions = getSwarmFunctions({});
        expect(functions).toEqual([]);
    });
    it("should return an empty array if functions is not an array", () => {
        const functions = getSwarmFunctions({ functions: 4 });
        expect(functions).toEqual([]);
    });
    it("should return an empty array if functions is not an array of strings", () => {
        const functions = getSwarmFunctions({ functions: [4] });
        expect(functions).toEqual([]);
    });
    it("should return an array of functions", () => {
        const functions = getSwarmFunctions({ functions: ["function"] });
        expect(functions).toEqual(["function"]);
    });
});

describe("getSwarmUpdateAgentStateBeforeReply", () => {
    it("should return an empty array if no updateAgentStateBeforeReply", () => {
        const updateAgentStateBeforeReply = getSwarmUpdateAgentStateBeforeReply({});
        expect(updateAgentStateBeforeReply).toEqual([]);
    });
    it("should return an empty array if updateAgentStateBeforeReply is not an array", () => {
        const updateAgentStateBeforeReply = getSwarmUpdateAgentStateBeforeReply({
            updateAgentStateBeforeReply: 4,
        });
        expect(updateAgentStateBeforeReply).toEqual([]);
    });
    it("should return an empty array if updateAgentStateBeforeReply is not an array of objects", () => {
        const updateAgentStateBeforeReply = getSwarmUpdateAgentStateBeforeReply({
            updateAgentStateBeforeReply: [4],
        });
        expect(updateAgentStateBeforeReply).toEqual([]);
    });
    it("should return an empty array if updateAgentStateBeforeReply is not an array of objects with the right keys", () => {
        const updateAgentStateBeforeReply = getSwarmUpdateAgentStateBeforeReply({
            updateAgentStateBeforeReply: [{ updateFunctionType: "string" }],
        });
        expect(updateAgentStateBeforeReply).toEqual([]);
    });
    it("should return an array of updateAgentStateBeforeReply", () => {
        const updateAgentStateBeforeReply = getSwarmUpdateAgentStateBeforeReply({
            updateAgentStateBeforeReply: [{ updateFunctionType: "string", updateFunction: "function" }],
        });
        expect(updateAgentStateBeforeReply).toEqual([
            { updateFunctionType: "string", updateFunction: "function" },
        ]);
    });
});

describe("getIsInitial", () => {
    it("should return false if no isInitial", () => {
        const isInitial = getIsInitial({});
        expect(isInitial).toBe(false);
    });
    it("should return false if isInitial is not an object", () => {
        const isInitial = getIsInitial({ isInitial: 4 });
        expect(isInitial).toBe(false);
    });
    it("should return false if isInitial is not a boolean", () => {
        const isInitial = getIsInitial({ isInitial: "true" });
        expect(isInitial).toBe(false);
    });
    it("should return true if isInitial is true", () => {
        const isInitial = getIsInitial({ isInitial: true });
        expect(isInitial).toBe(true);
    });
});

describe("getSwarmHandoffs", () => {
    it("should return an empty array if no handoffs", () => {
        const handoffs = getSwarmHandoffs({});
        expect(handoffs).toEqual([]);
    });
    it("should return an empty array if handoffs is not an array", () => {
        const handoffs = getSwarmHandoffs({ handoffs: 4 });
        expect(handoffs).toEqual([]);
    });
    it("should return an empty array if handoffs is not an array of objects", () => {
        const handoffs = getSwarmHandoffs({ handoffs: [4] });
        expect(handoffs).toEqual([]);
    });
    it("should return an empty array if handoffs is not an array of objects with the right keys", () => {
        const handoffs = getSwarmHandoffs({ handoffs: [{ recipientType: "option" }] });
        expect(handoffs).toEqual([]);
    });
    it("should return an array of handoffs", () => {
        const handoffs = getSwarmHandoffs({
            handoffs: [
                { recipientType: "option", recipient: "TERMINATE" },
                { recipientType: "option", recipient: "INVALID" },
                {
                    recipientType: "agent",
                    recipient: "agent1",
                },
                {
                    recipientType: "other",
                    recipient: "agent1",
                },
                // agent handoffs are determined by the graph edges
                {
                    targetType: "agent",
                    target: "agent",
                    condition: "condition",
                    available: {
                        type: "string",
                        value: "value",
                    },
                },
                {
                    targetType: "nested_chat",
                    target: { id: "id", order: 1 },
                    condition: "condition",
                    available: {
                        type: "callable",
                        value: "value",
                    },
                },
            ],
        });
        expect(handoffs).toEqual([
            { recipientType: "option", recipient: "TERMINATE" },
            { recipientType: "agent", recipient: "agent1" },
            {
                targetType: "nested_chat",
                target: { id: "id", order: 1 },
                condition: "condition",
                available: {
                    type: "callable",
                    value: "value",
                },
            },
        ]);
    });
});
