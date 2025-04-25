/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezModelData } from "@waldiez/models";
import { getModels } from "@waldiez/models/mappers/flow/utils";

describe("getModels", () => {
    it("should return the correct models", () => {
        const json = {
            models: [
                {
                    id: "123",
                    type: "model",
                    name: "Test Model",
                    description: "A test model",
                    tags: ["test", "model"],
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
                type: "model",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
            {
                id: "456",
                type: "model",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
        ];
        const models = getModels(json, nodes);
        expect(models).toEqual([
            {
                id: "123",
                type: "model",
                name: "Test Model",
                description: "A test model",
                tags: ["test", "model"],
                requirements: ["test"],
                createdAt: json.models[0].createdAt,
                updatedAt: json.models[0].updatedAt,
                data: new WaldiezModelData(),
                rest: { position: { x: 0, y: 0 } },
            },
        ]);
    });
    it("should not return models if models is not an array", () => {
        const json = {
            models: {},
        };
        const nodes: any[] = [];
        const models = getModels(json, nodes);
        expect(models).toEqual([]);
    });
    it("should not return models is not in the json", () => {
        const json = {};
        const nodes: any[] = [];
        const models = getModels(json, nodes);
        expect(models).toEqual([]);
    });
});
