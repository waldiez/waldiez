/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import selectEvent from "react-select-event";

import { AfterWork } from "@waldiez/components/afterWork";
import { WaldiezNodeAgent, WaldiezTransitionTarget } from "@waldiez/models";

const agents: WaldiezNodeAgent[] = [
    {
        id: "agent-1",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
            tags: [],
            requirements: [],
            agentType: "user_proxy",
            label: "Agent One",
            name: "Agent One",
            description: "This is agent one",
            parentId: undefined,
            humanInputMode: "ALWAYS",
            systemMessage: "You are agent one",
            agentDefaultAutoReply: null,
            codeExecutionConfig: false,
            maxConsecutiveAutoReply: 1,
            termination: {
                type: "none",
                keywords: [],
                criterion: "found",
                methodContent: null,
            },
            tools: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            nestedChats: [],
            handoffs: [],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            modelIds: [],
        },
    },
    {
        id: "agent-2",
        type: "agent",
        position: { x: 0, y: 0 },
        data: {
            label: "Agent Two",
            agentType: "assistant",
            name: "Agent Two",
            description: "This is agent two",
            parentId: undefined,
            humanInputMode: "NEVER",
            systemMessage: "You are agent two",
            agentDefaultAutoReply: null,
            codeExecutionConfig: false,
            maxConsecutiveAutoReply: 1,
            termination: {
                type: "none",
                keywords: [],
                criterion: "found",
                methodContent: null,
            },
            tools: [],
            tags: [],
            requirements: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
            nestedChats: [],
            handoffs: [],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            modelIds: [],
        },
    },
];

const setup = (
    target: WaldiezTransitionTarget | undefined = undefined,
    onChange = vi.fn(),
    isForGroupChat = false,
) => {
    return render(
        <AfterWork target={target} agents={agents} onChange={onChange} isForGroupChat={isForGroupChat} />,
    );
};

describe("AfterWork", () => {
    it("renders disabled state initially", () => {
        setup();
        const checkbox = screen.getByTestId("afterWork") as HTMLInputElement;
        expect(checkbox.checked).toBe(false);
    });

    it("enables afterWork section and shows target select", async () => {
        setup(undefined, vi.fn());
        const checkbox = screen.getByTestId("afterWork");
        fireEvent.click(checkbox);
        expect(screen.getByLabelText("Action to perform after work:")).toBeInTheDocument();
    });

    it("calls onChange(undefined) when disabling checkbox", () => {
        const mock = vi.fn();
        setup({ target_type: "AskUserTarget" }, mock);
        const checkbox = screen.getByTestId("afterWork");
        fireEvent.click(checkbox);
        expect(mock).toHaveBeenCalledWith(undefined);
    });

    it("selects 'AskUserTarget' and triggers onChange", async () => {
        const mock = vi.fn();
        setup(undefined, mock);
        fireEvent.click(screen.getByTestId("afterWork"));
        const select = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Ask the user");
        expect(mock).toHaveBeenCalledWith({ target_type: "AskUserTarget" });
    });

    it("selects 'AgentTarget' but does not trigger onChange without agent ID", async () => {
        const mock = vi.fn();
        setup(undefined, mock);
        fireEvent.click(screen.getByTestId("afterWork"));
        mock.mockClear(); // first call is on checkbox change
        const select = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Pass the floor to another agent");
        expect(mock).not.toHaveBeenCalled();
    });

    it("selects 'AgentTarget' and then agent ID, triggering onChange", async () => {
        const mock = vi.fn();
        setup(undefined, mock);
        fireEvent.click(screen.getByTestId("afterWork"));

        const targetSelect = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(targetSelect);
        await selectEvent.select(targetSelect, "Pass the floor to another agent");

        const agentSelect = screen.getByLabelText("Agent to pass the floor to:");
        selectEvent.openMenu(agentSelect);
        await selectEvent.select(agentSelect, "Agent One");

        expect(mock).toHaveBeenCalledWith({
            target_type: "AgentTarget",
            target: "agent-1",
        });
    });
    it("changes the selected agent ID", async () => {
        const mock = vi.fn();
        setup({ target_type: "AgentTarget", target: "agent-1" }, mock);
        // no need to click the checkbox (already checked, since we are passing target)

        const select = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(select);
        await selectEvent.select(select, "Pass the floor to another agent");

        const agentSelect = screen.getByLabelText("Agent to pass the floor to:");
        selectEvent.openMenu(agentSelect);
        await selectEvent.select(agentSelect, "Agent Two");

        expect(mock).toHaveBeenCalledWith({
            target_type: "AgentTarget",
            target: "agent-2",
        });
    });

    it("renders with existing AgentTarget", () => {
        const mock = vi.fn();
        setup({ target_type: "AgentTarget", target: "agent-2" }, mock);
        expect(screen.getByLabelText("Agent to pass the floor to:")).toBeInTheDocument();
    });

    it("respects group chat exclusion list", async () => {
        const mock = vi.fn();
        setup(undefined, mock, true);
        fireEvent.click(screen.getByTestId("afterWork"));
        const select = screen.getByLabelText("Action to perform after work:");
        selectEvent.openMenu(select);
        const options = screen.getAllByRole("option").map(opt => opt.textContent);
        expect(options).not.toContain("Pass the floor to another agent");
        expect(options).not.toContain("Choose a random agent");
    });
});
