/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../../common";
import { agentId, flowId } from "../../data";

const agentDataOverrides = {
    speakers: {
        transitionsType: "disallowed",
        allowedOrDisallowedTransitions: {
            "agent-1": ["agent-2", "agent-3"],
            "agent-2": ["agent-1"],
        },
    },
};

const agentDataOverridesWithTransitionMode = {
    speakers: {
        selectionMode: "transition",
        allowedOrDisallowedTransitions: {
            "agent-1": ["agent-2", "agent-3"],
            "agent-2": ["agent-1"],
        },
    },
};

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

const selectTransitionsSpeakerRepetition = async (transitionMode: boolean = true) => {
    renderAgent("manager", {
        openModal: true,
        dataOverrides: transitionMode ? agentDataOverridesWithTransitionMode : agentDataOverrides,
        includeGroupMembers: true,
    });
    goToSpeakersTab();
    if (!transitionMode) {
        const speakerRepetitionModeSelect = screen.getByLabelText("Speaker repetition mode:");
        selectEvent.openMenu(speakerRepetitionModeSelect);
        await selectEvent.select(speakerRepetitionModeSelect, "Use transition rules");
        fireEvent.change(speakerRepetitionModeSelect, {
            target: {
                label: "Use transition rules",
                value: "disabled",
            },
        });
        expect(speakerRepetitionModeSelect).toHaveValue("disabled");
    }
};

describe("Group Manager speakers tab, speakers transition", () => {
    it("should update the speaker repetition mode", async () => {
        await selectTransitionsSpeakerRepetition(false);
        submitAgentChanges();
    });
    it("should add a transition", async () => {
        await selectTransitionsSpeakerRepetition();
        const fromSelect = screen.getByLabelText("From:");
        selectEvent.openMenu(fromSelect);
        await selectEvent.select(fromSelect, "Agent 3");
        const toSelect = screen.getByLabelText("To:");
        selectEvent.openMenu(toSelect);
        await selectEvent.select(toSelect, "Agent 4");
        await selectEvent.select(toSelect, "Agent 2");
        const addButton = screen.getByText("Add");
        fireEvent.change(fromSelect, {
            target: {
                label: "Agent 3",
                value: "agent-3",
            },
        });
        fireEvent.change(toSelect, {
            target: [
                {
                    label: "Agent 4",
                    value: "agent-4",
                },
                {
                    label: "Agent 2",
                    value: "agent-2",
                },
            ],
        });
        fireEvent.click(addButton);
        submitAgentChanges();
    });
    it("should remove a transition", async () => {
        await selectTransitionsSpeakerRepetition();
        const removeButton = screen.getByTestId(`manager-speakers-remove-transition-${agentId}-0`);
        fireEvent.click(removeButton);
        submitAgentChanges();
    });
    it("should update the transitions mode", async () => {
        await selectTransitionsSpeakerRepetition();
        const transitionsTypeSelect = screen.getByLabelText("Transitions mode:");
        selectEvent.openMenu(transitionsTypeSelect);
        await selectEvent.select(transitionsTypeSelect, "Allowed");
        fireEvent.change(transitionsTypeSelect, {
            target: {
                label: "Allowed",
                value: "allowed",
            },
        });
        expect(transitionsTypeSelect).toHaveValue("allowed");
        submitAgentChanges();
    });
});
