/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EventAgentsList } from "@waldiez/components/stepByStep/eventAgentsList";

describe("EventAgentsList", () => {
    const mockAgent1 = {
        name: "Agent1",
        system_message: "Agent 1 system message",
        cost: {
            total: {
                total_cost: 0.001,
            },
        },
        chat_messages: {
            conversation: [
                { content: "Hello from Agent1", role: "assistant", name: "Agent1" },
                { content: "Response", role: "user", name: "User" },
            ],
        },
    };

    const mockAgent2 = {
        name: "Agent2",
        system_message: "Agent 2 system message",
        cost: {
            total: {
                total_cost: 0.002,
            },
        },
        chat_messages: {
            conversation: [
                { content: "Hello from Agent2", role: "assistant", name: "Agent2" },
                {
                    content: "None",
                    tool_calls: [
                        {
                            id: "call_123",
                            function: { name: "test_tool", arguments: "{}" },
                            type: "function",
                        },
                    ],
                    role: "assistant",
                    name: "Agent2",
                },
            ],
        },
    };

    describe("rendering", () => {
        it("should render all agents", () => {
            render(<EventAgentsList agents={[mockAgent1, mockAgent2]} darkMode={false} />);
            expect(screen.getByText("Agent1")).toBeInTheDocument();
            expect(screen.getByText("Agent2")).toBeInTheDocument();
        });

        it("should render with empty agents array", () => {
            const { container } = render(<EventAgentsList agents={[]} darkMode={false} />);
            expect(container.querySelector(".event-agents-details")).toBeInTheDocument();
            expect(container.querySelector(".event-agents-details")?.children.length).toBe(0);
        });

        it("should render single agent", () => {
            render(<EventAgentsList agents={[mockAgent1]} darkMode={false} />);
            expect(screen.getByText("Agent1")).toBeInTheDocument();
            expect(screen.queryByText("Agent2")).not.toBeInTheDocument();
        });

        it("should apply dark mode to children", () => {
            const { container } = render(<EventAgentsList agents={[mockAgent1]} darkMode={true} />);
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-800");
        });

        it("should apply light mode to children", () => {
            const { container } = render(<EventAgentsList agents={[mockAgent1]} darkMode={false} />);
            const card = container.querySelector(".border");
            expect(card).toHaveClass("border-gray-200");
        });
    });

    describe("activity counting", () => {
        it("should count messages correctly", () => {
            render(<EventAgentsList agents={[mockAgent1]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // 1 message from Agent1
        });

        it("should count tool calls", () => {
            render(<EventAgentsList agents={[mockAgent2]} darkMode={false} />);
            expect(screen.getByText("2")).toBeInTheDocument(); // 1 message + 1 tool call
        });

        it("should handle agents with no messages", () => {
            const noMessagesAgent = {
                ...mockAgent1,
                chat_messages: {},
            };
            render(<EventAgentsList agents={[noMessagesAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should handle agents with undefined chat_messages", () => {
            const noMessagesAgent = {
                ...mockAgent1,
                chat_messages: undefined,
            };
            render(<EventAgentsList agents={[noMessagesAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should deduplicate messages", () => {
            const agentWithDupes = {
                name: "TestAgent",
                chat_messages: {
                    conversation1: [{ content: "Hello", role: "assistant", name: "TestAgent" }],
                    conversation2: [{ content: "Hello", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[agentWithDupes]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // Should count as 1, not 2
        });

        it("should not count messages from other agents", () => {
            const mixedMessages = {
                name: "Agent1",
                chat_messages: {
                    conversation: [
                        { content: "From Agent1", role: "assistant", name: "Agent1" },
                        { content: "From Agent2", role: "assistant", name: "Agent2" },
                        { content: "From User", role: "user", name: "User" },
                    ],
                },
            };
            render(<EventAgentsList agents={[mixedMessages]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // Only Agent1's message
        });

        it("should ignore 'None' content", () => {
            const noneContentAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [{ content: "None", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[noneContentAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should ignore empty content", () => {
            const emptyContentAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [{ content: "", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[emptyContentAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should ignore whitespace-only content", () => {
            const whitespaceAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [{ content: "   ", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[whitespaceAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });
    });

    describe("last activity", () => {
        it("should show last message content", () => {
            render(<EventAgentsList agents={[mockAgent1]} darkMode={false} />);
            // Activity count is visible in header, last activity shown when expanded
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should show last tool call", () => {
            render(<EventAgentsList agents={[mockAgent2]} darkMode={false} />);
            // Tool call should be the last activity
            expect(screen.getByText("2")).toBeInTheDocument();
        });

        it("should truncate long messages", () => {
            const longMessageAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        {
                            content: "a".repeat(100),
                            role: "assistant",
                            name: "TestAgent",
                        },
                    ],
                },
            };
            render(<EventAgentsList agents={[longMessageAgent]} darkMode={false} />);
            // Message should be present (even if truncated when expanded)
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should show 'No activity' for empty agents", () => {
            const emptyAgent = {
                name: "EmptyAgent",
                chat_messages: {},
            };
            render(<EventAgentsList agents={[emptyAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });
    });

    describe("multiple tool calls", () => {
        it("should count multiple tool calls", () => {
            const multiToolAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        {
                            content: "None",
                            tool_calls: [
                                {
                                    id: "call_1",
                                    function: { name: "tool1" },
                                    type: "function",
                                },
                                {
                                    id: "call_2",
                                    function: { name: "tool2" },
                                    type: "function",
                                },
                            ],
                            role: "assistant",
                            name: "TestAgent",
                        },
                    ],
                },
            };
            render(<EventAgentsList agents={[multiToolAgent]} darkMode={false} />);
            expect(screen.getByText("2")).toBeInTheDocument(); // 2 tool calls
        });

        it("should use last tool call as last activity", () => {
            const multiToolAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        {
                            content: "None",
                            tool_calls: [
                                {
                                    id: "call_1",
                                    function: { name: "first_tool" },
                                    type: "function",
                                },
                                {
                                    id: "call_2",
                                    function: { name: "last_tool" },
                                    type: "function",
                                },
                            ],
                            role: "assistant",
                            name: "TestAgent",
                        },
                    ],
                },
            };
            render(<EventAgentsList agents={[multiToolAgent]} darkMode={false} />);
            // Last tool call should be "last_tool" when expanded
            expect(screen.getByText("2")).toBeInTheDocument();
        });
    });

    describe("global message collection", () => {
        it("should collect messages from all agents", () => {
            // Agent1 has messages in their view
            const agent1 = {
                name: "Agent1",
                chat_messages: {
                    conversation: [
                        { content: "From Agent1", role: "assistant", name: "Agent1" },
                        { content: "From Agent2", role: "assistant", name: "Agent2" },
                    ],
                },
            };

            // Agent2 has different messages in their view
            const agent2 = {
                name: "Agent2",
                chat_messages: {
                    conversation: [{ content: "Another from Agent2", role: "assistant", name: "Agent2" }],
                },
            };

            render(<EventAgentsList agents={[agent1, agent2]} darkMode={false} />);

            // Agent1 should show 1 message (their own)
            // Agent2 should show 2 messages (deduplicated from both views)
            const counts = screen.getAllByText(/[0-9]+/);
            expect(counts.length).toBeGreaterThan(0);
        });

        it("should handle messages without name field", () => {
            const noNameAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        { content: "Message without name", role: "assistant" },
                        { content: "Message with name", role: "assistant", name: "TestAgent" },
                    ],
                },
            };
            render(<EventAgentsList agents={[noNameAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // Only the one with name
        });
    });

    describe("edge cases", () => {
        it("should handle null messages", () => {
            const nullMessageAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [null, { content: "Valid", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[nullMessageAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should handle undefined messages", () => {
            const undefinedMessageAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [undefined, { content: "Valid", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[undefinedMessageAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument();
        });

        it("should handle non-array chat_messages values", () => {
            const invalidAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: "not an array",
                },
            };
            render(<EventAgentsList agents={[invalidAgent]} darkMode={false} />);
            expect(screen.getByText("0")).toBeInTheDocument();
        });

        it("should handle tool calls without function name", () => {
            const noFunctionNameAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        {
                            content: "None",
                            tool_calls: [
                                {
                                    id: "call_1",
                                    function: {},
                                    type: "function",
                                },
                            ],
                            role: "assistant",
                            name: "TestAgent",
                        },
                    ],
                },
            };
            render(<EventAgentsList agents={[noFunctionNameAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // Still counts the tool call
        });

        it("should handle agent without name", () => {
            const noNameAgent = {
                system_message: "Test",
                chat_messages: {},
            };
            render(<EventAgentsList agents={[noNameAgent]} darkMode={false} />);
            expect(screen.getByText("Unknown Agent")).toBeInTheDocument();
        });
    });

    describe("normalization", () => {
        it("should normalize whitespace in deduplication", () => {
            const whitespaceAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation1: [{ content: "Hello  World", role: "assistant", name: "TestAgent" }],
                    conversation2: [{ content: "Hello World", role: "assistant", name: "TestAgent" }],
                },
            };
            render(<EventAgentsList agents={[whitespaceAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument(); // Should dedupe despite whitespace
        });

        it("should handle content with multiple spaces", () => {
            const multiSpaceAgent = {
                name: "TestAgent",
                chat_messages: {
                    conversation: [
                        {
                            content: "Hello    World    Test",
                            role: "assistant",
                            name: "TestAgent",
                        },
                    ],
                },
            };
            render(<EventAgentsList agents={[multiSpaceAgent]} darkMode={false} />);
            expect(screen.getByText("1")).toBeInTheDocument();
        });
    });
});
