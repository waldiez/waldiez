/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { WaldiezNodeModelView } from "@waldiez/containers/nodes";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, flowId, modelData, modelId, updatedAt } from "./data";

const renderModel = (overrides: { [key: string]: any } = {}, openModal: boolean = false) => {
    const modelDataToUse = { ...modelData, ...overrides };
    const storedModel = {
        id: modelId,
        type: "model",
        data: modelDataToUse,
        position: { x: 0, y: 0 },
    };
    render(
        <WaldiezThemeProvider>
            <WaldiezProvider
                flowId={flowId}
                storageId="test-storage"
                name="flow name"
                description="flow description"
                requirements={[]}
                tags={[]}
                nodes={[storedModel]}
                edges={[]}
                createdAt={createdAt}
                updatedAt={updatedAt}
            >
                <WaldiezNodeModelView
                    id={modelId}
                    data={{ ...modelDataToUse, label: modelData.name }}
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
    if (openModal) {
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
    }
};

describe("WaldiezModelNode", () => {
    it("should render", () => {
        renderModel();
        const labelElement = screen.getByTestId(`node-label-${modelId}`);
        expect(labelElement).toBeInTheDocument();
        expect(labelElement).toHaveTextContent(modelData.name);
    });
    it("should display the model's modal", () => {
        renderModel();
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        // expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("it switch model's modal tabs", () => {
        renderModel({}, true);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const basicTabButton = screen.getByTestId(`tab-id-model-config-basic-${modelId}`);
        fireEvent.click(basicTabButton);
        expect(basicTabButton).toHaveClass("tab-btn--active");
        const advancedTabButton = screen.getByTestId(`tab-id-model-config-advanced-${modelId}`);
        fireEvent.click(advancedTabButton);
        expect(advancedTabButton).toHaveClass("tab-btn--active");
        const priceTabButton = screen.getByTestId(`tab-id-model-config-price-${modelId}`);
        fireEvent.click(priceTabButton);
        expect(priceTabButton).toHaveClass("tab-btn--active");
    });
    it("should close the model modal", () => {
        renderModel({}, true);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const closeButton = screen.getByTestId("modal-close-btn");
        fireEvent.click(closeButton);
        // expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
    it("should clone the model", () => {
        renderModel();
        const cloneButton = screen.getByTestId(`clone-node-${modelId}`);
        fireEvent.click(cloneButton);
    });
    it("should delete the model", () => {
        renderModel();
        const deleteButton = screen.getByTestId(`delete-node-${modelId}`);
        fireEvent.click(deleteButton);
    });
    it("should export the model", () => {
        renderModel(undefined, true);
        const exportButton = screen.getByTestId(`export-model-${flowId}-${modelId}`);
        fireEvent.click(exportButton);
        expect(window.URL.createObjectURL).toHaveBeenCalled();
    });
    it("should import a model", async () => {
        renderModel(undefined, true);
        const importInput = screen.getByTestId(`file-upload-model-${flowId}-${modelId}`);
        await userEvent.upload(importInput, [
            new File(
                [
                    JSON.stringify({
                        id: modelId,
                        type: "model",
                        data: modelData,
                    }),
                ],
                "test.waldiezModel",
            ),
        ]);
    });
});
describe("WaldiezModelNode with branches", () => {
    // handle null values/branches in advanced and price tabs
    it("should handle null temperature", () => {
        renderModel({ temperature: null });
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const advancedTabButton = screen.getByTestId(`tab-id-model-config-advanced-${modelId}`);
        fireEvent.click(advancedTabButton);
        expect(advancedTabButton).toHaveClass("tab-btn--active");
    });
    it("should handle null topP", () => {
        renderModel({ topP: null });
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        expect(modalElement).toBeInTheDocument();
        const advancedTabButton = screen.getByTestId(`tab-id-model-config-advanced-${modelId}`);
        fireEvent.click(advancedTabButton);
        expect(advancedTabButton).toHaveClass("tab-btn--active");
    });
    it("should handle null maxTokens", () => {
        renderModel({ maxTokens: null });
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const advancedTabButton = screen.getByTestId(`tab-id-model-config-advanced-${modelId}`);
        fireEvent.click(advancedTabButton);
        expect(advancedTabButton).toHaveClass("tab-btn--active");
    });
    it("should handle null promptPricePer1k", () => {
        renderModel({
            price: { promptPricePer1k: null, completionTokenPricePer1k: 0.1 },
        });
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const priceTabButton = screen.getByTestId(`tab-id-model-config-price-${modelId}`);
        fireEvent.click(priceTabButton);
        expect(priceTabButton).toHaveClass("tab-btn--active");
    });
    it("should handle null completionTokenPricePer1k", () => {
        renderModel({
            price: { promptPricePer1k: 0.05, completionTokenPricePer1k: null },
        });
        const modalButton = screen.getByTestId(`open-model-node-modal-${modelId}`);
        fireEvent.click(modalButton);
        const modalElement = screen.getByTestId(`model-modal-${modelId}`);
        expect(modalElement).toBeInTheDocument();
        const priceTabButton = screen.getByTestId(`tab-id-model-config-price-${modelId}`);
        fireEvent.click(priceTabButton);
        expect(priceTabButton).toHaveClass("tab-btn--active");
    });
});
