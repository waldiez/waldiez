/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
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

    describe("rendering", () => {
        it("should render agent name", () => {
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });

        it("should render message count", () => {
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should render cost when present", () => {
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            expect(screen.getByText("$0.0012")).toBeInTheDocument();
        });

        it("should not render cost when zero", () => {
            const noCostData = { ...mockAgentData, cost: { total: { total_cost: 0 } } };
            render(<AgentEventInfo agentData={noCostData} darkMode={false} />);
            expect(screen.queryByText("$0.0000")).not.toBeInTheDocument();
        });

        it("should render with Unknown Agent when name is missing", () => {
            const noNameData = { ...mockAgentData, name: undefined };
            render(<AgentEventInfo agentData={noNameData} darkMode={false} />);
            expect(screen.getByText("Unknown Agent")).toBeInTheDocument();
        });
    });

    describe("dark mode", () => {
        it("should apply dark mode styles", () => {
            const { container } = render(<AgentEventInfo agentData={mockAgentData} darkMode={true} />);
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-800");
        });

        it("should apply light mode styles", () => {
            const { container } = render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-200");
        });
    });

    describe("expansion", () => {
        it("should start collapsed", () => {
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
            expect(screen.queryByText("Last Activity")).not.toBeInTheDocument();
        });

        it("should expand when clicked", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));

            expect(screen.getByText("Role")).toBeInTheDocument();
            expect(screen.getByText("Last Activity")).toBeInTheDocument();
        });

        it("should collapse when clicked again", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Role")).toBeInTheDocument();

            await user.click(screen.getByText("TestAgent"));
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
        });
    });

    describe("system message", () => {
        it("should display system message when expanded", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("You are a test agent")).toBeInTheDocument();
        });

        it("should truncate long system messages", async () => {
            const user = userEvent.setup();
            const longMessage = "a".repeat(200);
            const longMessageData = { ...mockAgentData, system_message: longMessage };
            render(<AgentEventInfo agentData={longMessageData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            const truncated = screen.getByText(/^a+\.\.\./);
            expect(truncated.textContent?.length).toBeLessThan(160);
        });

        it("should use description as fallback", async () => {
            const user = userEvent.setup();
            const descData = { ...mockAgentData, system_message: undefined, description: "Test description" };
            render(<AgentEventInfo agentData={descData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Test description")).toBeInTheDocument();
        });

        it("should not render role section when no message or description", async () => {
            const user = userEvent.setup();
            const noMsgData = { ...mockAgentData, system_message: undefined, description: undefined };
            render(<AgentEventInfo agentData={noMsgData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.queryByText("Role")).not.toBeInTheDocument();
        });
    });

    describe("last activity", () => {
        it("should display last message", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Hello")).toBeInTheDocument();
        });

        it("should truncate long messages", async () => {
            const user = userEvent.setup();
            const longContent = "x".repeat(100);
            const longMsgData = {
                ...mockAgentData,
                chat_messages: {
                    user: [{ content: longContent, role: "assistant", name: "TestAgent" }],
                },
            };
            render(<AgentEventInfo agentData={longMsgData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            const message = screen.getByText(/^x+\.\.\./);
            expect(message.textContent?.length).toBeLessThan(60);
        });

        it('should display "No messages" when chat_messages is empty', async () => {
            const user = userEvent.setup();
            const noMsgData = { ...mockAgentData, chat_messages: {} };
            render(<AgentEventInfo agentData={noMsgData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("No messages")).toBeInTheDocument();
        });

        it('should display "No messages" when chat_messages is missing', async () => {
            const user = userEvent.setup();
            const noMsgData = { ...mockAgentData, chat_messages: undefined };
            render(<AgentEventInfo agentData={noMsgData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("No messages")).toBeInTheDocument();
        });

        it("should handle messages without content", async () => {
            const user = userEvent.setup();
            const noContentData = {
                ...mockAgentData,
                chat_messages: {
                    user: [{ role: "assistant", name: "TestAgent" }],
                },
            };
            render(<AgentEventInfo agentData={noContentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Unknown")).toBeInTheDocument();
        });
    });

    describe("context variables", () => {
        it("should display context variables when present", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("Context Variables")).toBeInTheDocument();
            expect(screen.getByText("task_started:")).toBeInTheDocument();
            expect(screen.getByText("task_completed:")).toBeInTheDocument();
        });

        it("should format boolean values correctly", async () => {
            const user = userEvent.setup();
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);

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
            render(<AgentEventInfo agentData={stringVarsData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText("running")).toBeInTheDocument();
        });

        it("should truncate long string values", async () => {
            const user = userEvent.setup();
            const longString = "a".repeat(50);
            const longVarsData = {
                ...mockAgentData,
                context_variables: {
                    data: {
                        message: longString,
                    },
                },
            };
            render(<AgentEventInfo agentData={longVarsData} darkMode={false} />);

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
            render(<AgentEventInfo agentData={objVarsData} darkMode={false} />);

            await user.click(screen.getByText("TestAgent"));
            expect(screen.getByText(/"key":"value"/)).toBeInTheDocument();
        });

        it("should not display context variables section when empty", async () => {
            const user = userEvent.setup();
            const noVarsData = { ...mockAgentData, context_variables: { data: {} } };
            render(<AgentEventInfo agentData={noVarsData} darkMode={false} />);

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
            render(<AgentEventInfo agentData={directVarsData} darkMode={false} />);

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
            render(<AgentEventInfo agentData={actualCostData} darkMode={false} />);
            expect(screen.getByText("$0.0056")).toBeInTheDocument();
        });

        it("should handle missing cost object", () => {
            const noCostData = { ...mockAgentData, cost: undefined };
            render(<AgentEventInfo agentData={noCostData} darkMode={false} />);
            expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
        });
    });

    describe("message counting", () => {
        it("should count messages across multiple conversations", () => {
            const multiConversationData = {
                ...mockAgentData,
                name: "user2",
                chat_messages: {
                    user1: [{ content: "msg1", role: "user", name: "user2" }],
                    user2: [
                        { content: "msg2", role: "user", name: "user1" },
                        { content: "msg3", role: "assistant", name: "user2" },
                    ],
                },
            };
            render(<AgentEventInfo agentData={multiConversationData} darkMode={false} />);
            expect(screen.getByText("2")).toBeInTheDocument();
        });

        it("should show 0 messages when chat_messages is empty", () => {
            const emptyMsgData = { ...mockAgentData, chat_messages: {} };
            render(<AgentEventInfo agentData={emptyMsgData} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });
    });

    describe("string parsing", () => {
        it("should parse stringified JSON", () => {
            const stringData = JSON.stringify(mockAgentData);
            render(<AgentEventInfo agentData={stringData} darkMode={false} />);
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });

        it("should handle already parsed objects", () => {
            render(<AgentEventInfo agentData={mockAgentData} darkMode={false} />);
            expect(screen.getByText("TestAgent")).toBeInTheDocument();
        });
    });
});
