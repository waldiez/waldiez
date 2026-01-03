/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { onChange, renderFlow } from "../common";
import { description, flowId, name } from "../data";

describe("Sidebar Edit flow modal", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    it("should open and close the modal", async () => {
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
        const modalTestId = `edit-flow-modal-${flowId}`;
        const modalElement = screen.getByTestId(modalTestId) as HTMLDivElement;
        expect(modalElement).toBeTruthy();
        const closeButton = modalElement.querySelector(".modal-close-btn");
        expect(closeButton).toBeTruthy();
        fireEvent.click(closeButton as HTMLElement);
    });

    it("should switch to second tab", async () => {
        await act(async () => {
            await renderFlow();
        });
        const extrasPanelTestId = `edit-flow-${flowId}-modal-other-view`;
        expect(screen.queryByTestId(extrasPanelTestId)).toBeNull();
        fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
        const extrasTab = screen.getByTestId(`tab-id-rf-${flowId}-edit-flow-modal-extras`);
        fireEvent.click(extrasTab);
        expect(screen.getByTestId(extrasPanelTestId)).toBeTruthy();
    });
    it("should update flow data on submit", async () => {
        // noinspection DuplicatedCode
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
        const modalTestId = `edit-flow-modal-${flowId}`;
        expect(screen.getByTestId(modalTestId)).toBeTruthy();
        // flowName
        const flowNameInput = screen.getByTestId(`edit-flow-${flowId}-name-input`);
        expect(flowNameInput).toBeTruthy();
        fireEvent.change(flowNameInput, { target: { value: "New Flow Name" } });
        // flowDescription
        const flowDescriptionInput = screen.getByTestId(`edit-flow-${flowId}-description-input`);
        expect(flowDescriptionInput).toBeTruthy();
        fireEvent.change(flowDescriptionInput, {
            target: { value: "New Flow Description" },
        });
        // submit
        const submitBtn = screen.getByTestId("edit-flow-submit-button");
        expect(submitBtn).toBeTruthy();
        await userEvent.click(submitBtn);
        expect(onChange).toHaveBeenCalled();
    });
    it("should discard changes on cancel", async () => {
        // noinspection DuplicatedCode
        await act(async () => {
            await renderFlow();
        });
        fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
        const modalTestId = `edit-flow-modal-${flowId}`;
        expect(screen.getByTestId(modalTestId)).toBeTruthy();
        // flowName
        const flowNameInput = screen.getByTestId(`edit-flow-${flowId}-name-input`);
        expect(flowNameInput).toBeTruthy();
        fireEvent.change(flowNameInput, {
            target: { value: `${name} update` },
        });
        // flowDescription
        const flowDescriptionInput = screen.getByTestId(`edit-flow-${flowId}-description-input`);
        expect(flowDescriptionInput).toBeTruthy();
        fireEvent.change(flowDescriptionInput, {
            target: { value: `${description} update` },
        });
        // cancel
        const cancelBtn = screen.getByTestId("edit-flow-cancel-button");
        expect(cancelBtn).toBeTruthy();
        fireEvent.click(cancelBtn);
        // open modal again
        fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
        // check if changes were discarded
        const flowNameInputAfter = screen.getByTestId(`edit-flow-${flowId}-name-input`);
        expect(flowNameInputAfter).toHaveValue(name);
        const flowDescriptionInputAfter = screen.getByTestId(`edit-flow-${flowId}-description-input`);
        expect(flowDescriptionInputAfter).toHaveValue(description);
    });
});
