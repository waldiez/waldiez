/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezModel, WaldiezModelData, WaldiezNodeModel } from "@waldiez/models";
import { modelMapper } from "@waldiez/models/mappers";

describe("modelMapper", () => {
    it("should import a model", () => {
        const modelJson = {
            type: "model",
            id: "1",
            name: "custom_model",
            description: "custom_description",
            tags: ["tag2"],
            requirements: ["requirement1"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: {
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
            },
        };
        const model = modelMapper.importModel(modelJson);
        expect(model).toBeTruthy();
        expect(model.id).toBe("1");
        expect(model.name).toBe("custom_model");
        expect(model.description).toBe("custom_description");
        expect(model.tags).toEqual(["tag2"]);
        expect(model.requirements).toEqual(["requirement1"]);
        expect(model.createdAt).toBe(modelJson.createdAt);
        expect(model.updatedAt).toBe(modelJson.updatedAt);
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
    });
    it("should import a model with invalid json", () => {
        const model = modelMapper.importModel(5);
        expect(model).toBeTruthy();
        expect(model.id).toBeTruthy();
        expect(model.name).toBe("Model");
        expect(model.description).toBe("A new model");
        expect(model.data.baseUrl).toBeNull();
        expect(model.data.apiKey).toBeNull();
    });
    it("should import a model with no data in json", () => {
        const model = modelMapper.importModel({
            type: "model",
            id: "1",
            description: "A new model",
        });
        expect(model).toBeTruthy();
        expect(model.id).toBe("1");
        expect(model.name).toBe("Model");
        expect(model.description).toBe("A new model");
        expect(model.data.baseUrl).toBeNull();
        expect(model.data.apiKey).toBeNull();
    });
    it("should export a model node", () => {
        const modelData = new WaldiezModelData();
        modelData.apiKey = "not secret";
        const modelNode = {
            id: "1",
            data: { ...modelData, label: "Model" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeModel;
        const modelJson = modelMapper.exportModel(modelNode, false);
        expect(modelJson).toBeTruthy();
        expect(modelJson.id).toBe("1");
        expect(modelJson.type).toBe("model");
        expect(modelJson.name).toBe(modelNode.data.label);
        expect(modelJson.description).toBe(modelNode.data.description);
        expect(modelJson.tags).toEqual(modelNode.data.tags);
        expect(modelJson.requirements).toEqual(modelNode.data.requirements);
        expect(modelJson.createdAt).toBe(modelNode.data.createdAt);
        expect(modelJson.updatedAt).toBe(modelNode.data.updatedAt);
        expect((modelJson.data as any).apiKey).toBe("not secret");
    });
    it("should export a model node with secrets replaced", () => {
        const modelData = new WaldiezModelData();
        modelData.apiKey = "key";
        modelData.defaultHeaders = { key: "value" };
        const modelNode = {
            id: "1",
            data: { ...modelData, label: "Model" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeModel;
        const modelJson = modelMapper.exportModel(modelNode, true);
        expect(modelJson).toBeTruthy();
        expect(modelJson.id).toBe("1");
        expect(modelJson.type).toBe("model");
        expect(modelJson.name).toBe(modelNode.data.label);
        expect((modelJson.data as any).apiKey).toBe("REPLACE_ME");
        expect((modelJson.data as any).defaultHeaders).toEqual({
            key: "REPLACE_ME",
        });
    });
    it("should export a bedrock model node with aws keys replaced", () => {
        const modelData = new WaldiezModelData();
        modelData.apiType = "bedrock";
        modelData.aws!.accessKey = "aws_access_key";
        modelData.aws!.secretKey = "aws_secret_key";
        modelData.aws!.sessionToken = "aws_session_token";
        const model = {
            id: "1",
            type: "model",
            name: "model_name",
            description: "model_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: { ...modelData, label: "Model" },
            position: { x: 0, y: 0 },
        } as WaldiezModel;
        const modelNode = modelMapper.asNode(model);
        const modelJson = modelMapper.exportModel(modelNode, true);
        expect(modelJson).toBeTruthy();
        expect(modelJson.id).toBe("1");
        expect(modelJson.type).toBe("model");
        expect(modelJson.name).toBe(modelNode.data.label);
        expect((modelJson.data as any).aws.accessKey).toBe("REPLACE_ME");
        expect((modelJson.data as any).aws.secretKey).toBe("REPLACE_ME");
        expect((modelJson.data as any).aws.sessionToken).toBe("REPLACE_ME");
        expect((modelJson.data as any).aws.profileName).toBe("REPLACE_ME");
        expect((modelJson.data as any).aws.region).toBe("REPLACE_ME");
    });
    it("should convert a model to a model node with position", () => {
        const modelData = new WaldiezModelData();
        const model = new WaldiezModel({
            id: "1",
            name: "model_name",
            description: "model_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: modelData,
            rest: { position: { x: 4 } },
        });
        const modelNode = modelMapper.asNode(model, { x: 20, y: 20 });
        expect(modelNode).toBeTruthy();
        expect(modelNode.id).toBe("1");
        expect(modelNode.data.label).toBe("model_name");
        expect(modelNode.position).toEqual({ x: 20, y: 20 });
    });
    it("should import, convert and export a model", () => {
        const modelJson = {
            type: "model",
            id: "1",
            name: "custom_model",
            description: "custom_description",
            tags: ["tag2"],
            requirements: ["requirement1"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: {
                baseUrl: "http://localhost",
                apiKey: "key",
                apiType: "openai",
                apiVersion: "v1",
                temperature: 0.5,
                topP: 0.9,
                maxTokens: 100,
                aws: {
                    accessKey: null,
                    profileName: null,
                    region: null,
                    secretKey: null,
                    sessionToken: null,
                },
                extras: {},
                defaultHeaders: { key: "value" },
                price: {
                    promptPricePer1k: 1,
                    completionTokenPricePer1k: 2,
                },
            },
            position: { x: 10, y: 11 },
        };
        const model = modelMapper.importModel(modelJson);
        const modelNode = modelMapper.asNode(model);
        expect(modelNode.position).toEqual({ x: 10, y: 11 });
        expect(modelNode.data.label).toBe("custom_model");
        const exported = modelMapper.exportModel(modelNode, false);
        expect(exported).toEqual(modelJson);
    });
});
