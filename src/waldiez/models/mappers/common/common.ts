/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { getId } from "@waldiez/utils";

export const getIdFromJSON = (json: Record<string, unknown>): string => {
    let id = `wt-${getId()}`;
    if ("id" in json && typeof json.id === "string") {
        id = json.id;
    }
    return id;
};
export const getNameFromJSON = (json: Record<string, unknown>, fallback: string | null): string | null => {
    let name = fallback;
    if ("name" in json && typeof json.name === "string") {
        name = json.name;
    } else if ("label" in json && typeof json.label === "string") {
        name = json.label;
    }
    return name;
};
export const getDescriptionFromJSON = (json: Record<string, unknown>, fallback: string): string => {
    let description = fallback;
    if ("description" in json && typeof json.description === "string") {
        description = json.description;
    }
    return description;
};
export const getTagsFromJSON = (json: Record<string, unknown>): string[] => {
    let tags: string[] = [];
    if ("tags" in json && Array.isArray(json.tags)) {
        tags = json.tags.filter(tag => typeof tag === "string");
    }
    return tags;
};
export const getRequirementsFromJSON = (json: Record<string, unknown>): string[] => {
    let requirements: string[] = [];
    if ("requirements" in json && Array.isArray(json.requirements)) {
        requirements = json.requirements.filter(requirement => typeof requirement === "string");
    }
    return requirements;
};

export const getCreatedAtFromJSON = (json: Record<string, unknown>): string => {
    let createdAt = new Date().toISOString();
    if ("createdAt" in json && typeof json.createdAt === "string") {
        createdAt = json.createdAt;
    }
    return createdAt;
};

export const getUpdatedAtFromJSON = (json: Record<string, unknown>): string => {
    let updatedAt = new Date().toISOString();
    if ("updatedAt" in json && typeof json.updatedAt === "string") {
        updatedAt = json.updatedAt;
    }
    return updatedAt;
};

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
