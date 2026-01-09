/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";

import { flow, flowId } from "../../data";
import { renderFlow } from "../common";
import { loadFlow } from "./load.test";

afterEach(() => {
    vi.resetAllMocks();
});

describe("Sidebar Import flow modal preview step", () => {
    it("should display loaded flow data", async () => {
        await act(async () => {
            await renderFlow();
        });
        await loadFlow();
        const importEverythingCheckbox = screen.getByTestId(`import-flow-modal-everything-${flowId}`);
        fireEvent.click(importEverythingCheckbox);
        const flowData = flow;
        const namePreview = screen.getByTestId("import-flow-info-name-preview");
        expect(namePreview).toHaveTextContent(`Name: ${flowData.name}`);
        const descriptionPreview = screen.getByTestId("import-flow-info-description-preview");
        expect(descriptionPreview).toHaveTextContent(`Description: ${flowData.description}`);
    });
    // we probably want to test the rest of the view (selecting what to import/override)
    it("should submit the flow data", async () => {
        await act(async () => {
            await renderFlow();
        });
        await loadFlow();
        const submitButton = screen.getByTestId("wizard-next-btn");
        expect(submitButton).toBeEnabled();
        fireEvent.click(submitButton);
        expect(screen.queryByTestId(`import-flow-modal-preview-step-${flowId}-view`)).not.toBeTruthy();
    });
});
