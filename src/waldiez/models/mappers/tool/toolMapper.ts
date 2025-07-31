/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    DEFAULT_SHARED_TOOL_CONTENT,
    PREDEFINED_TOOL_REQUIRED_ENVS,
    PREDEFINED_TOOL_REQUIRED_KWARGS,
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

/**
 * toolMapper is a utility object that provides methods to import and export tools,
 * as well as convert them to and from node format.
 * It includes methods to import a tool from JSON, export a tool to JSON,
 * and convert a WaldiezTool instance to a WaldiezNodeTool instance.
 * @see {@link WaldiezTool}
 */
export const toolMapper = {
    /**
     * Imports a tool from JSON.
     * If the JSON is invalid or missing, it creates a new tool with default values.
     * @param json - The JSON representation of the tool.
     * @returns A new instance of WaldiezTool.
     */
    importTool: (json: unknown): WaldiezTool => {
        if (!json || typeof json !== "object") {
            return new WaldiezTool({
                id: "wt-" + getId(),
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
        const kwargs = getToolDataKwargs(jsonObject.data || (jsonObject as any));
        const data = new WaldiezToolData({
            toolType,
            content,
            secrets,
            kwargs,
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

    /**
     * Exports a tool to JSON format.
     * If replaceSecrets is true, it replaces all secret values with "REPLACE_ME".
     * @param toolNode - The WaldiezNodeTool instance to export.
     * @param replaceSecrets - Whether to replace secret values with "REPLACE_ME".
     * @returns A JSON representation of the tool.
     */
    exportTool: (toolNode: WaldiezNodeTool, replaceSecrets: boolean): { [key: string]: unknown } => {
        let secrets: { [key: string]: string } = { ...toolNode.data.secrets } as { [key: string]: string };
        if (replaceSecrets) {
            secrets = replaceToolSecrets(toolNode);
        }
        let kwargs: { [key: string]: unknown } = { ...toolNode.data.kwargs } as { [key: string]: unknown };
        if (toolNode.data.toolType === "predefined") {
            // check required kwargs for predefined tools
            const requiredKwargs = PREDEFINED_TOOL_REQUIRED_KWARGS[toolNode.data.label] || {};
            kwargs = Object.entries(requiredKwargs).reduce(
                (acc, [key, _]) => {
                    acc[key] = kwargs[key] || secrets[key] || "REPLACE_ME";
                    return acc;
                },
                {} as { [key: string]: unknown },
            );
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
                kwargs,
            },
            ...rest,
        };
    },

    /**
     * Converts a WaldiezTool instance to a WaldiezNodeTool instance.
     * @param tool - The WaldiezTool instance to convert.
     * @param position - Optional position for the node.
     * @returns A new instance of WaldiezNodeTool.
     */
    asNode: (tool: WaldiezTool, position?: { x: number; y: number }): WaldiezNodeTool => {
        const nodePosition = getNodePositionFromJSON(tool, position);
        const toolLabel = tool.rest?.label || tool.name;
        const nodeData = {
            ...tool.data,
            label: toolLabel,
            name: tool.name,
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

/**
 * Gets the content of the tool data from the JSON object.
 * If the content is not present or not a string, it returns the default custom tool content.
 * @param json - The JSON object containing tool data.
 * @returns The content of the tool data.
 */
const getToolDataContent = (json: Record<string, unknown>): string => {
    let content = DEFAULT_SHARED_TOOL_CONTENT;
    if ("content" in json && typeof json.content === "string") {
        content = json.content;
    }
    return content;
};

/**
 * Gets the secrets (environment variables) of the tool data from the JSON object.
 * If the secrets are not present or not an object, it returns an empty object.
 * @param json - The JSON object containing tool data.
 * @returns An object containing the secrets of the tool data.
 */
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

/**
 * Replaces the secrets in the tool node with "REPLACE_ME".
 * It checks for required environment variables and keyword arguments for predefined tools.
 * @param toolNode - The WaldiezNodeTool instance to process.
 * @returns An object containing the modified secrets.
 */
// eslint-disable-next-line max-statements
const replaceToolSecrets = (toolNode: WaldiezNodeTool): { [key: string]: string } => {
    const secrets = { ...toolNode.data.secrets } as { [key: string]: string };
    if (toolNode.data.toolType === "predefined") {
        // check required secrets for predefined tools
        const requiredEnvs = PREDEFINED_TOOL_REQUIRED_ENVS[toolNode.data.label] || [];
        const requiredKwargs = PREDEFINED_TOOL_REQUIRED_KWARGS[toolNode.data.label] || [];
        for (const env of requiredEnvs) {
            if (secrets[env.key] && typeof secrets[env.key] === "string") {
                secrets[env.key] = "REPLACE_ME";
            } else {
                secrets[env.key] = "REPLACE_ME";
            }
        }
        for (const kwarg of requiredKwargs) {
            if (toolNode.data.kwargs && toolNode.data.kwargs[kwarg.key]) {
                secrets[kwarg.key] = "REPLACE_ME";
            } else {
                secrets[kwarg.key] = "REPLACE_ME";
            }
        }
    }
    for (const key in secrets) {
        if (typeof secrets[key] === "string" || !secrets[key]) {
            secrets[key] = "REPLACE_ME";
        }
    }
    return secrets;
};

/**
 * Gets the metadata of a tool from the JSON object.
 * It extracts the name, description, tags, requirements, createdAt, and updatedAt fields.
 * If any of these fields are not present or invalid, it uses default values.
 * @param json - The JSON object containing tool metadata.
 * @returns An object containing the tool metadata.
 */
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

/**
 * Gets the tool data type from the JSON object.
 * It checks for the "toolType" field and returns its value if valid.
 * If the tool name is "waldiez_shared", it sets the tool type to "shared".
 * If no valid tool type is found, it defaults to "custom".
 * @param json - The JSON object containing tool data.
 * @param toolName - The name of the tool.
 * @returns The tool type as a WaldiezToolType.
 */
const getToolDataType = (json: Record<string, unknown>, toolName: string): WaldiezToolType => {
    let toolType: WaldiezToolType = "shared";
    if (
        "toolType" in json &&
        typeof json.toolType === "string" &&
        ["shared", "custom", "langchain", "crewai", "predefined"].includes(json.toolType)
    ) {
        toolType = json.toolType as WaldiezToolType;
    }
    if (toolName === "waldiez_shared") {
        toolType = "shared";
    }
    return toolType;
};

/**
 * Gets the keyword arguments (kwargs) from the tool data in the JSON object.
 * If kwargs are not present or not an object, it returns an empty object.
 * @param json - The JSON object containing tool data.
 * @returns An object containing the keyword arguments of the tool data.
 */
const getToolDataKwargs = (json: Record<string, unknown>): { [key: string]: unknown } => {
    let kwargs: { [key: string]: unknown } = {};
    if ("kwargs" in json && typeof json.kwargs === "object") {
        if (json.kwargs !== null) {
            kwargs = Object.entries(json.kwargs).reduce(
                (acc, [key, value]) => {
                    acc[key] = value;
                    return acc;
                },
                {} as { [key: string]: unknown },
            );
        }
    }
    return kwargs;
};
