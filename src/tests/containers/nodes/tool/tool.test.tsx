/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezNodeToolView } from "@waldiez/containers/nodes";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, flowId, storedNodes, toolData, toolId, updatedAt } from "./data";

const renderToolNode = (skipStoredNodes = false, includeSecrets = false, goToAdvancedTab = false) => {
    render(
        <WaldiezThemeProvider>
            <WaldiezProvider
                flowId={flowId}
                storageId="test-storage"
                name="flow name"
                description="flow description"
                requirements={[]}
                tags={[]}
                nodes={skipStoredNodes ? [] : storedNodes}
                edges={[]}
                createdAt={createdAt}
                updatedAt={updatedAt}
            >
                <WaldiezNodeToolView
                    id={toolId}
                    data={includeSecrets ? toolData : { ...toolData, secrets: {} }}
                    type="tool"
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
    if (goToAdvancedTab) {
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const advancedTab = screen.getByTestId(`tab-id-tool-advanced-tab-${toolId}`);
        fireEvent.click(advancedTab);
    }
};

const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

describe("WaldiezNodeTool", () => {
    beforeEach(() => {
        getItemSpy.mockClear();
        setItemSpy.mockClear();
    });
    it("should render", () => {
        renderToolNode();
        const labelElement = screen.getByTestId(`node-label-${toolId}`);
        expect(labelElement).toBeInTheDocument();
        expect(labelElement).toHaveTextContent(toolData.label);
    });
    it("should open modal", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should close modal", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const closeButton = screen.getByTestId("modal-close-btn");
        fireEvent.click(closeButton);
        expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
    it("should export tool", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const exportButton = screen.getByTestId(`export-tool-${flowId}-${toolId}`);
        fireEvent.click(exportButton);
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
    it("should delete node", () => {
        renderToolNode();
        const deleteButton = screen.getByTestId(`delete-node-${toolId}`);
        fireEvent.click(deleteButton);
    });
    it("should clone node", () => {
        renderToolNode();
        const cloneButton = screen.getByTestId(`clone-node-${toolId}`);
        fireEvent.click(cloneButton);
    });
    it("should import tool", async () => {
        renderToolNode();
        const importButton = screen.getByTestId(`file-upload-tool-${flowId}-${toolId}`);
        await userEvent.upload(importButton, [
            new File(
                [
                    JSON.stringify({
                        id: toolId,
                        type: "tool",
                        data: toolData,
                    }),
                ],
                "test.waldiezTool",
            ),
        ]);
        expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
    it("should use dark theme for editor", () => {
        getItemSpy.mockReturnValue("dark");
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toHaveClass("vs-dark");
        getItemSpy.mockReset();
    });
    it("should use light theme for editor", () => {
        getItemSpy.mockReturnValue("light");
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toHaveClass("vs-light");
        getItemSpy.mockReset();
    });
});
describe("WaldiezNodeTool basic tab", () => {
    it("should update tool label", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const labelInput = screen.getByTestId(`tool-label-input-${toolId}`);
        fireEvent.change(labelInput, { target: { value: "new label" } });
        expect(labelInput).toHaveValue("new label");
    });
    it("should update tool description", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const descriptionInput = screen.getByTestId(`tool-description-input-${toolId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        expect(descriptionInput).toHaveValue("new description");
    });
    it("should update tool content", () => {
        renderToolNode();
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        const contentInput = screen.getByTestId("mocked-monaco-editor");
        fireEvent.change(contentInput, { target: { value: "new content" } });
        expect(contentInput).toHaveValue("new content");
    });
});
describe("WaldiezNodeTool advanced tab", () => {
    it("should add secret", () => {
        renderToolNode(false, true, true);
        const secretKeyInput = screen.getByTestId("new-dict-tool-secret-key");
        const secretValueInput = screen.getByTestId("new-dict-tool-secret-value");
        fireEvent.change(secretKeyInput, { target: { value: "new key" } });
        fireEvent.change(secretValueInput, { target: { value: "new value" } });
        expect(secretKeyInput).toHaveValue("new key");
        expect(secretValueInput).toHaveValue("new value");
        const addSecretButton = screen.getByTestId("add-new-dict-tool-secret-item");
        fireEvent.click(addSecretButton);
    });
    it("should delete secret", () => {
        renderToolNode(false, true, true);
        const deleteSecretButton = screen.getByTestId("delete-dict-item-tool-secret-1");
        fireEvent.click(deleteSecretButton);
    });
    it("should update secrets", () => {
        renderToolNode(false, true, true);
        const secretKeyInput = screen.getByTestId("key-input-tool-secret-1");
        fireEvent.change(secretKeyInput, { target: { value: "new key" } });
        expect(secretKeyInput).toHaveValue("new key");
        const saveChangesButton = screen.getByTestId("save-dict-item-tool-secret-1");
        fireEvent.click(saveChangesButton); // to trigger onUpdateSecrets
    });
});

describe("WaldiezNodeTool modal actions", () => {
    it("should discard changes on cancel", async () => {
        renderToolNode(false, true);
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        // make a change
        const descriptionInput = screen.getByTestId(`tool-description-input-${toolId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        await waitFor(() => {
            expect(descriptionInput).toHaveValue("new description");
        });
        const cancelButton = screen.getByTestId(`modal-cancel-btn-${toolId}`);
        fireEvent.click(cancelButton);
        // re open modal
        fireEvent.click(openButton);
        // check if changes are discarded
        expect(descriptionInput).toHaveValue(toolData.description);
    });
    it("should save changes on submit", async () => {
        renderToolNode(false, true);
        const openButton = screen.getByTestId(`open-tool-node-modal-${toolId}`);
        fireEvent.click(openButton);
        // make a change
        const descriptionInput = screen.getByTestId(`tool-description-input-${toolId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        await waitFor(() => {
            expect(descriptionInput).toHaveValue("new description");
        });
        const submitButton = screen.getByTestId(`modal-submit-btn-${toolId}`);
        fireEvent.click(submitButton);
        // re open modal
        fireEvent.click(openButton);
        // check if changes are saved
        expect(descriptionInput).toHaveValue("new description");
    });
});
