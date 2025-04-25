/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezModel, WaldiezModelData } from "@waldiez/models/Model";

/* eslint-disable max-statements */
describe("WaldiezModel", () => {
    it("should create an instance", () => {
        const modelData = new WaldiezModelData();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const model = new WaldiezModel({
            id: "1",
            name: "Model",
            description: "Model Description",
            tags: [],
            requirements: [],
            createdAt,
            updatedAt,
            data: modelData,
        });
        expect(model).toBeTruthy();
        expect(model.id).toBe("1");
        expect(model.name).toBe("Model");
        expect(model.description).toBe("Model Description");
        expect(model.tags).toEqual([]);
        expect(model.requirements).toEqual([]);
        expect(model.createdAt).toBe(createdAt);
        expect(model.updatedAt).toBe(updatedAt);
        expect(model.data.baseUrl).toBeNull();
        expect(model.data.apiKey).toBeNull();
        expect(model.data.apiType).toBe("openai");
        expect(model.data.apiVersion).toBeNull();
        expect(model.data.temperature).toBeNull();
        expect(model.data.topP).toBeNull();
        expect(model.data.maxTokens).toBeNull();
        expect(model.data.defaultHeaders).toEqual({});
        expect(model.data.price.promptPricePer1k).toBeNull();
        expect(model.data.price.completionTokenPricePer1k).toBeNull();
        const model2 = WaldiezModel.create();
        expect(model2).toBeTruthy();
        expect(model2.data.apiType).toBe("openai");
    });
    it("should create an instance with custom data", () => {
        const modelData = new WaldiezModelData({
            baseUrl: "http://localhost",
            apiKey: "key",
            apiType: "openai",
            apiVersion: "v1",
            temperature: 0.5,
            topP: 0.9,
            maxTokens: 100,
            defaultHeaders: { key: "value" },
            price: {
                promptPricePer1k: 1,
                completionTokenPricePer1k: 2,
            },
        });

        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const model = new WaldiezModel({
            id: "1",
            name: "custom_model",
            description: "custom_description",
            tags: ["tag"],
            requirements: ["requirement"],
            createdAt,
            updatedAt,
            data: modelData,
            rest: { key: "42" },
        });
        expect(model).toBeTruthy();
        expect(model.id).toBe("1");
        expect(model.name).toBe("custom_model");
        expect(model.description).toBe("custom_description");
        expect(model.tags).toEqual(["tag"]);
        expect(model.requirements).toEqual(["requirement"]);
        expect(model.createdAt).toBe(createdAt);
        expect(model.updatedAt).toBe(updatedAt);
        expect(model.data.baseUrl).toBe("http://localhost");
        expect(model.data.apiKey).toBe("key");
        expect(model.data.apiType).toBe("openai");
        expect(model.data.apiVersion).toBe("v1");
        expect(model.data.temperature).toBe(0.5);
        expect(model.data.topP).toBe(0.9);
        expect(model.data.maxTokens).toBe(100);
        expect(model.data.defaultHeaders).toEqual({ key: "value" });
        expect(model.data.price.promptPricePer1k).toBe(1);
        expect(model.data.price.completionTokenPricePer1k).toBe(2);
        expect(model.rest).toEqual({ key: "42" });
    });
});
