/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToModelTab = () => {
    // Click on the Models tab
    const modelsTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-model`);
    expect(modelsTab).toBeInTheDocument();
    fireEvent.click(modelsTab);
};

const modelOverrides = {
    modelId: "test-model1",
};

describe("Models tab", () => {
    it("should have the agent's model selected", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelTab();
        const modelSelect = screen.getByLabelText("Model to use:");
        expect(modelSelect).toBeInTheDocument();
        const modelsPanel = screen.getByTestId("agent-model-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__single-value")).toHaveTextContent("test model1");
    });
    it("should allow changing the agent model", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelTab();
        const modelSelect = screen.getByLabelText("Model to use:");
        expect(modelSelect).toBeInTheDocument();
        selectEvent.openMenu(modelSelect);
        const modelsPanel = screen.getByTestId("agent-model-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__single-value")).toHaveTextContent("test model1");
        const clearButton = modelsPanel.querySelector(".w-select__clear-indicator");
        expect(clearButton).toBeInTheDocument();
        fireEvent.click(clearButton!);
        await selectEvent.select(modelSelect, "test model2");
        fireEvent.change(modelSelect, {
            target: [{ label: "test-model2", value: "test model2" }],
        });
        await waitFor(() => {
            expect(modelsPanel.querySelector(".w-select__single-value")).toHaveTextContent("test model2");
        });
        submitAgentChanges();
    });
});
