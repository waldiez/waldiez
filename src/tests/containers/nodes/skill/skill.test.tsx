/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { createdAt, flowId, skillData, skillId, storedNodes, updatedAt } from "./data";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezNodeSkillView } from "@waldiez/containers/nodes";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

const renderSkillNode = (skipStoredNodes = false, includeSecrets = false, goToAdvancedTab = false) => {
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
                <WaldiezNodeSkillView
                    id={skillId}
                    data={includeSecrets ? skillData : { ...skillData, secrets: {} }}
                    type="skill"
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
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const advancedTab = screen.getByTestId(`tab-id-skill-advanced-tab-${skillId}`);
        fireEvent.click(advancedTab);
    }
};

const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

describe("WaldiezNodeSkill", () => {
    beforeEach(() => {
        getItemSpy.mockClear();
        setItemSpy.mockClear();
    });
    it("should render", () => {
        renderSkillNode();
        const labelElement = screen.getByTestId(`node-label-${skillId}`);
        expect(labelElement).toBeInTheDocument();
        expect(labelElement).toHaveTextContent(skillData.label);
    });
    it("should open modal", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    });
    it("should close modal", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const closeButton = screen.getByTestId("modal-close-btn");
        fireEvent.click(closeButton);
        expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
    it("should export skill", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const exportButton = screen.getByTestId(`export-skill-${flowId}-${skillId}`);
        fireEvent.click(exportButton);
        expect(window.URL.createObjectURL).toHaveBeenCalled();
        expect(window.URL.revokeObjectURL).toHaveBeenCalled();
    });
    it("should delete node", () => {
        renderSkillNode();
        const deleteButton = screen.getByTestId(`delete-node-${skillId}`);
        fireEvent.click(deleteButton);
    });
    it("should clone node", () => {
        renderSkillNode();
        const cloneButton = screen.getByTestId(`clone-node-${skillId}`);
        fireEvent.click(cloneButton);
    });
    it("should import skill", async () => {
        renderSkillNode();
        const importButton = screen.getByTestId(`file-upload-skill-${flowId}-${skillId}`);
        await userEvent.upload(importButton, [
            new File(
                [
                    JSON.stringify({
                        id: skillId,
                        type: "skill",
                        data: skillData,
                    }),
                ],
                "test.waldiezSkill",
            ),
        ]);
        expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
    });
    it("should use dark theme for editor", () => {
        getItemSpy.mockReturnValue("dark");
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toHaveClass("vs-dark");
        getItemSpy.mockReset();
    });
    it("should use light theme for editor", () => {
        getItemSpy.mockReturnValue("light");
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const editor = screen.getByTestId("mocked-monaco-editor");
        expect(editor).toHaveClass("vs-light");
        getItemSpy.mockReset();
    });
});
describe("WaldiezNodeSkill basic tab", () => {
    it("should update skill label", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const labelInput = screen.getByTestId(`skill-label-input-${skillId}`);
        fireEvent.change(labelInput, { target: { value: "new label" } });
        expect(labelInput).toHaveValue("new label");
    });
    it("should update skill description", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const descriptionInput = screen.getByTestId(`skill-description-input-${skillId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        expect(descriptionInput).toHaveValue("new description");
    });
    it("should update skill content", () => {
        renderSkillNode();
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        const contentInput = screen.getByTestId("mocked-monaco-editor");
        fireEvent.change(contentInput, { target: { value: "new content" } });
        expect(contentInput).toHaveValue("new content");
    });
});
describe("WaldiezNodeSkill advanced tab", () => {
    it("should add secret", () => {
        renderSkillNode(false, true, true);
        const secretKeyInput = screen.getByTestId("new-dict-skill-secret-key");
        const secretValueInput = screen.getByTestId("new-dict-skill-secret-value");
        fireEvent.change(secretKeyInput, { target: { value: "new key" } });
        fireEvent.change(secretValueInput, { target: { value: "new value" } });
        expect(secretKeyInput).toHaveValue("new key");
        expect(secretValueInput).toHaveValue("new value");
        const addSecretButton = screen.getByTestId("add-new-dict-skill-secret-item");
        fireEvent.click(addSecretButton);
    });
    it("should delete secret", () => {
        renderSkillNode(false, true, true);
        const deleteSecretButton = screen.getByTestId("delete-dict-item-skill-secret-1");
        fireEvent.click(deleteSecretButton);
    });
    it("should update secrets", () => {
        renderSkillNode(false, true, true);
        const secretKeyInput = screen.getByTestId("key-input-skill-secret-1");
        fireEvent.change(secretKeyInput, { target: { value: "new key" } });
        expect(secretKeyInput).toHaveValue("new key");
        const saveChangesButton = screen.getByTestId("save-dict-item-skill-secret-1");
        fireEvent.click(saveChangesButton); // to trigger onUpdateSecrets
    });
});

describe("WaldiezNodeSkill modal actions", () => {
    it("should discard changes on cancel", () => {
        renderSkillNode(false, true);
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        // make a change
        const descriptionInput = screen.getByTestId(`skill-description-input-${skillId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        expect(descriptionInput).toHaveValue("new description");
        const cancelButton = screen.getByTestId(`modal-cancel-btn-${skillId}`);
        fireEvent.click(cancelButton);
        // re open modal
        fireEvent.click(openButton);
        // check if changes are discarded
        expect(descriptionInput).toHaveValue(skillData.description);
    });
    it("should save changes on submit", () => {
        renderSkillNode(false, true);
        const openButton = screen.getByTestId(`open-skill-node-modal-${skillId}`);
        fireEvent.click(openButton);
        // make a change
        const descriptionInput = screen.getByTestId(`skill-description-input-${skillId}`);
        fireEvent.change(descriptionInput, {
            target: { value: "new description" },
        });
        expect(descriptionInput).toHaveValue("new description");
        const submitButton = screen.getByTestId(`modal-submit-btn-${skillId}`);
        fireEvent.click(submitButton);
        // re open modal
        fireEvent.click(openButton);
        // check if changes are saved
        expect(descriptionInput).toHaveValue("new description");
    });
});
