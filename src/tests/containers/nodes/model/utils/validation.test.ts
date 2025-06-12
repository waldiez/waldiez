/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it, vi } from "vitest";

import { ValidationMessage, validateModel } from "@waldiez/containers/nodes/model/utils";
import { WaldiezNodeModelData } from "@waldiez/models";

describe("validateModel", () => {
    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const baseModel: WaldiezNodeModelData = {
        baseUrl: "https://api.example.com",
        apiKey: "test-api-key",
        label: "test-model",
        apiType: "other",
        description: "Test model",
        apiVersion: "v1",
        extras: {},
        defaultHeaders: {},
        temperature: 0.7,
        topP: 1,
        maxTokens: 100,
        requirements: [],
        tags: [],
        price: {
            promptPricePer1k: 0.01,
            completionTokenPricePer1k: 0.01,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("should return an error if baseUrl is missing", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "other";
        const model = { ...baseModel, apiType, baseUrl: "" };
        const result = await validateModel(model);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.MissingBaseUrl,
        });
    });

    it("should return an error if apiKey is missing", async () => {
        const model = { ...baseModel, apiKey: "" };
        const result = await validateModel(model);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.MissingApiKey,
        });
    });

    it("should return an error if label is missing", async () => {
        const model = { ...baseModel, label: " " };
        const result = await validateModel(model);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.MissingModelName,
        });
    });

    it("should return an error if Azure API version is missing for Azure API type", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "azure";
        const model = { ...baseModel, apiType, apiVersion: null };
        const result = await validateModel(model);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.MissingApiVersion,
        });
    });

    it("should validate a model using direct lookup", async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: "test-model" }] }), {
                status: 200,
            }),
        );
        const result = await validateModel(baseModel);
        expect(result).toEqual({
            success: true,
            message: ValidationMessage.ValidationSuccess,
        });
        expect(mockFetch).toHaveBeenCalledWith(
            "https://api.example.com/v1/models/test-model",
            expect.objectContaining({
                headers: { Authorization: "Bearer test-api-key" },
            }),
        );
    });

    it("should return an error if direct lookup fails", async () => {
        mockFetch.mockResolvedValueOnce(new Response(null, { status: 404 }));
        const result = await validateModel(baseModel);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.ModelNotFound,
            details: ValidationMessage.UnknownError,
        });
    });

    it("should validate a model using Azure-specific logic", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "azure";
        const azureModel = { ...baseModel, apiType, apiVersion: "2023-01-01" };
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: "test-model" }] }), {
                status: 200,
            }),
        );
        const result = await validateModel(azureModel);
        expect(result).toEqual({
            success: true,
            message: ValidationMessage.ValidationSuccess,
        });
        expect(mockFetch).toHaveBeenCalledWith(
            "https://api.example.com/openai/deployments?api-version=2023-01-01",
            expect.objectContaining({
                headers: { "api-key": "test-api-key" },
            }),
        );
    });

    it("should return an error if Azure model is not found", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "azure";
        const azureModel = { ...baseModel, apiType, apiVersion: "2023-01-01" };
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
        const result = await validateModel(azureModel);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.ModelNotFound,
        });
    });

    it("should validate a model using fallback logic", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "together"; // not supporting direct lookup?
        const fallbackModel = { ...baseModel, apiType };
        mockFetch.mockResolvedValueOnce(
            new Response(JSON.stringify({ data: [{ id: "test-model" }] }), {
                status: 200,
            }),
        );
        const result = await validateModel(fallbackModel);
        expect(result).toEqual({
            success: true,
            message: ValidationMessage.ValidationSuccess,
        });
        expect(mockFetch).toHaveBeenCalledWith(
            "https://api.example.com/models",
            expect.objectContaining({
                headers: { Authorization: "Bearer test-api-key" },
            }),
        );
    });

    it("should return an error if fallback model is not found", async () => {
        const apiType: WaldiezNodeModelData["apiType"] = "together";
        const fallbackModel = { ...baseModel, apiType };
        mockFetch.mockResolvedValueOnce(new Response(JSON.stringify({ data: [] }), { status: 200 }));
        const result = await validateModel(fallbackModel);
        expect(result).toEqual({
            success: false,
            message: ValidationMessage.ModelNotFound,
        });
    });

    it("should return an error if API request fails", async () => {
        mockFetch.mockResolvedValueOnce(
            new Response(null, {
                status: 500,
                statusText: "Internal Server Error",
            }),
        );
        const result = await validateModel(baseModel);
        expect(result).toEqual({
            success: false,
            message: "API error",
            details: "Internal Server Error",
        });
    });
});
