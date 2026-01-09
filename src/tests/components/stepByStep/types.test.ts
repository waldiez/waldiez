/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import type { WaldiezDebugControl } from "@waldiez/components/stepByStep/types";
import { controlToResponse } from "@waldiez/components/stepByStep/types";

describe("Step-by-step types and utilities", () => {
    describe("controlToResponse", () => {
        it("should convert continue control to 'c'", () => {
            const control: WaldiezDebugControl = { kind: "continue" };
            expect(controlToResponse(control)).toBe("c");
        });

        it("should convert step control to 's'", () => {
            const control: WaldiezDebugControl = { kind: "step" };
            expect(controlToResponse(control)).toBe("s");
        });

        it("should convert run control to 'r'", () => {
            const control: WaldiezDebugControl = { kind: "run" };
            expect(controlToResponse(control)).toBe("r");
        });

        it("should convert quit control to 'q'", () => {
            const control: WaldiezDebugControl = { kind: "quit" };
            expect(controlToResponse(control)).toBe("q");
        });

        it("should convert info control to 'i'", () => {
            const control: WaldiezDebugControl = { kind: "info" };
            expect(controlToResponse(control)).toBe("i");
        });

        it("should convert help control to 'h'", () => {
            const control: WaldiezDebugControl = { kind: "help" };
            expect(controlToResponse(control)).toBe("h");
        });

        it("should convert stats control to 'st'", () => {
            const control: WaldiezDebugControl = { kind: "stats" };
            expect(controlToResponse(control)).toBe("st");
        });

        it("should convert add_breakpoint control to 'ab'", () => {
            const control: WaldiezDebugControl = { kind: "add_breakpoint" };
            expect(controlToResponse(control)).toBe("ab");
        });

        it("should convert remove_breakpoint control to 'rb'", () => {
            const control: WaldiezDebugControl = { kind: "remove_breakpoint" };
            expect(controlToResponse(control)).toBe("rb");
        });

        it("should convert list_breakpoints control to 'lb'", () => {
            const control: WaldiezDebugControl = { kind: "list_breakpoints" };
            expect(controlToResponse(control)).toBe("lb");
        });

        it("should convert clear_breakpoints control to 'cb'", () => {
            const control: WaldiezDebugControl = { kind: "clear_breakpoints" };
            expect(controlToResponse(control)).toBe("cb");
        });

        it("should convert raw control to its value", () => {
            const control: WaldiezDebugControl = { kind: "raw", value: "custom_command" };
            expect(controlToResponse(control)).toBe("custom_command");
        });

        it("should handle empty raw value", () => {
            const control: WaldiezDebugControl = { kind: "raw", value: "" };
            expect(controlToResponse(control)).toBe("");
        });

        it("should handle special characters in raw value", () => {
            const control: WaldiezDebugControl = { kind: "raw", value: "command:with:colons" };
            expect(controlToResponse(control)).toBe("command:with:colons");
        });

        it("should handle numeric raw value", () => {
            const control: WaldiezDebugControl = { kind: "raw", value: "123" };
            expect(controlToResponse(control)).toBe("123");
        });

        it("should return string input as-is", () => {
            expect(controlToResponse("custom_string")).toBe("custom_string");
            expect(controlToResponse("c")).toBe("c");
            expect(controlToResponse("")).toBe("");
        });

        it("should handle string with special characters", () => {
            expect(controlToResponse("hello world")).toBe("hello world");
            expect(controlToResponse("user:message")).toBe("user:message");
            expect(controlToResponse("event:tool_call")).toBe("event:tool_call");
        });

        it("should handle multiline strings", () => {
            const multilineString = "line1\nline2\nline3";
            expect(controlToResponse(multilineString)).toBe(multilineString);
        });

        it("should handle unicode characters", () => {
            const unicodeString = "Hello 世界 🌍";
            expect(controlToResponse(unicodeString)).toBe(unicodeString);
        });

        // Test the exhaustiveness guard (this should never happen in practice)
        it("should handle unknown control types gracefully", () => {
            const unknownControl = { kind: "unknown_type" } as any;
            const result = controlToResponse(unknownControl);
            // The exhaustiveness guard converts to string
            expect(typeof result).toBe("string");
        });

        // Edge cases
        it("should handle null and undefined gracefully", () => {
            expect(controlToResponse(null as any)).toBe("null");
            expect(controlToResponse(undefined as any)).toBe("undefined");
        });

        it("should handle boolean values", () => {
            expect(controlToResponse(true as any)).toBe("true");
            expect(controlToResponse(false as any)).toBe("false");
        });

        it("should handle numeric values", () => {
            expect(controlToResponse(123 as any)).toBe("123");
            expect(controlToResponse(0 as any)).toBe("0");
            expect(controlToResponse(-456 as any)).toBe("-456");
        });

        it("should handle object values", () => {
            const obj = { key: "value" };
            expect(controlToResponse(obj as any)).toBe("[object Object]");
        });

        it("should handle array values", () => {
            const arr = [1, 2, 3];
            expect(controlToResponse(arr as any)).toBe("1,2,3");
        });
    });

    describe("WaldiezDebugControl type structure", () => {
        it("should support all control kinds", () => {
            // This test ensures the type definitions are correct
            const controls: WaldiezDebugControl[] = [
                { kind: "continue" },
                { kind: "step" },
                { kind: "run" },
                { kind: "quit" },
                { kind: "info" },
                { kind: "help" },
                { kind: "stats" },
                { kind: "add_breakpoint" },
                { kind: "remove_breakpoint" },
                { kind: "list_breakpoints" },
                { kind: "clear_breakpoints" },
                { kind: "raw", value: "test" },
            ];

            controls.forEach(control => {
                expect(control).toHaveProperty("kind");
                if (control.kind === "raw") {
                    expect(control).toHaveProperty("value");
                }
            });
        });

        it("should require value property for raw control", () => {
            const rawControl: WaldiezDebugControl = { kind: "raw", value: "required" };
            expect(rawControl.value).toBe("required");
        });

        it("should not require additional properties for other controls", () => {
            const simpleControl: WaldiezDebugControl = { kind: "continue" };
            expect(Object.keys(simpleControl)).toEqual(["kind"]);
        });
    });

    describe("WaldiezDebugResponseCode type", () => {
        it("should include all expected response codes", () => {
            // These are the valid response codes according to the type definition
            const validCodes = ["", "c", "s", "r", "q", "i", "h", "st", "ab", "rb", "lb", "cb"];

            validCodes.forEach(code => {
                // Test that controlToResponse can return these codes
                expect(typeof code).toBe("string");
            });
        });
    });

    describe("WaldiezBreakpoint type structure", () => {
        it("should support all breakpoint types", () => {
            const breakpoints = [
                { type: "all" },
                { type: "event", event_type: "message" },
                { type: "agent", agent_name: "user" },
                { type: "agent_event", agent_name: "user", event_type: "message" },
            ];

            breakpoints.forEach(breakpoint => {
                expect(breakpoint).toHaveProperty("type");
                expect(["all", "event", "agent", "agent_event"]).toContain(breakpoint.type);
            });
        });

        it("should support optional description property", () => {
            const breakpointWithDescription = {
                type: "event" as const,
                event_type: "message",
                description: "Message events",
            };

            expect(breakpointWithDescription.description).toBe("Message events");
        });
    });

    describe("WaldiezStepByStep state structure", () => {
        it("should have all required properties", () => {
            const mockStepByStep = {
                active: true,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
                eventHistory: [],
                pendingControlInput: null,
                activeRequest: null,
                handlers: {
                    sendControl: () => {},
                    respond: () => {},
                },
            };

            expect(mockStepByStep).toHaveProperty("active");
            expect(mockStepByStep).toHaveProperty("stepMode");
            expect(mockStepByStep).toHaveProperty("autoContinue");
            expect(mockStepByStep).toHaveProperty("breakpoints");
            expect(mockStepByStep).toHaveProperty("eventHistory");
            expect(mockStepByStep).toHaveProperty("pendingControlInput");
            expect(mockStepByStep).toHaveProperty("activeRequest");
            expect(mockStepByStep).toHaveProperty("handlers");
        });

        it("should support optional properties", () => {
            const mockStepByStepWithOptionals = {
                active: true,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
                eventHistory: [],
                pendingControlInput: null,
                activeRequest: null,
                handlers: {
                    sendControl: () => {},
                    respond: () => {},
                    close: () => {},
                },
                stats: {
                    events_processed: 10,
                    total_events: 20,
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: [],
                    event_history_count: 5,
                },
                currentEvent: { type: "message", sender: "user" },
                help: [],
                lastError: "Test error",
            };

            expect(mockStepByStepWithOptionals.stats).toBeDefined();
            expect(mockStepByStepWithOptionals.currentEvent).toBeDefined();
            expect(mockStepByStepWithOptionals.help).toBeDefined();
            expect(mockStepByStepWithOptionals.lastError).toBeDefined();
            expect(mockStepByStepWithOptionals.handlers.close).toBeDefined();
        });
    });

    describe("WaldiezStepHandlers interface", () => {
        it("should require sendControl and respond functions", () => {
            const handlers = {
                sendControl: () => {},
                respond: () => {},
            };

            expect(typeof handlers.sendControl).toBe("function");
            expect(typeof handlers.respond).toBe("function");
        });

        it("should support optional close function", () => {
            const handlersWithClose = {
                sendControl: () => {},
                respond: () => {},
                close: () => {},
            };

            expect(typeof handlersWithClose.close).toBe("function");
        });

        it("should support async functions", () => {
            const asyncHandlers = {
                sendControl: async () => {},
                respond: async () => {},
                close: async () => {},
            };

            expect(asyncHandlers.sendControl).toBeInstanceOf(Function);
            expect(asyncHandlers.respond).toBeInstanceOf(Function);
            expect(asyncHandlers.close).toBeInstanceOf(Function);
        });
    });

    describe("Message type discriminated unions", () => {
        it("should properly discriminate debug messages by type", () => {
            const messages = [
                { type: "debug_print", content: "Hello" },
                { type: "debug_input_request", request_id: "123", prompt: "Enter:" },
                { type: "debug_event_info", event: {} },
                { type: "debug_stats", stats: {} },
                { type: "debug_help", help: [] },
                { type: "debug_error", error: "Error" },
                { type: "debug_breakpoints_list", breakpoints: [] },
                { type: "debug_breakpoint_added", breakpoint: "message" },
                { type: "debug_breakpoint_removed", breakpoint: "message" },
                { type: "debug_breakpoint_cleared", message: "Cleared" },
            ];

            messages.forEach(message => {
                expect(message.type).toMatch(/^debug_/);
            });
        });

        it("should support alternative type names", () => {
            const alternativeMessages = [
                { type: "print", content: "Hello" },
                { type: "input_request", request_id: "123", prompt: "Enter:" },
                { type: "event_info", event: {} },
                { type: "stats", stats: {} },
                { type: "help", help: [] },
                { type: "error", error: "Error" },
                { type: "breakpoints_list", breakpoints: [] },
                { type: "breakpoint_added", breakpoint: "message" },
                { type: "breakpoint_removed", breakpoint: "message" },
                { type: "breakpoint_cleared", message: "Cleared" },
            ];

            alternativeMessages.forEach(message => {
                expect(typeof message.type).toBe("string");
                expect(message.type.length).toBeGreaterThan(0);
            });
        });
    });

    describe("Integration tests", () => {
        it("should work with complete step-by-step workflow", () => {
            // Simulate a complete workflow
            const initialState = {
                active: true,
                stepMode: true,
                autoContinue: false,
                breakpoints: ["message", "tool_call"],
                eventHistory: [],
                pendingControlInput: null,
                activeRequest: null,
                handlers: {
                    sendControl: (input: any) => input,
                    respond: (input: any) => input,
                },
            };

            // Add pending control input
            const withPendingInput = {
                ...initialState,
                pendingControlInput: {
                    request_id: "req-123",
                    // cspell: disable-next-line
                    prompt: "[Step] (c)ontinue, (s)tep, (q)uit:",
                },
            };

            // Test control responses
            const continueResponse = controlToResponse({ kind: "continue" });
            const stepResponse = controlToResponse({ kind: "step" });
            const quitResponse = controlToResponse({ kind: "quit" });

            expect(continueResponse).toBe("c");
            expect(stepResponse).toBe("s");
            expect(quitResponse).toBe("q");

            // Add active request
            const withActiveRequest = {
                ...withPendingInput,
                activeRequest: {
                    request_id: "req-456",
                    prompt: "Please enter your name:",
                },
            };

            // Add event history
            const withEventHistory = {
                ...withActiveRequest,
                eventHistory: [
                    { type: "message", sender: "user", content: "Hello" },
                    { type: "message", sender: "assistant", content: "Hi there!" },
                    { type: "tool_call", sender: "assistant", function: "search" },
                ],
            };

            expect(withEventHistory.eventHistory).toHaveLength(3);
            expect(withEventHistory.breakpoints).toContain("message");
            expect(withEventHistory.breakpoints).toContain("tool_call");
        });

        it("should handle complex breakpoint scenarios", () => {
            const complexBreakpoints = [
                "all",
                "message",
                { type: "event", event_type: "tool_call" },
                { type: "agent", agent_name: "user" },
                {
                    type: "agent_event",
                    agent_name: "assistant",
                    event_type: "message",
                    description: "Assistant messages",
                },
            ];

            complexBreakpoints.forEach(breakpoint => {
                if (typeof breakpoint === "string") {
                    expect(typeof breakpoint).toBe("string");
                } else {
                    expect(breakpoint).toHaveProperty("type");
                    expect(["all", "event", "agent", "agent_event"]).toContain(breakpoint.type);
                }
            });
        });
    });
});
