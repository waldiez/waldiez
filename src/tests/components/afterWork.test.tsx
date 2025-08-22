/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { AfterWork } from "@waldiez/components/afterWork";
import { WaldiezNodeAgent, WaldiezTransitionTarget } from "@waldiez/models";

const mockAgent1: WaldiezNodeAgent = {
    id: "agent-1",
    type: "agent",
    position: { x: 0, y: 0 },
    data: {
        label: "Test Agent 1",
        agentType: "assistant",
        name: "test_agent_1",
        description: "Test agent 1 description",
        parentId: undefined,
        systemMessage: "Test system message",
        updateAgentStateBeforeReply: [],
        agentDefaultAutoReply: "Default auto reply",
        humanInputMode: "NEVER",
        codeExecutionConfig: false,
        maxConsecutiveAutoReply: 10,
        termination: {
            type: "none",
            keywords: [],
            criterion: "ending",
            methodContent: null,
        },
        handoffs: [],
        afterWork: null,
        tools: [],
        nestedChats: [],
        modelIds: [],
        tags: [],
        requirements: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
    },
};

const mockAgent2: WaldiezNodeAgent = {
    id: "agent-2",
    type: "agent",
    position: { x: 100, y: 100 },
    data: {
        label: "Test Agent 2",
        agentType: "user_proxy",
        name: "test_agent_2",
        description: "Test agent 2 description",
        parentId: undefined,
        systemMessage: "Test system message 2",
        updateAgentStateBeforeReply: [],
        agentDefaultAutoReply: "Default auto reply 2",
        humanInputMode: "NEVER",
        codeExecutionConfig: false,
        maxConsecutiveAutoReply: 10,
        termination: {
            type: "none",
            keywords: [],
            criterion: "ending",
            methodContent: null,
        },
        handoffs: [],
        afterWork: null,
        tools: [],
        nestedChats: [],
        modelIds: [],
        tags: [],
        requirements: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
    },
};

const mockAgent3: WaldiezNodeAgent = {
    id: "agent-3",
    type: "agent",
    position: { x: 200, y: 200 },
    data: {
        label: "Test Agent 3",
        agentType: "assistant",
        name: "test_agent_3",
        description: "Test agent 3 description",
        parentId: undefined,
        systemMessage: "Test system message 3",
        updateAgentStateBeforeReply: [],
        agentDefaultAutoReply: "Default auto reply 3",
        humanInputMode: "NEVER",
        codeExecutionConfig: false,
        maxConsecutiveAutoReply: 10,
        termination: {
            type: "none",
            keywords: [],
            criterion: "ending",
            methodContent: null,
        },
        handoffs: [],
        afterWork: null,
        tools: [],
        nestedChats: [],
        modelIds: [],
        tags: [],
        requirements: [],
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
    },
};

const mockAgents = [mockAgent1, mockAgent2, mockAgent3];

const setup = (
    target: WaldiezTransitionTarget | null = null,
    agents: WaldiezNodeAgent[] = mockAgents,
    onChange = vi.fn(),
    isForGroupChat = false,
) => {
    render(<AfterWork target={target} agents={agents} onChange={onChange} isForGroupChat={isForGroupChat} />);
    return { onChange };
};

describe("AfterWork", () => {
    it("should render successfully", () => {
        const { baseElement } = render(
            <AfterWork target={null} agents={mockAgents} onChange={vi.fn()} isForGroupChat={false} />,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should render with correct checkbox label for agent context", () => {
        setup(null, mockAgents, vi.fn(), false);
        const checkbox = screen.getByLabelText(
            /Include an action to perform after the Agent has no more work to do/,
        );
        expect(checkbox).toBeInTheDocument();
    });

    it("should render with correct checkbox label for group chat context", () => {
        setup(null, mockAgents, vi.fn(), true);
        const checkbox = screen.getByLabelText(/Include an action to perform after the chat ends/);
        expect(checkbox).toBeInTheDocument();
    });

    it("should start with checkbox unchecked when target is null", () => {
        setup(null);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).not.toBeChecked();
    });

    it("should start with checkbox checked when target is provided", () => {
        const target: WaldiezTransitionTarget = {
            targetType: "TerminateTarget",
            value: [],
        };
        setup(target);
        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeChecked();
    });

    it("should show action selector when checkbox is checked", () => {
        setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const actionLabel = screen.getByText("Action to perform after work:");
        expect(actionLabel).toBeInTheDocument();
    });

    it("should hide action selector when checkbox is unchecked", () => {
        const target: WaldiezTransitionTarget = {
            targetType: "TerminateTarget",
            value: [],
        };
        setup(target);

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const actionLabel = screen.queryByText("Action to perform after work:");
        expect(actionLabel).not.toBeInTheDocument();
    });

    it("should call onChange with null when checkbox is unchecked", () => {
        const target: WaldiezTransitionTarget = {
            targetType: "TerminateTarget",
            value: [],
        };
        const { onChange } = setup(target);

        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        expect(onChange).toHaveBeenCalledWith(null);
    });

    it("should display available transition target options for agent context", async () => {
        setup(null, mockAgents, vi.fn(), false);
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(targetSelect);

        // Should include agent-specific options
        expect(screen.getByText("Pass the floor to another agent")).toBeInTheDocument();
        expect(screen.getByText("Choose a random agent")).toBeInTheDocument();
        expect(screen.getByText("Return to the group chat manager")).toBeInTheDocument();
        expect(screen.getByText("Revert to the user agent")).toBeInTheDocument();
        expect(screen.getByText("Ask the user")).toBeInTheDocument();
        expect(screen.getByText("Terminate the flow")).toBeInTheDocument();
        expect(screen.queryByText("Do Nothing")).toBeInTheDocument();

        // Should not include excluded options
        expect(screen.queryByText("Group Chat")).not.toBeInTheDocument();
        expect(screen.queryByText("Trigger a nested chat")).not.toBeInTheDocument();
    });

    it("should display limited transition target options for group chat context", async () => {
        setup(null, mockAgents, vi.fn(), true);
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(targetSelect);

        // Should only include group chat appropriate options
        expect(screen.getByText("Revert to the user agent")).toBeInTheDocument();
        expect(screen.getByText("Ask the user")).toBeInTheDocument();
        expect(screen.getByText("Terminate the flow")).toBeInTheDocument();

        // Should not include excluded options for group chat
        expect(screen.queryByText("Pass the floor to another agent")).not.toBeInTheDocument();
        expect(screen.queryByText("Choose a random agent")).not.toBeInTheDocument();
        expect(screen.queryByText("Return to the group chat manager")).not.toBeInTheDocument();
        expect(screen.queryByText("Do Nothing")).not.toBeInTheDocument();
    });

    it("should handle TerminateTarget selection", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Terminate the flow");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "TerminateTarget",
            value: [],
        });
    });

    it("should handle AskUserTarget selection", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Ask the user");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "AskUserTarget",
            value: [],
        });
    });

    it("should handle RevertToUserTarget selection", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Revert to the user agent");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "RevertToUserTarget",
            value: [],
        });
    });

    it("should handle GroupManagerTarget selection", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Return to the group chat manager");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "GroupManagerTarget",
            value: [],
        });
    });

    it("should show agent selector when AgentTarget is selected", async () => {
        setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Pass the floor to another agent");

        const agentLabel = screen.getByText("Agent to pass the floor to:");
        expect(agentLabel).toBeInTheDocument();
    });

    it("should handle AgentTarget selection with agent", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Pass the floor to another agent");

        const agentSelect = screen.getByLabelText("Agent to pass the floor to:");
        await selectEvent.select(agentSelect, "Test Agent 1");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "AgentTarget",
            value: ["agent-1"],
        });
    });

    it("should show multiple agent selector when RandomAgentTarget is selected", async () => {
        setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Choose a random agent");

        const agentsLabel = screen.getByText("Agents to choose from:");
        expect(agentsLabel).toBeInTheDocument();
    });

    it("should handle RandomAgentTarget selection with multiple agents", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        await selectEvent.select(targetSelect, "Choose a random agent");

        const agentsSelect = screen.getByLabelText("Agents to choose from:");
        await selectEvent.select(agentsSelect, ["Test Agent 1", "Test Agent 2"]);

        expect(onChange).toHaveBeenCalledWith({
            targetType: "RandomAgentTarget",
            value: ["agent-1", "agent-2"],
        });
    });

    it("should initialize with RandomAgentTarget values", () => {
        const target: WaldiezTransitionTarget = {
            targetType: "RandomAgentTarget",
            value: ["agent-1", "agent-2"],
        };
        setup(target);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeChecked();

        // Should show the multiple agent selector with selected agents
        expect(screen.getByText("Test Agent 1")).toBeInTheDocument();
        expect(screen.getByText("Test Agent 2")).toBeInTheDocument();
    });

    it("should initialize with TerminateTarget values", () => {
        const target: WaldiezTransitionTarget = {
            targetType: "TerminateTarget",
            value: [],
        };
        setup(target);

        const checkbox = screen.getByRole("checkbox");
        expect(checkbox).toBeChecked();

        // Should show terminate option selected
        const selectedOption = screen.getByText("Terminate the flow");
        expect(selectedOption).toBeInTheDocument();
    });

    it("should handle empty agents array", () => {
        setup(null, []);
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        // Should still render without errors
        const actionLabel = screen.getByText("Action to perform after work:");
        expect(actionLabel).toBeInTheDocument();
    });

    it("should handle agent selection change for AgentTarget", async () => {
        const target: WaldiezTransitionTarget = {
            targetType: "AgentTarget",
            value: ["agent-1"],
        };
        const { onChange } = setup(target);

        const agentSelect = screen.getByLabelText("Agent to pass the floor to:");
        await selectEvent.select(agentSelect, "Test Agent 2");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "AgentTarget",
            value: ["agent-2"],
        });
    });

    it("should handle clearing agent selection for AgentTarget", async () => {
        const target: WaldiezTransitionTarget = {
            targetType: "AgentTarget",
            value: ["agent-1"],
        };
        setup(target);

        const agentSelect = screen.getByLabelText("Agent to pass the floor to:");
        await selectEvent.clearFirst(agentSelect);

        // Should not crash when clearing
        expect(screen.getByLabelText("Agent to pass the floor to:")).toBeInTheDocument();
    });

    it("should handle agent selection change for RandomAgentTarget", async () => {
        const target: WaldiezTransitionTarget = {
            targetType: "RandomAgentTarget",
            value: ["agent-1"],
        };
        const { onChange } = setup(target);

        const agentsSelect = screen.getByLabelText("Agents to choose from:");
        await selectEvent.select(agentsSelect, "Test Agent 3");

        expect(onChange).toHaveBeenCalledWith({
            targetType: "RandomAgentTarget",
            value: ["agent-1", "agent-3"],
        });
    });

    it("should not call onChange when invalid selection is made", async () => {
        const { onChange } = setup();
        const checkbox = screen.getByRole("checkbox");
        fireEvent.click(checkbox);

        // Clear the mock to only track new calls
        onChange.mockClear();

        const targetSelect = screen.getByLabelText("Action to perform after work:");

        // Try to clear the selection
        await selectEvent.clearFirst(targetSelect);

        // Should not have called onChange for invalid selection
        expect(onChange).not.toHaveBeenCalled();
    });

    it("should not update agent when wrong target type", async () => {
        const target: WaldiezTransitionTarget = {
            targetType: "TerminateTarget",
            value: [],
        };
        const { onChange } = setup(target);

        // Clear the mock to only track new calls
        onChange.mockClear();

        // This should not trigger agent change since we're in TerminateTarget mode
        // The agent selector shouldn't even be visible
        expect(screen.queryByLabelText("Agent to pass the floor to:")).not.toBeInTheDocument();
    });
});
