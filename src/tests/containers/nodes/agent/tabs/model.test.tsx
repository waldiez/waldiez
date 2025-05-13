/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
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
        // the ones below give:
        // Warning: The current testing environment is not configured to support act(...)
        //
        // - await waitFor(async () => {
        //     await selectEvent.clearAll(modelSelect);
        // });
        // - await selectEvent.clearAll(modelSelect);
        // :(
        // let's find the button that removes the current model instead
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
        expect(modelsPanel.querySelector(".w-select__single-value")).toHaveTextContent("test model2");
        submitAgentChanges();
    });
});
