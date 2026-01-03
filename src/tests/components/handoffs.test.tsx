/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Handoffs } from "@waldiez/components/handoffs";
import type {
    WaldiezAgentNestedChat,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
} from "@waldiez/models/types";

const mockAgent: WaldiezNodeAgent = {
    id: "agent-1",
    type: "agent",
    position: { x: 0, y: 0 },
    data: {
        label: "Test Agent",
        agentType: "assistant",
        name: "test_agent",
        description: "Test agent description",
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

const mockTargetAgent: WaldiezNodeAgent = {
    id: "agent-2",
    type: "agent",
    position: { x: 100, y: 100 },
    data: {
        label: "Target Agent",
        description: "Target agent description",
        parentId: undefined,
        agentType: "user_proxy",
        agentDefaultAutoReply: "Auto reply from target agent",
        updateAgentStateBeforeReply: [],
        name: "target_agent",
        systemMessage: "Target system message",
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

const mockEdge: WaldiezEdge = {
    id: "edge-1",
    source: "agent-1",
    target: "agent-2",
    type: "chat",
    data: {
        label: "Test Edge",
        description: "Test edge description",
        position: 0,
        order: 0,
        maxTurns: 1,
        prerequisites: [],
        realSource: "agent-1",
        realTarget: "agent-2",
        sourceType: "assistant",
        targetType: "user_proxy",
        afterWork: null,
        nestedChat: {
            message: null,
            reply: null,
        },
        summary: {
            prompt: "Summarize the conversation",
            method: null,
            args: {},
        },
        clearHistory: true,
        message: {
            type: "string",
            content: "Test message content",
            context: {},
            useCarryover: undefined,
        },
        condition: {
            conditionType: "string_llm",
            prompt: "",
        },
        available: {
            type: "string",
            value: "",
        },
    },
};

const setup = (
    dataOverrides: Partial<WaldiezNodeAgentData> = {},
    agents: WaldiezNodeAgent[] = [mockAgent, mockTargetAgent],
    edges: WaldiezEdge[] = [mockEdge],
    onDataChange = vi.fn(),
) => {
    const data: WaldiezNodeAgentData = {
        ...mockAgent.data,
        ...dataOverrides,
    };

    render(<Handoffs id="agent-1" data={data} agents={agents} edges={edges} onDataChange={onDataChange} />);

    return { onDataChange };
};

describe("Handoffs", () => {
    it("should render successfully", () => {
        const { baseElement } = render(
            <Handoffs
                id="agent-1"
                data={mockAgent.data}
                agents={[mockAgent, mockTargetAgent]}
                edges={[mockEdge]}
                onDataChange={vi.fn()}
            />,
        );
        expect(baseElement).toBeTruthy();
    });

    it("should render handoffs container with correct test id", () => {
        setup();
        const container = screen.getByTestId("handoffs-container-agent-1");
        expect(container).toBeInTheDocument();
    });

    it("should display info message about handoffs", () => {
        setup();
        const infoText = screen.getByText(/Handoffs control where the conversation flow goes/);
        expect(infoText).toBeInTheDocument();
    });

    it("should display no handoffs message when no handoffs are configured", () => {
        setup({ handoffs: [], afterWork: null }, [mockAgent, mockTargetAgent], []);
        const noHandoffsMessage = screen.getByText(/This agent has no handoffs configured/);
        expect(noHandoffsMessage).toBeInTheDocument();
    });

    it("should display handoffs section when handoffs exist", () => {
        setup({ handoffs: ["edge-1"] });
        const handoffsSection = screen.getByText("Handoffs");
        expect(handoffsSection).toBeInTheDocument();
    });

    it("should display handoff order instructions", () => {
        setup({ handoffs: ["edge-1"] });
        const instructionsText = screen.getByText(/you can use the up and down arrows to reorder handoffs/);
        expect(instructionsText).toBeInTheDocument();
    });

    it("should render handoff items with correct structure", () => {
        setup({ handoffs: ["edge-1"] });
        const handoffItem = screen.getByTestId("handoff-item-0");
        expect(handoffItem).toBeInTheDocument();

        const orderBadge = screen.getByText("1");
        expect(orderBadge).toBeInTheDocument();

        const handoffType = screen.getByText("Agent Connection");
        expect(handoffType).toBeInTheDocument();
    });

    it("should show move up button when not first item", () => {
        // noinspection DuplicatedCode
        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-3",
            target: "agent-4",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const fourthAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-4",
            data: { ...mockTargetAgent.data, name: "fourth_agent" },
        };

        setup(
            { handoffs: ["edge-1", "edge-2", "edge-3"] },
            [mockAgent, mockTargetAgent, thirdAgent, fourthAgent],
            [mockEdge, secondEdge, thirdEdge],
        );

        // First item should not have move up button
        expect(screen.queryByTestId("move-handoff-up-button-0")).not.toBeInTheDocument();

        // Second item should have move up button
        const moveUpButton = screen.getByTestId("move-handoff-up-button-1");
        expect(moveUpButton).toBeInTheDocument();

        // Third item should also have move up button
        const moveUpButton2 = screen.getByTestId("move-handoff-up-button-2");
        expect(moveUpButton2).toBeInTheDocument();
    });

    it("should show move down button when not last item", () => {
        // noinspection DuplicatedCode
        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-3",
            target: "agent-4",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const fourthAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-4",
            data: { ...mockTargetAgent.data, name: "fourth_agent" },
        };

        setup(
            { handoffs: ["edge-1", "edge-2", "edge-3"] },
            [mockAgent, mockTargetAgent, thirdAgent, fourthAgent],
            [mockEdge, secondEdge, thirdEdge],
        );

        // First item should have move down button
        const moveDownButton = screen.getByTestId("move-handoff-down-button-0");
        expect(moveDownButton).toBeInTheDocument();

        // Middle item should have move down button
        const moveDownButton1 = screen.getByTestId("move-handoff-down-button-1");
        expect(moveDownButton1).toBeInTheDocument();

        // Last item should not have move down button
        expect(screen.queryByTestId("move-handoff-down-button-2")).not.toBeInTheDocument();
    });

    it("should handle moving handoff up", () => {
        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const { onDataChange } = setup(
            { handoffs: ["edge-1", "edge-2"] },
            [mockAgent, mockTargetAgent, thirdAgent],
            [mockEdge, secondEdge],
        );

        const moveUpButton = screen.getByTestId("move-handoff-up-button-1");
        fireEvent.click(moveUpButton);

        expect(onDataChange).toHaveBeenCalledWith({ handoffs: ["edge-2", "edge-1"] });
    });

    it("should handle moving handoff down", () => {
        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const { onDataChange } = setup(
            { handoffs: ["edge-1", "edge-2"] },
            [mockAgent, mockTargetAgent, thirdAgent],
            [mockEdge, secondEdge],
        );

        const moveDownButton = screen.getByTestId("move-handoff-down-button-0");
        fireEvent.click(moveDownButton);

        expect(onDataChange).toHaveBeenCalledWith({ handoffs: ["edge-2", "edge-1"] });
    });

    it("should display nested chat handoff", () => {
        setup({
            handoffs: ["nested-chat"],
            nestedChats: [
                {
                    triggeredBy: ["agent-1"],
                    messages: [{ id: "edge-1", isReply: false }],
                    condition: {
                        conditionType: "string_llm",
                        prompt: "Test condition",
                    },
                    available: {
                        type: "string",
                        value: "test_value",
                    },
                },
            ],
        });

        const handoffType = screen.getByText("Nested Chat");
        expect(handoffType).toBeInTheDocument();
    });

    it("should handle nested chat with multiple moves", () => {
        const nestedChat: WaldiezAgentNestedChat = {
            triggeredBy: ["agent-1"],
            messages: [{ id: "edge-1", isReply: false }],
            condition: {
                conditionType: "string_llm",
                prompt: "Test condition",
            },
            available: {
                type: "string",
                value: "test_value",
            },
        };

        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const { onDataChange } = setup(
            {
                handoffs: ["edge-1", "nested-chat", "edge-2"],
                nestedChats: [nestedChat],
            },
            [mockAgent, mockTargetAgent, thirdAgent],
            [mockEdge, secondEdge],
        );

        // Should have 3 handoff items
        expect(screen.getByTestId("handoff-item-0")).toBeInTheDocument();
        expect(screen.getByTestId("handoff-item-1")).toBeInTheDocument();
        expect(screen.getByTestId("handoff-item-2")).toBeInTheDocument();

        // Move nested chat (middle item) up
        const moveUpButton = screen.getByTestId("move-handoff-up-button-1");
        fireEvent.click(moveUpButton);

        expect(onDataChange).toHaveBeenCalledWith({ handoffs: ["nested-chat", "edge-1", "edge-2"] });
    });

    it("should display after work section when afterWork exists", () => {
        setup({
            afterWork: {
                targetType: "AgentTarget",
                value: ["agent-2"],
            },
        });

        const afterWorkSection = screen.getByText("After Work");
        expect(afterWorkSection).toBeInTheDocument();

        const afterWorkItem = screen.getByTestId("handoff-after-work-item");
        expect(afterWorkItem).toBeInTheDocument();

        const afterWorkInfo = screen.getByText("AfterWork handoff always executes last");
        expect(afterWorkInfo).toBeInTheDocument();
    });

    it("should display AfterWork type for after work handoff", () => {
        setup({
            afterWork: {
                targetType: "AgentTarget",
                value: ["agent-2"],
            },
        });

        const afterWorkType = screen.getByText("AfterWork");
        expect(afterWorkType).toBeInTheDocument();
    });

    it("should not render move buttons for after work handoff", () => {
        setup({
            afterWork: {
                targetType: "AgentTarget",
                value: ["agent-2"],
            },
        });

        const afterWorkItem = screen.getByTestId("handoff-after-work-item");
        expect(afterWorkItem).toBeInTheDocument();

        // After work item should not have reorder buttons
        expect(afterWorkItem.querySelector(".reorder-buttons")).not.toBeInTheDocument();
    });

    it("should handle empty agents array", () => {
        setup({}, [], []);

        const container = screen.getByTestId("handoffs-container-agent-1");
        expect(container).toBeInTheDocument();
    });

    it("should handle empty edges array", () => {
        setup({ handoffs: [] }, [mockAgent, mockTargetAgent], []);

        const noHandoffsMessage = screen.getByText(/This agent has no handoffs configured/);
        expect(noHandoffsMessage).toBeInTheDocument();
    });

    it("should display correct order badges", () => {
        // noinspection DuplicatedCode
        const secondEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-2",
            target: "agent-3",
        };

        const thirdEdge: WaldiezEdge = {
            ...mockEdge,
            id: "edge-3",
            target: "agent-4",
        };

        const thirdAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-3",
            data: { ...mockTargetAgent.data, name: "third_agent" },
        };

        const fourthAgent: WaldiezNodeAgent = {
            ...mockTargetAgent,
            id: "agent-4",
            data: { ...mockTargetAgent.data, name: "fourth_agent" },
        };

        setup(
            { handoffs: ["edge-1", "edge-2", "edge-3"] },
            [mockAgent, mockTargetAgent, thirdAgent, fourthAgent],
            [mockEdge, secondEdge, thirdEdge],
        );

        // Check order badges are displayed correctly (1, 2, 3)
        expect(screen.getByText("1")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument();
        expect(screen.getByText("3")).toBeInTheDocument();
    });

    it("should not call onDataChange when move up is attempted on first item", () => {
        const { onDataChange } = setup({ handoffs: ["edge-1"] });

        // Try to access move up button for first item (should not exist)
        const moveUpButton = screen.queryByTestId("move-handoff-up-button-0");
        expect(moveUpButton).not.toBeInTheDocument();

        expect(onDataChange).not.toHaveBeenCalled();
    });

    it("should not call onDataChange when move down is attempted on last item", () => {
        const { onDataChange } = setup({ handoffs: ["edge-1"] });

        // Single item should not have move down button (it's the last item)
        const moveDownButton = screen.queryByTestId("move-handoff-down-button-0");
        expect(moveDownButton).not.toBeInTheDocument();

        expect(onDataChange).not.toHaveBeenCalled();
    });

    it("should handle edge case with empty handoffs but existing nested chat", () => {
        const nestedChat: WaldiezAgentNestedChat = {
            triggeredBy: ["agent-1"],
            messages: [{ id: "edge-1", isReply: false }],
            condition: {
                conditionType: "string_llm",
                prompt: "Test condition",
            },
            available: {
                type: "string",
                value: "test_value",
            },
        };

        setup({
            handoffs: [], // Empty handoffs but nested chat exists
            nestedChats: [nestedChat],
        });

        // Should show the nested chat handoff
        const handoffType = screen.getByText("Nested Chat");
        expect(handoffType).toBeInTheDocument();
    });
});
