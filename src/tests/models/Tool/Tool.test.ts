/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_CUSTOM_TOOL_CONTENT, WaldiezTool, WaldiezToolData } from "@waldiez/models/Tool";

describe("WaldiezTool", () => {
    it("should create an instance", () => {
        const toolData = new WaldiezToolData();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const tool = new WaldiezTool({
            id: "1",
            name: "new_tool",
            description: "Tool Description",
            tags: [],
            requirements: [],
            createdAt,
            updatedAt,
            data: toolData,
        });
        expect(tool).toBeTruthy();
        expect(tool.id).toBe("1");
        expect(tool.data.content).toBe(DEFAULT_CUSTOM_TOOL_CONTENT);
        const tool2 = WaldiezTool.create();
        expect(tool2).toBeTruthy();
        expect(tool2.data.content).toBe(DEFAULT_CUSTOM_TOOL_CONTENT);
    });
    it("should create an instance with custom data", () => {
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const toolData = new WaldiezToolData({
            content: "custom_content",
            secrets: { secret: "value" },
            toolType: "custom",
        });
        const tool = new WaldiezTool({
            id: "1",
            name: "custom_tool",
            description: "custom_description",
            tags: ["tag"],
            requirements: ["requirement"],
            createdAt,
            updatedAt,
            data: toolData,
            rest: { key: "42" },
        });
        expect(tool).toBeTruthy();
        expect(tool.id).toBe("1");
        expect(tool.name).toBe("custom_tool");
        expect(tool.description).toBe("custom_description");
        expect(tool.tags).toEqual(["tag"]);
        expect(tool.requirements).toEqual(["requirement"]);
        expect(tool.createdAt).toBe(createdAt);
        expect(tool.updatedAt).toBe(updatedAt);
        expect(tool.data.content).toBe("custom_content");
        expect(tool.data.secrets).toEqual({ secret: "value" });
        expect(tool.rest).toEqual({ key: "42" });
    });
});
