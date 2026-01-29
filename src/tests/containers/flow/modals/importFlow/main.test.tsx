/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";

import { renderFlow } from "../common";

// import userEvent from '@testing-library/user-event';

const flowId = "wf-0";

afterEach(() => {
    vi.resetAllMocks();
});

describe("Sidebar Import flow modal", () => {
    // noinspection DuplicatedCode
    it("should open and close the modal", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
        const modalTestId = `import-flow-modal-${flowId}`;
        const modalElement = screen.getByTestId(modalTestId) as HTMLDivElement;
        expect(modalElement).toBeTruthy();
        const closeButton = modalElement.querySelector(".modal-close-btn");
        expect(closeButton).toBeTruthy();
        fireEvent.click(closeButton as HTMLElement);
    });
    it("should not display the preview step if the flow data is not loaded", async () => {
        await act(async () => {
            await renderFlow(undefined, undefined, undefined, { skipRun: true });
        });
        fireEvent.click(screen.getByTestId(`import-flow-${flowId}-button`));
        const modalTestId = `import-flow-modal-${flowId}`;
        const modalElement = screen.getByTestId(modalTestId) as HTMLDivElement;
        expect(modalElement).toBeTruthy();
        const previewStep = screen.queryByTestId(`import-flow-modal-preview-step-${flowId}`);
        expect(previewStep).toBeFalsy();
        const nextButton = screen.getByTestId("wizard-next-btn");
        expect(nextButton).toBeDisabled();
    });
});
