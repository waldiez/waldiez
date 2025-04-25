/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { createdAt, flowId, modelData, modelId, updatedAt } from "./data";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { WaldiezNodeModelView } from "@waldiez/containers/nodes";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

const renderModel = (overrides: Partial<typeof modelData> = {}) => {
    const modelDataToUse = { ...modelData, ...overrides };
    const storedModels = [
        {
            id: modelId,
            type: "model",
            data: modelDataToUse,
            position: { x: 0, y: 0 },
        },
    ];
    render(
        <WaldiezThemeProvider>
            <WaldiezProvider
                flowId={flowId}
                storageId="test-storage"
                name="flow name"
                description="flow description"
                requirements={[]}
                tags={[]}
                nodes={storedModels}
                edges={[]}
                createdAt={createdAt}
                updatedAt={updatedAt}
            >
                <WaldiezNodeModelView
                    id={modelId}
                    data={{ ...modelDataToUse, label: modelDataToUse.name }}
                    type="model"
                    dragging={false}
                    zIndex={1}
                    isConnectable={true}
                    positionAbsoluteX={0}
                    positionAbsoluteY={0}
                    deletable
                    selectable
                    draggable
                    selected={false}
                />
            </WaldiezProvider>
        </WaldiezThemeProvider>,
    );
};

const renderAdvancedTab = (overrides: Partial<typeof modelData> = {}) => {
    renderModel(overrides);
    const openModalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
    fireEvent.click(openModalButton);
    const advancedTabButton = screen.getByTestId(`tab-id-model-config-advanced-${modelId}`);
    fireEvent.click(advancedTabButton);
    const advancedTab = screen.getByTestId(`panel-model-config-advanced-${modelId}`);
    expect(advancedTab).toBeInTheDocument();
};

describe("WaldiezNodeModel Modal Advanced Tab", () => {
    it("it should display the advanced tab", () => {
        renderAdvancedTab();
    });
    it("should update the temperature", () => {
        renderAdvancedTab({
            temperature: 0.1,
        });
        const temperatureInput = screen.getByTestId("model-modal-temperature");
        fireEvent.change(temperatureInput, { target: { value: "0.5" } });
        expect(temperatureInput).toHaveValue(0.5);
    });
    it("should update the top P", () => {
        renderAdvancedTab({
            topP: 0.2,
        });
        const topPInput = screen.getByTestId("model-modal-top-p");
        fireEvent.change(topPInput, { target: { value: "0.5" } });
        expect(topPInput).toHaveValue(0.5);
    });
    it("should update the max tokens", () => {
        renderAdvancedTab({
            maxTokens: 200,
        });
        const maxTokensInput = screen.getByTestId("model-modal-max-tokens");
        fireEvent.change(maxTokensInput, { target: { value: "500" } });
        expect(maxTokensInput).toHaveValue(500);
    });
    it("should add a tag", () => {
        renderAdvancedTab({
            tags: ["test-tag1"],
        });
        const tagInput = screen.getByTestId("new-list-entry-tag-item");
        fireEvent.change(tagInput, { target: { value: "test-tag2" } });
        const addTagButton = screen.getByTestId("add-list-entry-tag-button");
        fireEvent.click(addTagButton);
        const tagElement = screen.getByTestId("list-entry-item-tag-1");
        expect(tagElement).toHaveValue("test-tag2");
    });
    it("should update a tag", () => {
        renderAdvancedTab({
            tags: ["test-tag1"],
        });
        const tagInput = screen.getByTestId("list-entry-item-tag-0");
        fireEvent.change(tagInput, { target: { value: "test-tag2" } });
        expect(tagInput).toHaveValue("test-tag2");
    });
    it("should delete a tag", () => {
        renderAdvancedTab({
            tags: ["test-tag1"],
        });
        const deleteTagButton = screen.getByTestId("delete-list-entry-tag-0");
        fireEvent.click(deleteTagButton);
        const tagElement = screen.queryByTestId("list-entry-item-tag-0");
        expect(tagElement).not.toBeInTheDocument();
    });
    it("should add a header", () => {
        renderAdvancedTab({
            defaultHeaders: { "test-header1": "test-value1" },
        });
        const headerKeyInput = screen.getByTestId("new-dict-model-header-key");
        fireEvent.change(headerKeyInput, { target: { value: "test-header2" } });
        const headerValueInput = screen.getByTestId("new-dict-model-header-value");
        fireEvent.change(headerValueInput, {
            target: { value: "test-value2" },
        });
        const addHeaderButton = screen.getByTestId("add-new-dict-model-header-item");
        fireEvent.click(addHeaderButton);
        const headerKeyElement = screen.getByTestId("key-input-model-header-1");
        const headerValueElement = screen.getByTestId("value-input-model-header-1");
        expect(headerKeyElement).toHaveValue("test-header2");
        expect(headerValueElement).toHaveValue("test-value2");
    });
    it("should update headers", () => {
        renderAdvancedTab({
            defaultHeaders: { "test-header1": "test-value1" },
        });
        const headerKeyInput = screen.getByTestId("key-input-model-header-0");
        fireEvent.change(headerKeyInput, { target: { value: "test-header2" } });
        const headerValueInput = screen.getByTestId("value-input-model-header-0");
        fireEvent.change(headerValueInput, {
            target: { value: "test-value2" },
        });
        expect(headerKeyInput).toHaveValue("test-header2");
        expect(headerValueInput).toHaveValue("test-value2");
        const saveHeaderButton = screen.getByTestId("save-dict-item-model-header-0");
        fireEvent.click(saveHeaderButton);
    });
    it("should delete a header", () => {
        renderAdvancedTab({
            defaultHeaders: { "test-header1": "test-value1" },
        });
        const deleteHeaderButton = screen.getByTestId("delete-dict-item-model-header-0");
        fireEvent.click(deleteHeaderButton);
        const headerElement = screen.queryByTestId("dict-entry-model-header-0");
        expect(headerElement).not.toBeInTheDocument();
    });
});
