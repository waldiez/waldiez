/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    DEFAULT_CUSTOM_TOOL_CONTENT,
    WaldiezNodeTool,
    WaldiezTool,
    WaldiezToolData,
    WaldiezToolType,
} from "@waldiez/models/Tool";
import {
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getIdFromJSON,
    getNameFromJSON,
    getNodePositionFromJSON,
    getRequirementsFromJSON,
    getRestFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";
import { getId } from "@waldiez/utils";

export const toolMapper = {
    importTool: (json: unknown): WaldiezTool => {
        if (!json || typeof json !== "object") {
            return new WaldiezTool({
                id: "ws-" + getId(),
                name: "new_tool",
                description: "A new tool",
                tags: [],
                requirements: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: new WaldiezToolData(),
            });
        }
        const jsonObject = json as Record<string, unknown>;
        const id = getIdFromJSON(jsonObject);
        const { name, description, tags, requirements, createdAt, updatedAt } = getNodeMeta(jsonObject);
        const rest = getRestFromJSON(jsonObject, [
            "id",
            "type",
            "name",
            "description",
            "tags",
            "requirements",
            "createdAt",
            "updatedAt",
            "data",
        ]);
        const toolType = getToolDataType(jsonObject.data || (jsonObject as any), name);
        const content = getToolDataContent(jsonObject.data || (jsonObject as any));
        const secrets = getToolDataSecrets(jsonObject.data || (jsonObject as any));
        const data = new WaldiezToolData({
            toolType,
            content,
            secrets,
        });
        return new WaldiezTool({
            id,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data,
            rest,
        });
    },
    exportTool: (toolNode: WaldiezNodeTool, replaceSecrets: boolean): { [key: string]: unknown } => {
        const secrets = { ...toolNode.data.secrets };
        if (replaceSecrets) {
            for (const key in secrets) {
                if (typeof secrets[key] === "string") {
                    secrets[key] = "REPLACE_ME";
                }
            }
        }
        const rest = getRestFromJSON(toolNode, ["id", "type", "parentId", "data"]);
        const toolName = toolNode.data.label;
        const toolType = toolName === "waldiez_shared" ? "shared" : toolNode.data.toolType;
        return {
            id: toolNode.id,
            type: "tool",
            name: toolName,
            description: toolNode.data.description,
            tags: toolNode.data.tags,
            requirements: toolNode.data.requirements,
            createdAt: toolNode.data.createdAt,
            updatedAt: toolNode.data.updatedAt,
            data: {
                content: toolNode.data.content,
                toolType,
                secrets,
            },
            ...rest,
        };
    },
    asNode: (tool: WaldiezTool, position?: { x: number; y: number }): WaldiezNodeTool => {
        const nodePosition = getNodePositionFromJSON(tool, position);
        const nodeData = {
            ...tool.data,
            label: tool.name,
            description: tool.description,
            tags: tool.tags,
            requirements: tool.requirements,
            createdAt: tool.createdAt,
            updatedAt: tool.updatedAt,
        } as { [key: string]: unknown };
        if (tool.rest && "position" in tool.rest) {
            delete tool.rest.position;
        }
        const data = nodeData as WaldiezNodeTool["data"];
        return {
            id: tool.id,
            type: "tool",
            data,
            position: nodePosition,
            ...tool.rest,
        };
    },
};

const getToolDataContent = (json: Record<string, unknown>): string => {
    let content = DEFAULT_CUSTOM_TOOL_CONTENT;
    if ("content" in json && typeof json.content === "string") {
        content = json.content;
    }
    return content;
};

const getToolDataSecrets = (json: Record<string, unknown>): { [key: string]: string } => {
    let secrets: { [key: string]: string } = {};
    if ("secrets" in json && typeof json.secrets === "object") {
        if (json.secrets !== null) {
            secrets = Object.entries(json.secrets).reduce(
                (acc, [key, value]) => {
                    acc[key] = value.toString();
                    return acc;
                },
                {} as { [key: string]: string },
            );
        }
    }
    return secrets;
};

const getNodeMeta = (
    json: Record<string, unknown>,
): {
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
} => {
    const name = getNameFromJSON(json, "new_tool")!;
    const description = getDescriptionFromJSON(json, "A new tool");
    const tags = getTagsFromJSON(json);
    const requirements = getRequirementsFromJSON(json);
    const createdAt = getCreatedAtFromJSON(json);
    const updatedAt = getUpdatedAtFromJSON(json);
    return { name, description, tags, requirements, createdAt, updatedAt };
};

const getToolDataType = (json: Record<string, unknown>, toolName: string): WaldiezToolType => {
    let toolType: WaldiezToolType = "custom";
    if (
        "toolType" in json &&
        typeof json.toolType === "string" &&
        ["shared", "custom", "langchain", "crewai"].includes(json.toolType)
    ) {
        toolType = json.toolType as WaldiezToolType;
    }
    if (toolName === "waldiez_shared") {
        toolType = "shared";
    }
    return toolType;
};
