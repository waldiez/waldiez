/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AgentEventInfo } from "@waldiez/components/stepByStep/agentInfo";

describe("AgentEventInfo", () => {
    const mockAgentData = {
        name: "TestAgent",
        system_message: "You are a test agent",
        cost: {
            total: {
                total_cost: 0.001234,
            },
        },
        chat_messages: {
            user: [
                { content: "Hello", role: "user", name: "TestAgent" },
                { content: "Hi there", role: "assistant", name: "AssistantAgent" },
            ],
        },
        context_variables: {
            data: {
                task_started: true,
                task_completed: false,
            },
        },
    };

    const mockStats = {
        count: 1,
        lastActivity: "Hello",
    };

    describe("rendering", () => {
        it("should render agent name", () => {
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });

        it("should render message count from stats", () => {
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should render different activity count", () => {
            const stats = { count: 5, lastActivity: "Test" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={stats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("5")).toBeInTheDocument();
        });

        it("should render cost when present", () => {
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("$0.0012")).toBeInTheDocument();
        });

        it("should not render cost when zero", () => {
            const noCostData = { ...mockAgentData, cost: { total: { total_cost: 0 } } };
            render(
                <AgentEventInfo
                    agentData={noCostData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.queryByText("$0.0000")).not.toBeInTheDocument();
        });

        it("should render with Unknown Agent when name is missing", () => {
            const noNameData = { ...mockAgentData, name: undefined };
            render(
                <AgentEventInfo
                    agentData={noNameData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("Unknown Agent")).toBeInTheDocument();
        });
    });

    describe("dark mode", () => {
        it("should apply dark mode styles", () => {
            const { container } = render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={true}
                    maxContentLen={80}
                />,
            );
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-800");
        });

        it("should apply light mode styles", () => {
            const { container } = render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-200");
        });
    });

    describe("expansion", () => {
        it("should start collapsed", () => {
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
            expect(screen.queryByText("Last Activity")).not.toBeInTheDocument();
        });

        it("should expand when clicked", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));

            expect(screen.getByText("Role")).toBeInTheDocument();
            expect(screen.getByText("Last Activity")).toBeInTheDocument();
        });

        it("should collapse when clicked again", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Role")).toBeInTheDocument();

            await user.click(screen.getByText("TestAgent"));
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
        });
    });

    describe("system message", () => {
        it("should display system message when expanded", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("You are a test agent")).toBeInTheDocument();
        });

        it("should truncate long system messages", async () => {
            const user = userEvent.setup();
            const longMessage = "a".repeat(200);
            const longMessageData = { ...mockAgentData, system_message: longMessage };
            render(
                <AgentEventInfo
                    agentData={longMessageData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            const truncated = screen.getByText(/^a+\.\.\./);
            expect(truncated.textContent?.length).toBeLessThan(160);
        });

        it("should use description as fallback", async () => {
            const user = userEvent.setup();
            const descData = { ...mockAgentData, system_message: undefined, description: "Test description" };
            render(
                <AgentEventInfo agentData={descData} stats={mockStats} darkMode={false} maxContentLen={80} />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Test description")).toBeInTheDocument();
        });

        it("should not render role section when no message or description", async () => {
            const user = userEvent.setup();
            const noMsgData = { ...mockAgentData, system_message: undefined, description: undefined };
            render(
                <AgentEventInfo
                    agentData={noMsgData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
        });
    });

    describe("last activity from stats", () => {
        it("should display last activity from stats prop", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Hello")).toBeInTheDocument();
        });

        it("should display tool call activity", async () => {
            const user = userEvent.setup();
            const toolStats = { count: 1, lastActivity: "Called initiate_research" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={toolStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Called initiate_research")).toBeInTheDocument();
        });

        it("should display no activity message", async () => {
            const user = userEvent.setup();
            const noStats = { count: 0, lastActivity: "No activity" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={noStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("No activity")).toBeInTheDocument();
        });

        it("should handle long activity messages", async () => {
            const user = userEvent.setup();
            const longActivity = "x".repeat(100);
            const longStats = { count: 1, lastActivity: longActivity };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={longStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText(longActivity)).toBeInTheDocument();
        });
    });

    describe("context variables", () => {
        it("should display context variables when present", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Context Variables")).toBeInTheDocument();
            expect(screen.getByText("task_started:")).toBeInTheDocument();
            expect(screen.getByText("task_completed:")).toBeInTheDocument();
        });

        it("should format boolean values correctly", async () => {
            const user = userEvent.setup();
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            const values = screen.getAllByText(/[✓✗]/);
            expect(values).toHaveLength(2);
        });

        it("should handle string values", async () => {
            const user = userEvent.setup();
            const stringVarsData = {
                ...mockAgentData,
                context_variables: {
                    data: {
                        status: "running",
                    },
                },
            };
            render(
                <AgentEventInfo
                    agentData={stringVarsData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("running")).toBeInTheDocument();
        });

        it("should truncate long string values", async () => {
            const user = userEvent.setup();
            const longString = "a".repeat(500);
            const longVarsData = {
                ...mockAgentData,
                context_variables: {
                    data: {
                        message: longString,
                    },
                },
            };
            render(
                <AgentEventInfo
                    agentData={longVarsData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={30}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            const truncated = screen.getByText(/^a+\.\.\./);
            expect(truncated.textContent?.length).toBeLessThan(35);
        });

        it("should handle object values", async () => {
            const user = userEvent.setup();
            const objVarsData = {
                ...mockAgentData,
                context_variables: {
                    data: {
                        config: { key: "value" },
                    },
                },
            };
            render(
                <AgentEventInfo
                    agentData={objVarsData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText(/"key":"value"/)).toBeInTheDocument();
        });

        it("should not display context variables section when empty", async () => {
            const user = userEvent.setup();
            const noVarsData = { ...mockAgentData, context_variables: { data: {} } };
            render(
                <AgentEventInfo
                    agentData={noVarsData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.queryByText("Context Variables")).not.toBeInTheDocument();
        });

        it("should handle context_variables without data wrapper", async () => {
            const user = userEvent.setup();
            const directVarsData = {
                ...mockAgentData,
                context_variables: {
                    task_started: true,
                },
            };
            render(
                <AgentEventInfo
                    agentData={directVarsData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Context Variables")).toBeInTheDocument();
            expect(screen.getByText("task_started:")).toBeInTheDocument();
        });
    });

    describe("cost handling", () => {
        it("should handle cost.actual fallback", () => {
            const actualCostData = {
                ...mockAgentData,
                cost: {
                    actual: {
                        total_cost: 0.0056,
                    },
                },
            };
            render(
                <AgentEventInfo
                    agentData={actualCostData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("$0.0056")).toBeInTheDocument();
        });

        it("should handle missing cost object", () => {
            const noCostData = { ...mockAgentData, cost: undefined };
            render(
                <AgentEventInfo
                    agentData={noCostData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
        });
    });

    describe("stats prop variations", () => {
        it("should handle zero activity count", () => {
            const zeroStats = { count: 0, lastActivity: "No activity" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={zeroStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should handle high activity count", () => {
            const highStats = { count: 99, lastActivity: "Many activities" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={highStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("99")).toBeInTheDocument();
        });

        it("should handle empty last activity", () => {
            const emptyStats = { count: 1, lastActivity: "" };
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={emptyStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            // Empty string should still render, just be blank
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });

    describe("string parsing", () => {
        it("should parse stringified JSON", () => {
            const stringData = JSON.stringify(mockAgentData);
            render(
                <AgentEventInfo
                    agentData={stringData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });

        it("should handle already parsed objects", () => {
            render(
                <AgentEventInfo
                    agentData={mockAgentData}
                    stats={mockStats}
                    darkMode={false}
                    maxContentLen={80}
                />,
            );
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });
    });
});
