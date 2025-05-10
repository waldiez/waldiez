/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToGroupsTab = () => {
    // Click on the groups tab
    const groupsTab = screen.getByTestId(`tab-id-wf-${flowId}-wa-${agentId}-group`);
    expect(groupsTab).toBeInTheDocument();
    fireEvent.click(groupsTab);
};

const groupOverrides = {
    parentId: "test-group1",
};

describe("Groups tab", () => {
    it("should display the agent groups", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: groupOverrides,
            includeGroups: true,
        });
        goToGroupsTab();
        // Check if the group is displayed
        const currentGroup = screen.getByTestId(`group-label-agent-${agentId}`);
        expect(currentGroup).toBeInTheDocument();
        expect(currentGroup).toHaveTextContent("Group 1");
    });
    it("should allow the agent to leave the group", async () => {
        renderAgent("assistant", {
            openModal: true,
            dataOverrides: groupOverrides,
            includeGroups: true,
        });
        goToGroupsTab();
        // Click on the leave group button
        const leaveGroupButton = screen.getByTestId(`leave-group-button-agent-${agentId}`);
        expect(leaveGroupButton).toBeInTheDocument();
        fireEvent.click(leaveGroupButton);
        // Check if the group is removed
        const currentGroup = screen.queryByTestId(`group-label-agent-${agentId}`);
        expect(currentGroup).toBeNull();
        submitAgentChanges();
    });
    it("should allow the agent to join a group", async () => {
        renderAgent("assistant", {
            openModal: true,
            includeGroups: true,
        });
        goToGroupsTab();
        // select the group to join
        const groupSelect = screen.getByLabelText("Group");
        expect(groupSelect).toBeInTheDocument();
        selectEvent.openMenu(groupSelect);
        await selectEvent.select(groupSelect, "Group 2");
        fireEvent.change(groupSelect, {
            target: {
                label: "Group 2",
                value: "test-group2",
            },
        });
        // Click on the join group button
        const joinGroupButton = screen.getByTestId(`join-group-button-agent-${agentId}`);
        expect(joinGroupButton).toBeInTheDocument();
        fireEvent.click(joinGroupButton);
        // Check if the group is displayed
        const currentGroup = screen.getByTestId(`group-label-agent-${agentId}`);
        expect(currentGroup).toBeInTheDocument();
        expect(currentGroup).toHaveTextContent("Group 2");
        submitAgentChanges();
    });
    it("should allow changing the agent group", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: groupOverrides,
            includeGroups: true,
        });
        goToGroupsTab();
        // first leave the group
        const leaveGroupButton = screen.getByTestId(`leave-group-button-agent-${agentId}`);
        expect(leaveGroupButton).toBeInTheDocument();
        fireEvent.click(leaveGroupButton);
        // select the group to join
        const groupSelect = screen.getByLabelText("Group");
        expect(groupSelect).toBeInTheDocument();
        selectEvent.openMenu(groupSelect);
        await selectEvent.select(groupSelect, "Group 2");
        fireEvent.change(groupSelect, {
            target: {
                label: "Group 2",
                value: "test-group2",
            },
        });
        // Click on the join group button
        const joinGroupButton = screen.getByTestId(`join-group-button-agent-${agentId}`);
        expect(joinGroupButton).toBeInTheDocument();
        fireEvent.click(joinGroupButton);
        // Check if the group is displayed
        const currentGroup = screen.getByTestId(`group-label-agent-${agentId}`);
        expect(currentGroup).toBeInTheDocument();
        expect(currentGroup).toHaveTextContent("Group 2");
        // let's also submit the changes to cover the store updates
        submitAgentChanges();
    });
});
