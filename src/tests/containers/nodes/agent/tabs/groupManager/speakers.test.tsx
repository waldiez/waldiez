/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";
import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { DEFAULT_CUSTOM_SPEAKER_SELECTION_CONTENT } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager";

const goToGroupManagerTab = () => {
    // Click on the Group Manager tab
    const groupManagerTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}`);
    expect(groupManagerTab).toBeInTheDocument();
    fireEvent.click(groupManagerTab);
};

const goToSpeakersTab = () => {
    goToGroupManagerTab();
    const speakersTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-groupManager-${agentId}-speakers`);
    expect(speakersTab).toBeInTheDocument();
    fireEvent.click(speakersTab);
};

describe("Group Manager speakers tab", () => {
    it("should display the Group Manager speakers tab", () => {
        renderAgent("manager", { openModal: true });
        goToSpeakersTab();
    });
    it("should update the speaker repetition mode", async () => {
        renderAgent("manager", { openModal: true });
        goToSpeakersTab();
        const speakerRepetitionModeSelect = screen.getByLabelText("Speaker repetition mode:");
        selectEvent.openMenu(speakerRepetitionModeSelect);
        await selectEvent.select(speakerRepetitionModeSelect, "Not allowed");
        fireEvent.change(speakerRepetitionModeSelect, {
            target: {
                label: "Not allowed",
                value: false,
            },
        });
        expect(speakerRepetitionModeSelect).toHaveValue("false");
        submitAgentChanges();
    });
    it("should update the speaker selection method", async () => {
        renderAgent("manager", { openModal: true });
        goToSpeakersTab();
        const speakerSelectionMethodSelect = screen.getByLabelText("Speaker Selection Method:");
        selectEvent.openMenu(speakerSelectionMethodSelect);
        await selectEvent.select(speakerSelectionMethodSelect, "Custom method");
        fireEvent.change(speakerSelectionMethodSelect, {
            target: {
                label: "Custom method",
                value: "custom",
            },
        });
        expect(speakerSelectionMethodSelect).toHaveValue("custom");
        submitAgentChanges();
    });
    it("should update the allowed speakers", async () => {
        renderAgent("manager", { openModal: true, includeGroupMembers: true });
        goToSpeakersTab();
        const speakerRepetitionModeSelect = screen.getByLabelText("Speaker repetition mode:");
        selectEvent.openMenu(speakerRepetitionModeSelect);
        await selectEvent.select(speakerRepetitionModeSelect, "Specific agents");
        fireEvent.change(speakerRepetitionModeSelect, {
            target: {
                label: "Specific agents",
                value: "custom",
            },
        });
        const allowedSpeakersSelect = screen.getByLabelText("Allowed Speakers:");
        selectEvent.openMenu(allowedSpeakersSelect);
        await selectEvent.select(allowedSpeakersSelect, ["Agent 1"]);
        fireEvent.change(allowedSpeakersSelect, {
            target: [
                {
                    label: "Agent 1",
                    value: "agent-1",
                },
            ],
        });
        const modelsPanel = screen.getByTestId(`manager-speakers-tab-${agentId}`);
        expect(modelsPanel).toBeInTheDocument();
        expect(modelsPanel.querySelector(".w-select__multi-value__label")).toHaveTextContent("Agent 1");
        submitAgentChanges();
    });
    it("should update the custom speaker selection method", async () => {
        renderAgent("manager", { openModal: true });
        goToSpeakersTab();
        const speakerSelectionMethodSelect = screen.getByLabelText("Speaker Selection Method:");
        selectEvent.openMenu(speakerSelectionMethodSelect);
        await selectEvent.select(speakerSelectionMethodSelect, "Custom method");
        fireEvent.change(speakerSelectionMethodSelect, {
            target: {
                label: "Custom method",
                value: "custom",
            },
        });
        const customMethodEditor = screen.getByTestId("mocked-monaco-editor");
        expect(customMethodEditor).toBeInTheDocument();
        await userEvent.type(customMethodEditor, "    return speakers\n");
        // const editorContent = customMethodEditor.querySelector('textarea');
        expect(customMethodEditor).toHaveValue(
            DEFAULT_CUSTOM_SPEAKER_SELECTION_CONTENT + "    return speakers\n",
        );
        submitAgentChanges();
    });
});
