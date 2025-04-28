/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToModelsTab = () => {
    // Click on the Models tab
    const modelsTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-models-${agentId}`);
    expect(modelsTab).toBeInTheDocument();
    fireEvent.click(modelsTab);
};

const modelOverrides = {
    modelIds: ["test-model1"],
};

describe("Models tab", () => {
    it("should have the agent models selected", async () => {
        renderAgent("user", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to link to agent:");
        expect(modelSelect).toBeInTheDocument();
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model1");
    });
    it("should allow changing the agent models", async () => {
        renderAgent("user", {
            openModal: true,
            dataOverrides: modelOverrides,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to link to agent:");
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
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model1");
        const removeButton = screen.getByLabelText("Remove test model1");
        fireEvent.click(removeButton);
        await selectEvent.select(modelSelect, ["test model2"]);
        fireEvent.change(modelSelect, {
            target: [{ label: "test-model2", value: "test model2" }],
        });
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("test model2");
        submitAgentChanges();
    });
    it("should allow having multiple models", async () => {
        renderAgent("user", {
            openModal: true,
            includeModels: true,
        });
        goToModelsTab();
        const modelSelect = screen.getByLabelText("Models to link to agent:");
        expect(modelSelect).toBeInTheDocument();
        selectEvent.openMenu(modelSelect);
        await selectEvent.select(modelSelect, ["test model1"]);
        await selectEvent.select(modelSelect, ["test model2"]);
        const modelsPanel = screen.getByTestId("agent-models-panel");
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelectorAll(".w-select__multi-value__label")).toHaveLength(2);
        submitAgentChanges();
    });
    it("should show a message if there are no models", async () => {
        renderAgent("user", {
            openModal: true,
        });
        goToModelsTab();
        expect(screen.getByText("No models found in the workspace")).toBeInTheDocument();
    });
});
