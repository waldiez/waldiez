/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import React from "react";

import { EventConsole, type WaldiezEvent } from "@waldiez/components/stepByStep/console";

describe("EventConsole", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(React, "useEffect").mockImplementation(fn => fn());
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe("rendering", () => {
        it("should render with default props", () => {
            const { container } = render(<EventConsole events={[]} />);
            expect(container.firstChild).toHaveClass(
                "flex-align-center",
                "flex-column",
                "full-height",
                "json",
            );
        });

        it("should apply custom className", () => {
            const { container } = render(<EventConsole events={[]} className="custom" />);
            expect(container.firstChild).toHaveClass("custom");
        });

        it("should log events to console", () => {
            const events: WaldiezEvent[] = [
                { type: "text", content: { sender: "A", recipient: "B", content: "test" } },
            ];
            render(<EventConsole events={events} />);
        });
    });

    describe("raw event printing", () => {
        it("should not show raw events by default", () => {
            render(
                <EventConsole
                    events={[{ type: "text", content: { sender: "A", recipient: "B", content: "test" } }]}
                />,
            );
            expect(screen.queryByText(/Raw event:/)).not.toBeInTheDocument();
        });

        it("should show raw events when printRaw is true", () => {
            render(
                <EventConsole
                    events={[{ type: "text", content: { sender: "A", recipient: "B", content: "test" } }]}
                    printRaw={true}
                />,
            );
            expect(screen.getByText(/Raw event:/)).toBeInTheDocument();
        });
    });

    describe("event rendering", () => {
        it("should render text events", () => {
            const events: WaldiezEvent[] = [
                { type: "text", content: { sender: "Alice", recipient: "Bob", content: "Hello" } },
            ];
            const { container } = render(<EventConsole events={events} />);

            expect(container).toHaveTextContent("Alice");
            expect(container).toHaveTextContent("→");
            expect(container).toHaveTextContent("Bob");
            expect(screen.getByText("Hello")).toBeInTheDocument();
        });

        it("should render post_carryover_processing events", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "post_carryover_processing",
                    content: { sender: "A", recipient: "B", message: "done" },
                },
            ];
            const { container } = render(<EventConsole events={events} />);

            expect(container).toHaveTextContent("A");
            expect(container).toHaveTextContent("B");
            expect(screen.getByText("done")).toBeInTheDocument();
        });

        it("should render group_chat_run_chat events", () => {
            const events: WaldiezEvent[] = [{ type: "group_chat_run_chat", content: { speaker: "Alice" } }];
            render(<EventConsole events={events} />);
            expect(screen.getByText("Next speaker: Alice")).toBeInTheDocument();
        });

        it("should render using_auto_reply events", () => {
            const events: WaldiezEvent[] = [
                { type: "using_auto_reply", content: { sender: "A", recipient: "B" } },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText(/sender=A, recipient=B/)).toBeInTheDocument();
        });

        it("should render tool_call events", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "tool_call",
                    content: {
                        sender: "Agent",
                        recipient: "Tool",
                        tool_calls: [{ function: { name: "calc", arguments: '{"x": 5}' } }],
                    },
                },
            ];
            const { container } = render(<EventConsole events={events} />);

            expect(container).toHaveTextContent("Agent");
            expect(container).toHaveTextContent("Tool");
            expect(screen.getByText("Calling: calc")).toBeInTheDocument();
            expect(screen.getByText('args: {"x": 5}')).toBeInTheDocument();
        });

        it("should handle tool calls with no arguments", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "tool_call",
                    content: { sender: "A", recipient: "B", tool_calls: [{ function: { name: "test" } }] },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("args: none")).toBeInTheDocument();
        });

        it("should handle tool calls with empty arguments", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "tool_call",
                    content: {
                        sender: "A",
                        recipient: "B",
                        tool_calls: [{ function: { name: "test", arguments: "{}" } }],
                    },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("args: none")).toBeInTheDocument();
        });

        it("should render execute_function events", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "execute_function",
                    content: { func_name: "test", recipient: "target", arguments: { a: 1 } },
                },
            ];
            render(<EventConsole events={events} />);

            expect(screen.getByText("⚡ Executing: test")).toBeInTheDocument();
            expect(screen.getByText("→ Target: target")).toBeInTheDocument();
            expect(screen.getByText(/→ Args:/)).toBeInTheDocument();
        });

        it("should render executed_function success", () => {
            const events: WaldiezEvent[] = [
                { type: "executed_function", content: { func_name: "test", is_exec_success: true } },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("✅ Success: test")).toBeInTheDocument();
        });

        it("should render executed_function failure", () => {
            const events: WaldiezEvent[] = [
                { type: "executed_function", content: { func_name: "test", is_exec_success: false } },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("❌ Failed: test")).toBeInTheDocument();
        });

        it("should render executed_function with transfer", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "executed_function",
                    content: {
                        func_name: "transfer",
                        is_exec_success: true,
                        content: { agent_name: "Agent" },
                    },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("→ Transferred to: Agent")).toBeInTheDocument();
        });

        it("should render input_request events", () => {
            const events: WaldiezEvent[] = [{ type: "input_request", content: { prompt: "Enter name:" } }];
            render(<EventConsole events={events} />);

            expect(screen.getByText("👤 Provide your input:")).toBeInTheDocument();
            expect(screen.getByText("Enter name:")).toBeInTheDocument();
        });

        it("should render tool_response events", () => {
            const events: WaldiezEvent[] = [
                { type: "tool_response", content: { content: "Result", sender: "A", recipient: "B" } },
            ];
            render(<EventConsole events={events} />);

            expect(screen.getByText("🔄 Tool Response:")).toBeInTheDocument();
            expect(screen.getByText("Result")).toBeInTheDocument();
            expect(screen.getByText("→ From: A to B")).toBeInTheDocument();
        });

        it("should render termination events", () => {
            const events: WaldiezEvent[] = [{ type: "termination", content: { termination_reason: "Done" } }];
            render(<EventConsole events={events} />);

            expect(screen.getByText("Termination met")).toBeInTheDocument();
            expect(screen.getByText("→ Termination_reason: Done")).toBeInTheDocument();
        });

        it("should render termination events without reason", () => {
            const events: WaldiezEvent[] = [{ type: "termination", content: {} }];
            render(<EventConsole events={events} />);
            expect(screen.getByText("Termination met")).toBeInTheDocument();
            expect(screen.queryByText(/→ Termination_reason:/)).not.toBeInTheDocument();
        });

        it("should render simple events", () => {
            const events: WaldiezEvent[] = [
                { type: "run_completion", content: {} },
                { type: "generate_code_execution_reply", content: {} },
                { type: "group_chat_resume", content: {} },
            ];
            render(<EventConsole events={events} />);

            expect(screen.getByText("🏁 Run completed")).toBeInTheDocument();
            expect(screen.getByText("💻 Code executed")).toBeInTheDocument();
            expect(screen.getByText("⏳")).toBeInTheDocument();
        });

        it("should render info and error events", () => {
            const events: WaldiezEvent[] = [
                { type: "info", content: "Info message" },
                { type: "error", content: "Error message" },
            ];
            render(<EventConsole events={events} />);

            expect(screen.getByText("Info message")).toBeInTheDocument();
            expect(screen.getByText("Error message")).toBeInTheDocument();
        });

        it("should handle error events with error property", () => {
            const events: WaldiezEvent[] = [{ type: "error", content: null, error: "Network error" } as any];
            render(<EventConsole events={events} />);
            expect(screen.getByText("Network error")).toBeInTheDocument();
        });

        it("should render unknown event types", () => {
            const events: WaldiezEvent[] = [{ type: "unknown_type", content: {} } as any];
            render(<EventConsole events={events} />);
            expect(screen.getByText("⚠️ Unknown event type:")).toBeInTheDocument();
            expect(screen.getByText("unknown_type")).toBeInTheDocument();
        });

        it("should handle nested events", () => {
            const events: WaldiezEvent[] = [
                {
                    event: { type: "text", content: { sender: "A", recipient: "B", content: "nested" } },
                } as any,
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("nested")).toBeInTheDocument();
        });
    });

    describe("formatArgs utility", () => {
        it("should handle null arguments", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "execute_function",
                    content: { func_name: "test", recipient: "target", arguments: null },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("→ Args: none")).toBeInTheDocument();
        });

        it("should handle string arguments", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "execute_function",
                    content: { func_name: "test", recipient: "target", arguments: "string arg" },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("→ Args: string arg")).toBeInTheDocument();
        });

        it("should handle object arguments", () => {
            const events: WaldiezEvent[] = [
                {
                    type: "execute_function",
                    content: { func_name: "test", recipient: "target", arguments: { key: "value" } },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText(/→ Args:.*"key":"value"/)).toBeInTheDocument();
        });

        it("should handle circular references", () => {
            const circular: any = {};
            circular.self = circular;
            const events: WaldiezEvent[] = [
                {
                    type: "execute_function",
                    content: { func_name: "test", recipient: "target", arguments: circular },
                },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("→ Args: [object Object]")).toBeInTheDocument();
        });
    });

    describe("edge cases", () => {
        it("should handle empty events array", () => {
            const { container } = render(<EventConsole events={[]} />);
            const eventsContainer = container.querySelector(".flex-1");
            expect(eventsContainer?.children).toHaveLength(0);
        });

        it("should handle events with missing type", () => {
            const events = [{ content: {} }] as any;
            render(<EventConsole events={events} />);
            expect(screen.getByText("⚠️ Unknown event type:")).toBeInTheDocument();
        });

        it("should use event ID as key when available", () => {
            const events: WaldiezEvent[] = [
                { id: "test-id", type: "text", content: { sender: "A", recipient: "B", content: "test" } },
            ];
            render(<EventConsole events={events} />);
            expect(screen.getByText("test")).toBeInTheDocument();
        });
    });
});
