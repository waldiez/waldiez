/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezToolData } from "@waldiez/models";
import { getTools } from "@waldiez/models/mappers/flow/utils";

describe("getTools", () => {
    it("should return the correct tools", () => {
        const json = {
            tools: [
                {
                    id: "123",
                    type: "tool",
                    name: "Test Tool",
                    description: "A test tool",
                    tags: ["test", "tool"],
                    requirements: ["test"],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    data: {},
                },
            ],
        };
        const nodes = [
            {
                id: "123",
                type: "tool",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
            {
                id: "456",
                type: "tool",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
        ];
        const tools = getTools(json, nodes);
        expect(tools).toEqual([
            {
                id: "123",
                type: "tool",
                name: "Test Tool",
                description: "A test tool",
                tags: ["test", "tool"],
                requirements: ["test"],
                createdAt: json.tools[0].createdAt,
                updatedAt: json.tools[0].updatedAt,
                data: new WaldiezToolData(),
                rest: {
                    position: { x: 0, y: 0 },
                },
            },
        ]);
    });
    it("should not return tools if tools is not an array", () => {
        const json = {
            tools: {},
        };
        const nodes: any[] = [];
        const tools = getTools(json, nodes);
        expect(tools).toEqual([]);
    });
});
