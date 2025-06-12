/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_CUSTOM_TOOL_CONTENT, WaldiezNodeTool, WaldiezTool, WaldiezToolData } from "@waldiez/models";
import { toolMapper } from "@waldiez/models/mappers";

describe("toolMapper", () => {
    it("should import a tool", () => {
        const toolJson = {
            type: "tool",
            id: "1",
            name: "custom_tool",
            description: "custom_description",
            tags: ["tag2"],
            requirements: ["requirement1"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: {
                content: "custom_content",
                secrets: { secret: "value" },
            },
        };
        const tool = toolMapper.importTool(toolJson);
        expect(tool).toBeTruthy();
        expect(tool.id).toBe("1");
        expect(tool.name).toBe("custom_tool");
        expect(tool.description).toBe("custom_description");
        expect(tool.tags).toEqual(["tag2"]);
        expect(tool.requirements).toEqual(["requirement1"]);
        expect(tool.createdAt).toBe(toolJson.createdAt);
        expect(tool.updatedAt).toBe(toolJson.updatedAt);
        expect(tool.data.content).toBe("custom_content");
        expect(tool.data.secrets).toEqual({ secret: "value" });
    });
    it("should import a tool with invalid json", () => {
        const tool = toolMapper.importTool(4);
        expect(tool).toBeTruthy();
        expect(tool.id).toBeTypeOf("string");
        expect(tool.name).toBe("new_tool");
        expect(tool.data.content).toBe(DEFAULT_CUSTOM_TOOL_CONTENT);
    });
    it("should import a tool with no data in json", () => {
        const tool = toolMapper.importTool({
            type: "tool",
            id: "1",
        });
        expect(tool).toBeTruthy();
        expect(tool.id).toBe("1");
        expect(tool.name).toBe("new_tool");
        expect(tool.data.content).toBe(DEFAULT_CUSTOM_TOOL_CONTENT);
    });
    it("should use the label when no name is provided", () => {
        const tool = toolMapper.importTool({
            type: "tool",
            id: "1",
            label: "custom_label",
        });
        expect(tool).toBeTruthy();
        expect(tool.id).toBe("1");
        expect(tool.name).toBe("custom_label");
        expect(tool.data.content).toBe(DEFAULT_CUSTOM_TOOL_CONTENT);
    });
    it("should export a tool node", () => {
        const toolData = new WaldiezToolData();
        const toolNode = {
            id: "1",
            data: { ...toolData, label: "toolName" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeTool;
        const toolJson = toolMapper.exportTool(toolNode, false);
        expect(toolJson).toBeTruthy();
        expect(toolJson.id).toBe("1");
        expect(toolJson.type).toBe("tool");
        expect(toolJson.name).toBe(toolNode.data.label);
        expect(toolJson.description).toBe(toolNode.data.description);
        expect(toolJson.tags).toEqual(toolNode.data.tags);
        expect(toolJson.requirements).toEqual(toolNode.data.requirements);
        expect(toolJson.createdAt).toBe(toolNode.data.createdAt);
        expect(toolJson.updatedAt).toBe(toolNode.data.updatedAt);
    });
    it("should export a tool node with secrets replaced", () => {
        const toolData = new WaldiezToolData();
        toolData.secrets = { secret: "value" };
        const toolNode = {
            id: "1",
            data: { ...toolData, label: "new_tool" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeTool;
        const toolJson = toolMapper.exportTool(toolNode, true);
        expect(toolJson).toBeTruthy();
        expect(toolJson.id).toBe("1");
        expect(toolJson.type).toBe("tool");
        expect((toolJson.data as any).secrets).toEqual({
            secret: "REPLACE_ME",
        });
    });
    it("should convert a tool to a tool node", () => {
        const toolData = new WaldiezToolData();
        const tool = new WaldiezTool({
            id: "1",
            name: "tool_name",
            description: "tool_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: toolData,
            rest: { position: { x: 10, y: 11 } },
        });
        const toolNode = toolMapper.asNode(tool);
        expect(toolNode).toBeTruthy();
        expect(toolNode.id).toBe("1");
        expect(toolNode.data.label).toBe("tool_name");
        expect(toolNode.data.content).toBe(toolData.content);
        expect(toolNode.data.description).toBe("tool_description");
        expect(toolNode.data.secrets).toEqual(toolData.secrets);
        expect(toolNode.position).toEqual({ x: 10, y: 11 });
    });
    it("should convert a tool to a tool node with custom position", () => {
        const toolData = new WaldiezToolData();
        const tool = new WaldiezTool({
            id: "1",
            name: "tool_name",
            description: "tool_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: toolData,
            rest: { position: {} },
        });
        const toolNode = toolMapper.asNode(tool, { x: 20, y: 21 });
        expect(toolNode).toBeTruthy();
        expect(toolNode.id).toBe("1");
        expect(toolNode.data.label).toBe("tool_name");
        expect(toolNode.data.content).toBe(toolData.content);
        expect(toolNode.data.description).toBe("tool_description");
        expect(toolNode.data.secrets).toEqual(toolData.secrets);
        expect(toolNode.position).toEqual({ x: 20, y: 21 });
    });
});
