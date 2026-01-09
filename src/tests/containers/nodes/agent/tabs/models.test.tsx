/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToModelsTab = () => {
    // Click on the Models tab
    const modelsTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-models`);
    expect(modelsTab).toBeInTheDocument();
    fireEvent.click(modelsTab);
};

const modelOverrides = {
    modelIds: ["test-model1"],
};

describe("Models tab", () => {
    it("should have the agent models selected", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to use:");
        expect(modelSelect).toBeInTheDocument();
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model 1");
    });
    it("should allow changing the agent models", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to use:");
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model 1");
        const clearButton = modelsPanel.querySelector(".w-select__clear-indicator");
        expect(clearButton).toBeInTheDocument();
        fireEvent.click(clearButton!);
        await selectEvent.clearAll(modelSelect);
        selectEvent.openMenu(modelSelect);
        await selectEvent.select(modelSelect, "test model 2");
        await waitFor(() => {
            expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent(
                "test model 2",
            );
        });
        submitAgentChanges();
    });
    it("should allow having two models selected", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to use:");
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model 1");
        selectEvent.openMenu(modelSelect);
        await selectEvent.select(modelSelect, "test model 2");
        await waitFor(() => {
            expect(modelsPanel.querySelectorAll(".w-select__multi-value__label")).toHaveLength(2);
            expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent(
                "test model 1",
            );
            expect(modelsPanel.querySelectorAll(".w-select__multi-value__label")[1]).toHaveTextContent(
                "test model 2",
            );
        });
    });
});
