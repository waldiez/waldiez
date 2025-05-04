/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import selectEvent from "react-select-event";

import { renderAgent, submitAgentChanges } from "../common";
import { agentId, flowId } from "../data";

const goToSkillsTab = () => {
    // Click on the Skills tab
    const skillsTab = screen.getByTestId(`tab-id-wf-${flowId}-agent-skills-${agentId}`);
    expect(skillsTab).toBeInTheDocument();
    fireEvent.click(skillsTab);
};

const skillOverrides = {
    skills: [{ id: "test-skill1", executorId: agentId }],
};

describe("Skills tab", () => {
    it("should display the agent skills", async () => {
        // renderAgent('user', true, skillOverrides, false, true);
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: skillOverrides,
            includeSkills: true,
        });
        goToSkillsTab();
        const skillName = screen.getByTestId(`skill-name-${agentId}-0`);
        expect(skillName).toBeInTheDocument();
        expect(skillName).toHaveTextContent("test skill1");
        const agentName = screen.getByTestId(`agent-name-${agentId}-0`);
        expect(agentName).toBeInTheDocument();
        expect(agentName).toHaveTextContent("user_proxy");
    });
    it("should allow removing agent skills", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: skillOverrides,
            includeSkills: true,
        });
        goToSkillsTab();
        const removeSkillButton = screen.getByTestId(`remove-agent-skill-${agentId}-0`);
        expect(removeSkillButton).toBeInTheDocument();
        fireEvent.click(removeSkillButton);
        const skillName = screen.queryByTestId(`skill-name-${agentId}-0`);
        expect(skillName).toBeNull();
        const agentName = screen.queryByTestId(`agent-name-${agentId}-0`);
        expect(agentName).toBeNull();
        submitAgentChanges();
    });
    it("should allow adding agent skills", async () => {
        renderAgent("user_proxy", {
            openModal: true,
            dataOverrides: skillOverrides,
            includeSkills: true,
        });
        goToSkillsTab();
        const selectSkill = screen.getByLabelText("Skill:");
        expect(selectSkill).toBeInTheDocument();
        selectEvent.openMenu(selectSkill);
        await selectEvent.select(selectSkill, "test skill2");
        const selectExecutor = screen.getByLabelText("Executor:");
        expect(selectExecutor).toBeInTheDocument();
        selectEvent.openMenu(selectExecutor);
        await selectEvent.select(selectExecutor, "user_proxy");
        const addSkillButton = screen.getByTestId(`add-agent-skill-${agentId}`);
        expect(addSkillButton).toBeInTheDocument();
        fireEvent.click(addSkillButton);
        const skillName = screen.getByTestId(`skill-name-${agentId}-1`);
        expect(skillName).toBeInTheDocument();
        expect(skillName).toHaveTextContent("test skill2");
        const agentName = screen.getByTestId(`agent-name-${agentId}-1`);
        expect(agentName).toBeInTheDocument();
        expect(agentName).toHaveTextContent("user_proxy");
        submitAgentChanges();
    });
    it("should show a message if there are no skills", async () => {
        renderAgent("user_proxy", {
            openModal: true,
        });
        goToSkillsTab();
        const noSkillsMessage = screen.getByText("No skills found in the workspace");
        expect(noSkillsMessage).toBeInTheDocument();
    });
});
