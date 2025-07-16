/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { getId } from "@waldiez/utils";

/** Extracts the ID from a JSON object.
 * If the JSON object has an "id" property, it uses that.
 * If not, it generates a new ID using the `getId` function.
 * @param json - The JSON object to extract the ID from.
 * @returns The ID as a string.
 */
export const getIdFromJSON = (json: Record<string, unknown>): string => {
    let id = `w-${getId()}`;
    if ("id" in json && typeof json.id === "string") {
        id = json.id;
    } else if ("type" in json && typeof json.type === "string" && json.type.length > 0) {
        const itemType = json.type[0]?.toLowerCase();
        id = `w${itemType}-${getId()}`;
    }
    return id;
};

/**
 * Extracts the name from a JSON object.
 * @param json - The JSON object to extract the name from.
 * @param fallback - The fallback name to use if the name is not found.
 * @returns The extracted name or the fallback name.
 */
export const getNameFromJSON = (json: Record<string, unknown>, fallback: string | null): string | null => {
    let name = fallback;
    if ("name" in json && typeof json.name === "string") {
        name = json.name;
    } else if ("label" in json && typeof json.label === "string") {
        name = json.label;
    }
    return name;
};

/**
 * Extracts the description from a JSON object.
 * @param json - The JSON object to extract the description from.
 * @param fallback - The fallback description to use if the description is not found.
 * @returns The extracted description or the fallback description.
 */
export const getDescriptionFromJSON = (json: Record<string, unknown>, fallback: string): string => {
    let description = fallback;
    if ("description" in json && typeof json.description === "string") {
        description = json.description;
    }
    return description;
};

/**
 * Extracts the tags from a JSON object.
 * @param json - The JSON object to extract the tags from.
 * @returns An array of tags.
 */

export const getTagsFromJSON = (json: Record<string, unknown>): string[] => {
    let tags: string[] = [];
    if ("tags" in json && Array.isArray(json.tags)) {
        tags = json.tags.filter(tag => typeof tag === "string");
    }
    return tags;
};

/**
 * Extracts the requirements from a JSON object.
 * @param json - The JSON object to extract the requirements from.
 * @returns An array of requirements.
 */
export const getRequirementsFromJSON = (json: Record<string, unknown>): string[] => {
    let requirements: string[] = [];
    if ("requirements" in json && Array.isArray(json.requirements)) {
        requirements = json.requirements.filter(requirement => typeof requirement === "string");
    }
    return requirements;
};

/**
 * Extracts the createdAt timestamp from a JSON object.
 * If the JSON object has a "createdAt" property, it uses that.
 * If not, it defaults to the current date and time in ISO format.
 * @param json - The JSON object to extract the createdAt timestamp from.
 * @returns The createdAt timestamp as a string in ISO format.
 */
export const getCreatedAtFromJSON = (json: Record<string, unknown>): string => {
    let createdAt = new Date().toISOString();
    if ("createdAt" in json && typeof json.createdAt === "string") {
        createdAt = json.createdAt;
    }
    return createdAt;
};

/**
 * Extracts the updatedAt timestamp from a JSON object.
 * If the JSON object has an "updatedAt" property, it uses that.
 * If not, it defaults to the current date and time in ISO format.
 * @param json - The JSON object to extract the updatedAt timestamp from.
 * @returns The updatedAt timestamp as a string in ISO format.
 */
export const getUpdatedAtFromJSON = (json: Record<string, unknown>): string => {
    let updatedAt = new Date().toISOString();
    if ("updatedAt" in json && typeof json.updatedAt === "string") {
        updatedAt = json.updatedAt;
    }
    return updatedAt;
};

/**
 * Extracts the rest of the properties from a JSON object, excluding specified keys.
 * @param json - The JSON object to extract properties from.
 * @param keysToExclude - An array of keys to exclude from the result.
 * @returns An object containing the remaining properties.
 */
export const getRestFromJSON = (
    json: Record<string, unknown>,
    keysToExclude: string[],
): { [key: string]: unknown } => {
    const rest: { [key: string]: unknown } = {};
    Object.keys(json).forEach(key => {
        if (!keysToExclude.includes(key)) {
            rest[key] = json[key];
        }
    });
    return rest;
};

/**
 * Extracts the position of a node from a JSON object.
 * If the JSON object has a "position" property, it uses that.
 * If not, it defaults to a position of \{ x: 20, y: 20 \} or uses the provided position.
 * @param nodeData - The JSON object containing node data.
 * @param position - An optional position to use if available.
 * @returns An object containing the x and y coordinates of the node's position.
 */
export const getNodePositionFromJSON = (
    nodeData: any,
    position?: { x: number; y: number },
): { x: number; y: number } => {
    const nodePosition = { x: 20, y: 20 };
    if (position) {
        nodePosition.x = position.x;
        nodePosition.y = position.y;
    }
    if (
        "rest" in nodeData &&
        typeof nodeData.rest === "object" &&
        nodeData.rest &&
        "position" in nodeData.rest &&
        nodeData.rest.position
    ) {
        if (
            typeof nodeData.rest.position === "object" &&
            "x" in nodeData.rest.position &&
            typeof nodeData.rest.position.x === "number" &&
            "y" in nodeData.rest.position &&
            typeof nodeData.rest.position.y === "number"
        ) {
            nodePosition.x = nodeData.rest.position.x;
            nodePosition.y = nodeData.rest.position.y;
        }
    } else if (
        "position" in nodeData &&
        typeof nodeData.position === "object" &&
        nodeData.position &&
        "x" in nodeData.position &&
        typeof nodeData.position.x === "number" &&
        "y" in nodeData.position &&
        typeof nodeData.position.y === "number"
    ) {
        nodePosition.x = nodeData.position.x;
        nodePosition.y = nodeData.position.y;
    }
    return nodePosition;
};
