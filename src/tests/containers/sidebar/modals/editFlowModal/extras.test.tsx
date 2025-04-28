/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, it, vi } from "vitest";

import { renderFlow } from "../common";
import { flowId } from "../data";

const openFlowModalToExtras = (positions: number[]) => {
    act(() => {
        renderFlow(positions);
    });
    fireEvent.click(screen.getByTestId(`edit-flow-${flowId}-sidebar-button`));
    const extrasTab = screen.getByTestId(`tab-id-rf-${flowId}-edit-flow-modal-extras`);
    fireEvent.click(extrasTab);
};
describe("Sidebar Edit flow modal extras tab", () => {
    afterEach(() => {
        vi.resetAllMocks();
    });
    // tags
    it("should add a new tag", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const tagInput = screen.getByTestId("new-list-entry-tag-item");
        fireEvent.change(tagInput, { target: { value: "new tag" } });
        const addTagButton = screen.getByTestId("add-list-entry-tag-button");
        fireEvent.click(addTagButton);
    });
    it("should delete a tag", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const deleteTagButton = screen.getByTestId("delete-list-entry-tag-0");
        fireEvent.click(deleteTagButton);
    });
    it("should update a tag", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const entryInput = screen.getByTestId("list-entry-item-tag-0");
        fireEvent.change(entryInput, { target: { value: "tag-update" } });
    });
    // requirements
    it("should add a new requirement", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const requirementInput = screen.getByTestId("new-list-entry-requirement-item");
        fireEvent.change(requirementInput, {
            target: { value: "new requirement" },
        });
        const addRequirementButton = screen.getByTestId("add-list-entry-requirement-button");
        fireEvent.click(addRequirementButton);
    });
    it("should delete a requirement", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const deleteRequirementButton = screen.getByTestId("delete-list-entry-requirement-0");
        fireEvent.click(deleteRequirementButton);
    });
    it("should update a requirement", () => {
        openFlowModalToExtras([-1, 0, 1, 2]);
        const entryInput = screen.getByTestId("list-entry-item-requirement-0");
        fireEvent.change(entryInput, {
            target: { value: "requirement-update" },
        });
    });
});
