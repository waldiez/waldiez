/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    getFlowViewport,
    getIsAsync,
    getStorageId,
    importFlowMeta,
} from "@waldiez/models/mappers/flow/utils/importing/meta";

describe("importFlowMeta", () => {
    it("should return the correct flow meta", () => {
        const json = {
            id: "123",
            storageId: "123",
            name: "Test Flow",
            description: "A test flow",
            tags: ["test", "flow"],
            requirements: ["test"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: {},
        };
        const flowMeta = importFlowMeta(json);
        expect(flowMeta).toEqual({
            id: "123",
            storageId: "123",
            name: "Test Flow",
            description: "A test flow",
            tags: ["test", "flow"],
            requirements: ["test"],
            createdAt: json.createdAt,
            updatedAt: json.updatedAt,
            rest: {},
        });
    });
});

describe("getStorageId", () => {
    it("should return the correct storageId", () => {
        const json = {
            id: "123",
            storageId: "123",
        };
        const id = "123";
        const storageId = getStorageId(json, id);
        expect(storageId).toBe("123");
    });
    it("should return the correct storageId when storageId is not a string", () => {
        const json = {
            id: "123",
            storageId: 123,
        };
        const id = "123";
        const storageId = getStorageId(json, id);
        expect(storageId).toBe("123");
    });
    it("should return the correct storageId when storageId is not in the json", () => {
        const json = {
            id: "123",
        };
        const id = "123";
        const storageId = getStorageId(json, id);
        expect(storageId).toBe("123");
    });
});

describe("getIsAsync", () => {
    it("should return false when isAsync is not in the json", () => {
        const json = {};
        const isAsync = getIsAsync(json);
        expect(isAsync).toBe(false);
    });
    it("should return true when isAsync is true", () => {
        const json = {
            isAsync: true,
        };
        const isAsync = getIsAsync(json);
        expect(isAsync).toBe(true);
    });
    it("should return false when isAsync is false", () => {
        const json = {
            isAsync: false,
        };
        const isAsync = getIsAsync(json);
        expect(isAsync).toBe(false);
    });
});

describe("getFlowViewport", () => {
    it("should return the correct viewport", () => {
        const json = {
            viewport: {
                zoom: 1,
                x: 0,
                y: 0,
            },
        };
        const viewport = getFlowViewport(json);
        expect(viewport).toEqual({
            zoom: 1,
            x: 0,
            y: 0,
        });
    });
    it("should return the default viewport when viewport is not in the json", () => {
        const json = {};
        const viewport = getFlowViewport(json);
        expect(viewport).toEqual({
            zoom: 1,
            x: 0,
            y: 0,
        });
    });
});
