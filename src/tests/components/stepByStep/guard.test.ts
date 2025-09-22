/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines, max-lines-per-function */
import { describe, expect, it } from "vitest";

import {
    isDebugBreakpointAdded,
    isDebugBreakpointCleared,
    isDebugBreakpointRemoved,
    isDebugBreakpointsList,
    isDebugError,
    isDebugEventInfo,
    isDebugHelp,
    isDebugInputRequest,
    isDebugStats,
} from "@waldiez/components/stepByStep";
import type {
    WaldiezDebugBreakpointAdded,
    WaldiezDebugBreakpointCleared,
    WaldiezDebugBreakpointRemoved,
    WaldiezDebugBreakpointsList,
    WaldiezDebugError,
    WaldiezDebugEventInfo,
    WaldiezDebugHelpMessage,
    WaldiezDebugInputRequest,
    WaldiezDebugMessage,
    WaldiezDebugStats,
    WaldiezDebugStatsMessage,
} from "@waldiez/components/stepByStep/types";

describe("Step-by-step type guards", () => {
    describe("isDebugInputRequest", () => {
        it("should return true for valid debug_input_request message", () => {
            const message: WaldiezDebugInputRequest = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: "Enter command:",
            };

            expect(isDebugInputRequest(message)).toBe(true);
        });

        it("should return true for valid input_request message (alternative type)", () => {
            const message = {
                type: "debug_input_request",
                request_id: "req-456",
                prompt: "[Step] (c)ontinue, (s)tep, (q)uit:",
            } as WaldiezDebugMessage;

            expect(isDebugInputRequest(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_print",
                request_id: "req-123",
                prompt: "Enter command:",
            } as unknown as WaldiezDebugMessage;

            expect(isDebugInputRequest(message)).toBe(false);
        });

        it("should return false for message without request_id", () => {
            const message = {
                type: "debug_input_request",
                prompt: "Enter command:",
            } as WaldiezDebugMessage;

            expect(isDebugInputRequest(message)).toBe(false);
        });

        it("should return false for message without prompt", () => {
            const message = {
                type: "debug_input_request",
                request_id: "req-123",
            } as WaldiezDebugMessage;

            expect(isDebugInputRequest(message)).toBe(false);
        });

        it("should return false for message with non-string request_id", () => {
            const message = {
                type: "debug_input_request",
                request_id: 123,
                prompt: "Enter command:",
            } as any;

            expect(isDebugInputRequest(message)).toBe(false);
        });

        it("should return false for message with non-string prompt", () => {
            const message = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: 123,
            } as any;

            expect(isDebugInputRequest(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugInputRequest(null as any)).toBe(false);
            expect(isDebugInputRequest(undefined as any)).toBe(false);
        });

        it("should handle empty strings", () => {
            const message = {
                type: "debug_input_request",
                request_id: "",
                prompt: "",
            } as WaldiezDebugMessage;

            expect(isDebugInputRequest(message)).toBe(true);
        });
    });

    describe("isDebugEventInfo", () => {
        it("should return true for valid debug_event_info message", () => {
            const message: WaldiezDebugEventInfo = {
                type: "debug_event_info",
                event: { type: "message", sender: "user", content: "Hello" },
            };

            expect(isDebugEventInfo(message)).toBe(true);
        });

        it("should return true for message with complex event object", () => {
            const message: WaldiezDebugEventInfo = {
                type: "debug_event_info",
                event: {
                    type: "tool_call",
                    sender: "assistant",
                    recipient: "tool",
                    metadata: {
                        function: "search",
                        args: { query: "test" },
                    },
                    nested: {
                        deeply: {
                            value: "complex",
                        },
                    },
                },
            };

            expect(isDebugEventInfo(message)).toBe(true);
        });

        it("should return true for message with empty event object", () => {
            const message: WaldiezDebugEventInfo = {
                type: "debug_event_info",
                event: {},
            };

            expect(isDebugEventInfo(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_print",
                event: { type: "message" },
            } as unknown as WaldiezDebugMessage;

            expect(isDebugEventInfo(message)).toBe(false);
        });

        it("should return false for message without event", () => {
            const message = {
                type: "debug_event_info",
            } as WaldiezDebugMessage;

            expect(isDebugEventInfo(message)).toBe(false);
        });

        it("should return false for message with non-object event", () => {
            const message = {
                type: "debug_event_info",
                event: "not an object",
            } as any;

            expect(isDebugEventInfo(message)).toBe(false);
        });

        it("should return false for message with null event", () => {
            const message = {
                type: "debug_event_info",
                event: null,
            } as any;

            expect(isDebugEventInfo(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugEventInfo(null as any)).toBe(false);
            expect(isDebugEventInfo(undefined as any)).toBe(false);
        });
    });

    describe("isDebugStats", () => {
        it("should return true for valid debug_stats message", () => {
            const message: WaldiezDebugStatsMessage = {
                type: "debug_stats",
                stats: {
                    events_processed: 10,
                    total_events: 20,
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: ["message", "tool_call"],
                    event_history_count: 5,
                },
            };

            expect(isDebugStats(message)).toBe(true);
        });

        it("should return true for message with additional stats properties", () => {
            const message: WaldiezDebugStatsMessage = {
                type: "debug_stats",
                stats: {
                    events_processed: 15,
                    total_events: 25,
                    step_mode: false,
                    auto_continue: true,
                    breakpoints: [],
                    event_history_count: 0,
                    custom_property: "custom_value",
                    nested: { data: "value" },
                },
            };

            expect(isDebugStats(message)).toBe(true);
        });

        it("should return true for message with empty stats object", () => {
            const message: WaldiezDebugStatsMessage = {
                type: "debug_stats",
                stats: {} as unknown as WaldiezDebugStats,
            };

            expect(isDebugStats(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_error",
                stats: { events_processed: 10 },
            } as unknown as WaldiezDebugMessage;

            expect(isDebugStats(message)).toBe(false);
        });

        it("should return false for message without stats", () => {
            const message = {
                type: "debug_stats",
            } as WaldiezDebugMessage;

            expect(isDebugStats(message)).toBe(false);
        });

        it("should return false for message with non-object stats", () => {
            const message = {
                type: "debug_stats",
                stats: "not an object",
            } as any;

            expect(isDebugStats(message)).toBe(false);
        });

        it("should return false for message with null stats", () => {
            const message = {
                type: "debug_stats",
                stats: null,
            } as any;

            expect(isDebugStats(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugStats(null as any)).toBe(false);
            expect(isDebugStats(undefined as any)).toBe(false);
        });
    });

    describe("isDebugHelp", () => {
        it("should return true for valid debug_help message", () => {
            const message: WaldiezDebugHelpMessage = {
                type: "debug_help",
                help: [
                    {
                        title: "Basic Commands",
                        commands: [
                            { cmds: ["continue", "c"], desc: "Continue execution" },
                            { cmds: ["step", "s"], desc: "Step one event" },
                        ],
                    },
                ],
            };

            expect(isDebugHelp(message)).toBe(true);
        });

        it("should return true for message with empty help array", () => {
            const message: WaldiezDebugHelpMessage = {
                type: "debug_help",
                help: [],
            };

            expect(isDebugHelp(message)).toBe(true);
        });

        it("should return true for message with complex help structure", () => {
            const message: WaldiezDebugHelpMessage = {
                type: "debug_help",
                help: [
                    {
                        title: "Navigation",
                        commands: [
                            { desc: "Continue execution" },
                            { cmds: ["quit", "q", "exit"], desc: "Quit the debugger" },
                        ],
                    },
                    {
                        title: "Breakpoints",
                        commands: [
                            { cmds: ["add_breakpoint", "ab"], desc: "Add a breakpoint" },
                            { cmds: ["list_breakpoints", "lb"], desc: "List all breakpoints" },
                        ],
                    },
                ],
            };

            expect(isDebugHelp(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_error",
                help: [],
            } as unknown as WaldiezDebugMessage;

            expect(isDebugHelp(message)).toBe(false);
        });

        it("should return false for message without help", () => {
            const message = {
                type: "debug_help",
            } as WaldiezDebugMessage;

            expect(isDebugHelp(message)).toBe(false);
        });

        it("should return false for message with non-array help", () => {
            const message = {
                type: "debug_help",
                help: "not an array",
            } as any;

            expect(isDebugHelp(message)).toBe(false);
        });

        it("should return false for message with null help", () => {
            const message = {
                type: "debug_help",
                help: null,
            } as any;

            expect(isDebugHelp(message)).toBe(false);
        });

        it("should return false for message with object help", () => {
            const message = {
                type: "debug_help",
                help: { title: "Help" },
            } as any;

            expect(isDebugHelp(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugHelp(null as any)).toBe(false);
            expect(isDebugHelp(undefined as any)).toBe(false);
        });
    });

    describe("isDebugError", () => {
        it("should return true for valid debug_error message", () => {
            const message: WaldiezDebugError = {
                type: "debug_error",
                error: "Something went wrong",
            };

            expect(isDebugError(message)).toBe(true);
        });

        it("should return true for message with empty error string", () => {
            const message: WaldiezDebugError = {
                type: "debug_error",
                error: "",
            };

            expect(isDebugError(message)).toBe(true);
        });

        it("should return true for message with multiline error", () => {
            const message: WaldiezDebugError = {
                type: "debug_error",
                error: "Error occurred:\n  at line 1\n  at line 2",
            };

            expect(isDebugError(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_print",
                error: "Error message",
            } as unknown as WaldiezDebugMessage;

            expect(isDebugError(message)).toBe(false);
        });

        it("should return false for message without error", () => {
            const message = {
                type: "debug_error",
            } as WaldiezDebugMessage;

            expect(isDebugError(message)).toBe(false);
        });

        it("should return false for message with non-string error", () => {
            const message = {
                type: "debug_error",
                error: 123,
            } as any;

            expect(isDebugError(message)).toBe(false);
        });

        it("should return false for message with null error", () => {
            const message = {
                type: "debug_error",
                error: null,
            } as any;

            expect(isDebugError(message)).toBe(false);
        });

        it("should return false for message with object error", () => {
            const message = {
                type: "debug_error",
                error: { message: "Error" },
            } as any;

            expect(isDebugError(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugError(null as any)).toBe(false);
            expect(isDebugError(undefined as any)).toBe(false);
        });
    });

    describe("isDebugBreakpointsList", () => {
        it("should return true for valid debug_breakpoints_list message", () => {
            const message: WaldiezDebugBreakpointsList = {
                type: "debug_breakpoints_list",
                breakpoints: ["message", "tool_call", "error"],
            };

            expect(isDebugBreakpointsList(message)).toBe(true);
        });

        it("should return true for message with empty breakpoints array", () => {
            const message: WaldiezDebugBreakpointsList = {
                type: "debug_breakpoints_list",
                breakpoints: [],
            };

            expect(isDebugBreakpointsList(message)).toBe(true);
        });

        it("should return true for message with mixed breakpoint types", () => {
            const message: WaldiezDebugBreakpointsList = {
                type: "debug_breakpoints_list",
                breakpoints: [
                    "message",
                    { type: "event", event_type: "tool_call" },
                    { type: "agent", agent_name: "user" },
                    "error",
                ],
            };

            expect(isDebugBreakpointsList(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_breakpoint_added",
                breakpoints: ["message"],
            } as unknown as WaldiezDebugMessage;

            expect(isDebugBreakpointsList(message)).toBe(false);
        });

        it("should return false for message without breakpoints", () => {
            const message = {
                type: "debug_breakpoints_list",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointsList(message)).toBe(false);
        });

        it("should return false for message with non-array breakpoints", () => {
            const message = {
                type: "debug_breakpoints_list",
                breakpoints: "not an array",
            } as any;

            expect(isDebugBreakpointsList(message)).toBe(false);
        });

        it("should return false for message with null breakpoints", () => {
            const message = {
                type: "debug_breakpoints_list",
                breakpoints: null,
            } as any;

            expect(isDebugBreakpointsList(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugBreakpointsList(null as any)).toBe(false);
            expect(isDebugBreakpointsList(undefined as any)).toBe(false);
        });
    });

    describe("isDebugBreakpointAdded", () => {
        it("should return true for valid debug_breakpoint_added message with string breakpoint", () => {
            const message: WaldiezDebugBreakpointAdded = {
                type: "debug_breakpoint_added",
                breakpoint: "message",
            };

            expect(isDebugBreakpointAdded(message)).toBe(true);
        });

        it("should return true for valid debug_breakpoint_added message with object breakpoint", () => {
            const message: WaldiezDebugBreakpointAdded = {
                type: "debug_breakpoint_added",
                breakpoint: { type: "event", event_type: "tool_call" },
            };

            expect(isDebugBreakpointAdded(message)).toBe(true);
        });

        it("should return true for message with complex breakpoint object", () => {
            const message: WaldiezDebugBreakpointAdded = {
                type: "debug_breakpoint_added",
                breakpoint: {
                    type: "agent_event",
                    agent_name: "user",
                    event_type: "message",
                    description: "User messages",
                },
            };

            expect(isDebugBreakpointAdded(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_breakpoint_removed",
                breakpoint: "message",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointAdded(message)).toBe(false);
        });

        it("should return false for message without breakpoint", () => {
            const message = {
                type: "debug_breakpoint_added",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointAdded(message)).toBe(false);
        });

        it("should return false for message with null breakpoint", () => {
            const message = {
                type: "debug_breakpoint_added",
                breakpoint: null,
            } as any;

            expect(isDebugBreakpointAdded(message)).toBe(false);
        });

        it("should return false for message with number breakpoint", () => {
            const message = {
                type: "debug_breakpoint_added",
                breakpoint: 123,
            } as any;

            expect(isDebugBreakpointAdded(message)).toBe(false);
        });

        it("should return false for message with boolean breakpoint", () => {
            const message = {
                type: "debug_breakpoint_added",
                breakpoint: true,
            } as any;

            expect(isDebugBreakpointAdded(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugBreakpointAdded(null as any)).toBe(false);
            expect(isDebugBreakpointAdded(undefined as any)).toBe(false);
        });
    });

    describe("isDebugBreakpointRemoved", () => {
        it("should return true for valid debug_breakpoint_removed message with string breakpoint", () => {
            const message: WaldiezDebugBreakpointRemoved = {
                type: "debug_breakpoint_removed",
                breakpoint: "tool_call",
            };

            expect(isDebugBreakpointRemoved(message)).toBe(true);
        });

        it("should return true for valid debug_breakpoint_removed message with object breakpoint", () => {
            const message: WaldiezDebugBreakpointRemoved = {
                type: "debug_breakpoint_removed",
                breakpoint: { type: "agent", agent_name: "assistant" },
            };

            expect(isDebugBreakpointRemoved(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_breakpoint_added",
                breakpoint: "message",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointRemoved(message)).toBe(false);
        });

        it("should return false for message without breakpoint", () => {
            const message = {
                type: "debug_breakpoint_removed",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointRemoved(message)).toBe(false);
        });

        it("should return false for message with null breakpoint", () => {
            const message = {
                type: "debug_breakpoint_removed",
                breakpoint: null,
            } as any;

            expect(isDebugBreakpointRemoved(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugBreakpointRemoved(null as any)).toBe(false);
            expect(isDebugBreakpointRemoved(undefined as any)).toBe(false);
        });
    });

    describe("isDebugBreakpointCleared", () => {
        it("should return true for valid debug_breakpoint_cleared message", () => {
            const message: WaldiezDebugBreakpointCleared = {
                type: "debug_breakpoint_cleared",
                message: "All breakpoints have been cleared",
            };

            expect(isDebugBreakpointCleared(message)).toBe(true);
        });

        it("should return true for message with empty message string", () => {
            const message: WaldiezDebugBreakpointCleared = {
                type: "debug_breakpoint_cleared",
                message: "",
            };

            expect(isDebugBreakpointCleared(message)).toBe(true);
        });

        it("should return false for message with wrong type", () => {
            const message = {
                type: "debug_breakpoint_added",
                message: "All breakpoints cleared",
            } as unknown as WaldiezDebugMessage;

            expect(isDebugBreakpointCleared(message)).toBe(false);
        });

        it("should return false for message without message property", () => {
            const message = {
                type: "debug_breakpoint_cleared",
            } as WaldiezDebugMessage;

            expect(isDebugBreakpointCleared(message)).toBe(false);
        });

        it("should return false for message with non-string message", () => {
            const message = {
                type: "debug_breakpoint_cleared",
                message: 123,
            } as any;

            expect(isDebugBreakpointCleared(message)).toBe(false);
        });

        it("should return false for message with null message", () => {
            const message = {
                type: "debug_breakpoint_cleared",
                message: null,
            } as any;

            expect(isDebugBreakpointCleared(message)).toBe(false);
        });

        it("should return false for message with object message", () => {
            const message = {
                type: "debug_breakpoint_cleared",
                message: { text: "Cleared" },
            } as any;

            expect(isDebugBreakpointCleared(message)).toBe(false);
        });

        it("should return false for null or undefined message", () => {
            expect(isDebugBreakpointCleared(null as any)).toBe(false);
            expect(isDebugBreakpointCleared(undefined as any)).toBe(false);
        });
    });

    describe("edge cases", () => {
        it("should handle messages with extra properties", () => {
            const message = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: "Enter command:",
                extraProperty: "extra value",
                nested: { data: "value" },
            } as any;

            expect(isDebugInputRequest(message)).toBe(true);
        });

        it("should handle messages with missing optional properties", () => {
            const helpMessage = {
                type: "debug_help",
                help: [
                    {
                        title: "Commands",
                        commands: [{ desc: "No cmds property" }],
                    },
                ],
            } as WaldiezDebugMessage;

            expect(isDebugHelp(helpMessage)).toBe(true);
        });

        it("should be strict about required properties", () => {
            const incompleteMessage = {
                type: "debug_input_request",
                request_id: "req-123",
                // Missing prompt
                extraData: "should not matter",
            } as any;

            expect(isDebugInputRequest(incompleteMessage)).toBe(false);
        });

        it("should handle circular references safely", () => {
            const message: any = {
                type: "debug_event_info",
                event: {},
            };
            message.event.circular = message.event;

            expect(isDebugEventInfo(message)).toBe(true);
        });

        it("should handle very large objects", () => {
            const largeEvent = {
                type: "debug_event_info",
                event: {} as any,
            } as WaldiezDebugEventInfo;

            // Create a large object
            for (let i = 0; i < 1000; i++) {
                largeEvent.event[`prop${i}`] = `value${i}`;
            }

            expect(isDebugEventInfo(largeEvent)).toBe(true);
        });
    });
});
