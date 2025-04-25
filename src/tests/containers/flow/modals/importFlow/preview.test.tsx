/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { flow, flowId } from "../../../flow/data";
import { renderFlow } from "../common";
import { loadFlow } from "./load.test";
import { act, fireEvent, screen } from "@testing-library/react";

afterEach(() => {
    vi.resetAllMocks();
});

describe("Sidebar Import flow modal preview step", () => {
    it("should display loaded flow data", async () => {
        act(() => {
            renderFlow();
        });
        await loadFlow();
        const importEverythingCheckbox = screen.getByTestId("import-everything-checkbox");
        fireEvent.click(importEverythingCheckbox);
        const flowData = flow;
        const namePreview = screen.getByTestId("import-flow-info-name-preview");
        expect(namePreview).toHaveTextContent(`Name: ${flowData.name}`);
        const descriptionPreview = screen.getByTestId("import-flow-info-description-preview");
        expect(descriptionPreview).toHaveTextContent(`Description: ${flowData.description}`);
    });
    // we probably want to test the rest of the view (selecting what to import/override)
    it("should submit the flow data", async () => {
        act(() => {
            renderFlow();
        });
        await loadFlow();
        const submitButton = screen.getByTestId("wizard-next-btn");
        expect(submitButton).toBeEnabled();
        fireEvent.click(submitButton);
        expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).not.toBeTruthy();
    });
});
