/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { getNodes } from "@waldiez/models/mappers/flow/utils";

describe("getNodes", () => {
    it("should return the correct nodes", () => {
        const json = {
            nodes: [
                {
                    id: "123",
                    type: "model",
                    position: { x: 0, y: 0 },
                    selected: false,
                    data: {},
                },
            ],
        };
        const nodes = getNodes(json);
        expect(nodes).toEqual([
            {
                id: "123",
                type: "model",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
                selected: false,
            },
        ]);
    });
    it("should not return nodes if nodes is not an array", () => {
        const json = {
            nodes: {},
        };
        const nodes = getNodes(json);
        expect(nodes).toEqual([]);
    });
    it("should not return nodes if nodes is not in the json", () => {
        const json = {};
        const nodes = getNodes(json);
        expect(nodes).toEqual([]);
    });
    it("should skip invalid nodes", () => {
        const json = {
            nodes: [
                {
                    id: "123",
                    type: "agent",
                    position: { x: 0, y: 0 },
                    parentId: "agent2",
                    data: {
                        agentType: "user",
                    },
                },
                {
                    id: "456",
                    type: "invalid",
                    position: { x: 0, y: 0 },
                    data: {},
                },
                {
                    id: "789",
                    position: { x: 0, y: 0 },
                    data: {},
                },
                {
                    id: "101112",
                    type: "model",
                    position: { x: "a", y: 0 },
                    data: {},
                },
                {
                    id: "101113",
                    type: "skill",
                    position: 4,
                    data: {},
                },
            ],
        };
        const nodes = getNodes(json);
        expect(nodes).toEqual([json.nodes[0]]);
    });
});
