/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getIdFromJSON,
    getNameFromJSON,
    getRequirementsFromJSON,
    getRestFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";

export const importFlowMeta = (json: Record<string, unknown>) => {
    const id = getIdFromJSON(json);
    const name = getNameFromJSON(json, "Waldiez Flow")!;
    const description = getDescriptionFromJSON(json, "A waldiez flow");
    const tags = getTagsFromJSON(json);
    const requirements = getRequirementsFromJSON(json);
    const createdAt = getCreatedAtFromJSON(json);
    const updatedAt = getUpdatedAtFromJSON(json);
    const rest = getRestFromJSON(json, [
        "id",
        "storageId",
        "name",
        "description",
        "tags",
        "requirements",
        "createdAt",
        "updatedAt",
        "data",
    ]);
    const storageId = getStorageId(json, id);
    return {
        id,
        storageId,
        name,
        description,
        tags,
        requirements,
        createdAt,
        updatedAt,
        rest,
    };
};
export const getFlowViewport = (data: { [key: string]: unknown }) => {
    let viewport = { zoom: 1, x: 0, y: 0 };
    if (
        "viewport" in data &&
        typeof data.viewport === "object" &&
        data.viewport &&
        "zoom" in data.viewport &&
        "x" in data.viewport &&
        "y" in data.viewport &&
        typeof data.viewport.zoom === "number" &&
        typeof data.viewport.x === "number" &&
        typeof data.viewport.y === "number"
    ) {
        viewport = data.viewport as {
            zoom: number;
            x: number;
            y: number;
        };
    }
    return viewport;
};

export const getStorageId = (json: Record<string, unknown>, id: string) => {
    let storageId = id;
    if ("storageId" in json && typeof json.storageId === "string") {
        storageId = json.storageId;
    }
    return storageId;
};

export const getIsAsync = (json: Record<string, unknown>) => {
    let isAsync = false;
    if ("isAsync" in json && typeof json.isAsync === "boolean") {
        isAsync = json.isAsync;
    }
    return isAsync;
};

export const getCacheSeed = (json: Record<string, unknown>) => {
    let cacheSeed: number | null = null;
    if ("cacheSeed" in json) {
        if (typeof json.cacheSeed === "number") {
            cacheSeed = parseInt(`${json.cacheSeed}`, 10);
        } else if (json.cacheSeed === null) {
            cacheSeed = null;
        } else if (typeof json.cacheSeed === "string") {
            try {
                const parsed = parseInt(json.cacheSeed, 10);
                if (!isNaN(parsed)) {
                    cacheSeed = parsed;
                }
            } catch (_) {
                // ignore
            }
        }
    }
    return cacheSeed;
};
