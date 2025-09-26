/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-lines, max-lines-per-function */
import { describe, expect, it } from "vitest";

import type { WaldiezBreakpoint } from "@waldiez/components/types";
import { WaldiezBreakpointUtils } from "@waldiez/utils/stepByStep/breakpointUtils";

describe("WaldiezBreakpointUtils", () => {
    describe("fromString", () => {
        it("should parse 'all' breakpoint", () => {
            const result = WaldiezBreakpointUtils.fromString("all");

            expect(result).toEqual({
                type: "all",
            });
        });

        it("should parse event breakpoint with 'event:' prefix", () => {
            const result = WaldiezBreakpointUtils.fromString("event:message");

            expect(result).toEqual({
                type: "event",
                event_type: "message",
            });
        });

        it("should parse agent breakpoint with 'agent:' prefix", () => {
            const result = WaldiezBreakpointUtils.fromString("agent:user");

            expect(result).toEqual({
                type: "agent",
                agent: "user",
            });
        });

        it("should parse agent_event breakpoint with 'agent:event' format", () => {
            const result = WaldiezBreakpointUtils.fromString("user:message");

            expect(result).toEqual({
                type: "agent_event",
                agent: "user",
                event_type: "message",
            });
        });

        it("should handle empty event type with 'event:' prefix", () => {
            const result = WaldiezBreakpointUtils.fromString("event:");

            expect(result).toEqual({
                type: "event",
                event_type: "",
            });
        });

        it("should handle empty agent name with 'agent:' prefix", () => {
            const result = WaldiezBreakpointUtils.fromString("agent:");

            expect(result).toEqual({
                type: "agent",
                agent: "",
            });
        });

        it("should handle empty parts in 'agent:event' format", () => {
            const result1 = WaldiezBreakpointUtils.fromString(":message");
            expect(result1).toEqual({
                type: "agent_event",
                agent: "",
                event_type: "message",
            });

            const result2 = WaldiezBreakpointUtils.fromString("user:");
            expect(result2).toEqual({
                type: "agent_event",
                agent: "user",
                event_type: "",
            });

            const result3 = WaldiezBreakpointUtils.fromString(":");
            expect(result3).toEqual({
                type: "agent_event",
                agent: "",
                event_type: "",
            });
        });

        it("should default to event type for backward compatibility", () => {
            const result = WaldiezBreakpointUtils.fromString("message");

            expect(result).toEqual({
                type: "event",
                event_type: "message",
            });
        });

        it("should handle complex agent:event format with multiple colons", () => {
            const result = WaldiezBreakpointUtils.fromString("user:message:extra");

            expect(result).toEqual({
                type: "agent_event",
                agent: "user",
                event_type: "message",
            });
        });

        it("should not confuse prefixed strings with agent:event format", () => {
            const result1 = WaldiezBreakpointUtils.fromString("event:user:message");
            expect(result1).toEqual({
                type: "event",
                event_type: "user:message",
            });

            const result2 = WaldiezBreakpointUtils.fromString("agent:user:message");
            expect(result2).toEqual({
                type: "agent",
                agent: "user:message",
            });
        });

        it("should handle edge cases", () => {
            expect(WaldiezBreakpointUtils.fromString("")).toEqual({
                type: "event",
                event_type: "",
            });

            expect(WaldiezBreakpointUtils.fromString("event")).toEqual({
                type: "event",
                event_type: "event",
            });

            expect(WaldiezBreakpointUtils.fromString("agent")).toEqual({
                type: "event",
                event_type: "agent",
            });
        });
    });

    describe("toString", () => {
        it("should convert 'all' breakpoint to string", () => {
            const breakpoint: WaldiezBreakpoint = { type: "all" };

            const result = WaldiezBreakpointUtils.toString(breakpoint);

            expect(result).toBe("all");
        });

        it("should convert event breakpoint to string", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "event",
                event_type: "message",
            };

            const result = WaldiezBreakpointUtils.toString(breakpoint);

            expect(result).toBe("event:message");
        });

        it("should convert agent breakpoint to string", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "agent",
                agent: "user",
            };

            const result = WaldiezBreakpointUtils.toString(breakpoint);

            expect(result).toBe("agent:user");
        });

        it("should convert agent_event breakpoint to string", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "agent_event",
                agent: "user",
                event_type: "message",
            };

            const result = WaldiezBreakpointUtils.toString(breakpoint);

            expect(result).toBe("user:message");
        });

        it("should handle undefined properties", () => {
            const eventBreakpoint: WaldiezBreakpoint = {
                type: "event",
                event_type: undefined,
            };
            expect(WaldiezBreakpointUtils.toString(eventBreakpoint)).toBe("event:undefined");

            const agentBreakpoint: WaldiezBreakpoint = {
                type: "agent",
                agent: undefined,
            };
            expect(WaldiezBreakpointUtils.toString(agentBreakpoint)).toBe("agent:undefined");

            const agentEventBreakpoint: WaldiezBreakpoint = {
                type: "agent_event",
                agent: undefined,
                event_type: undefined,
            };
            expect(WaldiezBreakpointUtils.toString(agentEventBreakpoint)).toBe("undefined:undefined");
        });

        it("should handle empty string properties", () => {
            const eventBreakpoint: WaldiezBreakpoint = {
                type: "event",
                event_type: "",
            };
            expect(WaldiezBreakpointUtils.toString(eventBreakpoint)).toBe("event:");

            const agentBreakpoint: WaldiezBreakpoint = {
                type: "agent",
                agent: "",
            };
            expect(WaldiezBreakpointUtils.toString(agentBreakpoint)).toBe("agent:");

            const agentEventBreakpoint: WaldiezBreakpoint = {
                type: "agent_event",
                agent: "",
                event_type: "",
            };
            expect(WaldiezBreakpointUtils.toString(agentEventBreakpoint)).toBe(":");
        });

        it("should default to 'all' for unknown type", () => {
            const breakpoint = { type: "unknown" } as any;

            const result = WaldiezBreakpointUtils.toString(breakpoint);

            expect(result).toBe("all");
        });
    });

    describe("matches", () => {
        describe("'all' breakpoint type", () => {
            it("should match any event", () => {
                const breakpoint: WaldiezBreakpoint = { type: "all" };
                const event1 = { type: "message", sender: "user", recipient: "assistant" };
                const event2 = { type: "tool_call", sender: "assistant" };
                const event3 = { some: "other", data: true };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event1)).toBe(true);
                expect(WaldiezBreakpointUtils.matches(breakpoint, event2)).toBe(true);
                expect(WaldiezBreakpointUtils.matches(breakpoint, event3)).toBe(true);
            });

            it("should match empty event", () => {
                const breakpoint: WaldiezBreakpoint = { type: "all" };
                const event = {};

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });
        });

        describe("'event' breakpoint type", () => {
            it("should match event with same type", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: "message",
                };
                const event = { type: "message", content: "hello" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should not match event with different type", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: "message",
                };
                const event = { type: "tool_call", content: "hello" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should not match event without type", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: "message",
                };
                const event = { content: "hello" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should handle empty event_type", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: "",
                };
                const event = { type: "" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should handle undefined event_type", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: undefined,
                };
                const event = { type: undefined };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });
        });

        describe("'agent' breakpoint type", () => {
            it("should match event where agent is sender", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "user",
                };
                const event = { sender: "user", recipient: "assistant" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should match event where agent is recipient", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "assistant",
                };
                const event = { sender: "user", recipient: "assistant" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should match when agent is both sender and recipient", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "user",
                };
                const event = { sender: "user", recipient: "user" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should not match when agent is neither sender nor recipient", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "other",
                };
                const event = { sender: "user", recipient: "assistant" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should not match event without sender or recipient", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "user",
                };
                const event = { type: "message" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should handle empty agent", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "",
                };
                const event = { sender: "", recipient: "assistant" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should handle undefined agent", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: undefined,
                };
                const event = { sender: undefined, recipient: "assistant" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });
        });

        describe("'agent_event' breakpoint type", () => {
            it("should match when both agent and event type match", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "user",
                    event_type: "message",
                };
                const event = {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should match when agent is recipient and event type matches", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "assistant",
                    event_type: "message",
                };
                const event = {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should not match when agent matches but event type differs", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "user",
                    event_type: "message",
                };
                const event = {
                    type: "tool_call",
                    sender: "user",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should not match when event type matches but agent differs", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "other",
                    event_type: "message",
                };
                const event = {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should not match when neither agent nor event type match", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "other",
                    event_type: "tool_call",
                };
                const event = {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should handle empty properties", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: "",
                    event_type: "",
                };
                const event = {
                    type: "",
                    sender: "",
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });

            it("should handle undefined properties", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent_event",
                    agent: undefined,
                    event_type: undefined,
                };
                const event = {
                    type: undefined,
                    sender: undefined,
                    recipient: "assistant",
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });
        });

        describe("unknown breakpoint type", () => {
            it("should return false for unknown breakpoint type", () => {
                const breakpoint = { type: "unknown" } as any;
                const event = { type: "message", sender: "user" };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });
        });

        describe("edge cases", () => {
            it("should handle event with non-string properties", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "agent",
                    agent: "user",
                };
                const event = { sender: 123, recipient: null };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(false);
            });

            it("should handle event with complex nested data", () => {
                const breakpoint: WaldiezBreakpoint = {
                    type: "event",
                    event_type: "complex",
                };
                const event = {
                    type: "complex",
                    nested: {
                        data: {
                            deep: "value",
                        },
                    },
                    arrays: [1, 2, 3],
                };

                expect(WaldiezBreakpointUtils.matches(breakpoint, event)).toBe(true);
            });
        });
    });

    describe("normalize", () => {
        it("should return breakpoint object as-is", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "event",
                event_type: "message",
            };

            const result = WaldiezBreakpointUtils.normalize(breakpoint);

            expect(result).toBe(breakpoint);
            expect(result).toEqual({
                type: "event",
                event_type: "message",
            });
        });

        it("should convert string to breakpoint object", () => {
            const result = WaldiezBreakpointUtils.normalize("event:message");

            expect(result).toEqual({
                type: "event",
                event_type: "message",
            });
        });

        it("should handle all string formats", () => {
            expect(WaldiezBreakpointUtils.normalize("all")).toEqual({
                type: "all",
            });

            expect(WaldiezBreakpointUtils.normalize("agent:user")).toEqual({
                type: "agent",
                agent: "user",
            });

            expect(WaldiezBreakpointUtils.normalize("user:message")).toEqual({
                type: "agent_event",
                agent: "user",
                event_type: "message",
            });

            expect(WaldiezBreakpointUtils.normalize("message")).toEqual({
                type: "event",
                event_type: "message",
            });
        });

        it("should handle complex breakpoint objects", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "agent_event",
                agent: "user",
                event_type: "message",
                description: "Custom description",
            };

            const result = WaldiezBreakpointUtils.normalize(breakpoint);

            expect(result).toBe(breakpoint);
            expect(result).toEqual(breakpoint);
        });
    });

    describe("getDisplayName", () => {
        it("should return display name for 'all' breakpoint", () => {
            const breakpoint: WaldiezBreakpoint = { type: "all" };

            const result = WaldiezBreakpointUtils.getDisplayName(breakpoint);

            expect(result).toBe("All Events");
        });

        it("should return display name for 'event' breakpoint", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "event",
                event_type: "message",
            };

            const result = WaldiezBreakpointUtils.getDisplayName(breakpoint);

            expect(result).toBe("Event: message");
        });

        it("should return display name for 'agent' breakpoint", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "agent",
                agent: "user",
            };

            const result = WaldiezBreakpointUtils.getDisplayName(breakpoint);

            expect(result).toBe("Agent: user");
        });

        it("should return display name for 'agent_event' breakpoint", () => {
            const breakpoint: WaldiezBreakpoint = {
                type: "agent_event",
                agent: "user",
                event_type: "message",
            };

            const result = WaldiezBreakpointUtils.getDisplayName(breakpoint);

            expect(result).toBe("user → message");
        });

        it("should handle undefined properties", () => {
            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "event",
                    event_type: undefined,
                }),
            ).toBe("Event: undefined");

            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "agent",
                    agent: undefined,
                }),
            ).toBe("Agent: undefined");

            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "agent_event",
                    agent: undefined,
                    event_type: undefined,
                }),
            ).toBe("undefined → undefined");
        });

        it("should handle empty string properties", () => {
            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "event",
                    event_type: "",
                }),
            ).toBe("Event: ");

            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "agent",
                    agent: "",
                }),
            ).toBe("Agent: ");

            expect(
                WaldiezBreakpointUtils.getDisplayName({
                    type: "agent_event",
                    agent: "",
                    event_type: "",
                }),
            ).toBe(" → ");
        });

        it("should return 'Unknown' for unknown breakpoint type", () => {
            const breakpoint = { type: "unknown" } as any;

            const result = WaldiezBreakpointUtils.getDisplayName(breakpoint);

            expect(result).toBe("Unknown");
        });
    });
});
