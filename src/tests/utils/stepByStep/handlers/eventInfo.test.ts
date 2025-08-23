/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugEventInfoHandler } from "@waldiez/utils/stepByStep/handlers";

describe("DebugEventInfoHandler", () => {
    let handler: DebugEventInfoHandler;

    beforeEach(() => {
        handler = new DebugEventInfoHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_event_info type", () => {
            expect(handler.canHandle("debug_event_info")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid debug_event_info message", () => {
            const data = {
                type: "debug_event_info",
                event: {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                    content: "Hello, how are you?",
                },
                metadata: {
                    timestamp: "2024-01-01T10:00:00Z",
                    step: 1,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                currentEvent: {
                    type: "message",
                    sender: "user",
                    recipient: "assistant",
                    content: "Hello, how are you?",
                },
                eventHistory: [
                    {
                        type: "message",
                        sender: "user",
                        recipient: "assistant",
                        content: "Hello, how are you?",
                    },
                ],
            });
            expect(result.controlAction).toEqual({
                type: "scroll_to_latest",
            });
        });

        it("should append to existing event history", () => {
            const existingEvent = {
                type: "greeting",
                sender: "system",
                content: "Welcome",
            };

            const newEvent = {
                type: "message",
                sender: "user",
                content: "Hello",
            };

            const data = {
                type: "debug_event_info",
                event: newEvent,
            };

            const context = {
                currentState: {
                    eventHistory: [existingEvent],
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.stateUpdate).toEqual({
                currentEvent: newEvent,
                eventHistory: [existingEvent, newEvent],
            });
        });

        it("should handle empty event history", () => {
            const event = {
                type: "tool_call",
                sender: "assistant",
                content: "Calling weather API",
            };

            const data = {
                type: "debug_event_info",
                event,
            };

            const context = {
                currentState: {},
            };

            const result = handler.handle(data as any, context);

            expect(result.stateUpdate).toEqual({
                currentEvent: event,
                eventHistory: [event],
            });
        });

        it("should handle context without currentState", () => {
            const event = {
                type: "error",
                content: "Something went wrong",
            };

            const data = {
                type: "debug_event_info",
                event,
            };

            const result = handler.handle(data as any, {});

            expect(result.stateUpdate).toEqual({
                currentEvent: event,
                eventHistory: [event],
            });
        });

        it("should return error for invalid debug_event_info structure", () => {
            const data = {
                type: "debug_event_info",
                // Missing event property
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_event_info structure",
                originalData: data,
            });
        });

        it("should return error for wrong message type", () => {
            const data = {
                type: "debug_print",
                event: { type: "message" },
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_event_info structure",
                originalData: data,
            });
        });

        it("should handle complex event data", () => {
            const event = {
                type: "tool_call",
                sender: "assistant",
                recipient: "tool_executor",
                content: {
                    tool: "weather_api",
                    parameters: {
                        location: "San Francisco",
                        units: "metric",
                    },
                },
                metadata: {
                    tool_id: "weather_123",
                    timeout: 30,
                },
            };

            const data = {
                type: "debug_event_info",
                event,
                metadata: {
                    timestamp: "2024-01-01T10:00:00Z",
                    step: 5,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate?.currentEvent).toBe(event);
            expect(result.stateUpdate?.eventHistory).toEqual([event]);
            expect(result.controlAction).toEqual({
                type: "scroll_to_latest",
            });
        });

        it("should handle null event", () => {
            const data = {
                type: "debug_event_info",
                event: null,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_event_info structure",
                originalData: data,
            });
        });

        it("should handle event with minimal data", () => {
            const event = {
                type: "ping",
            };

            const data = {
                type: "debug_event_info",
                event,
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                currentEvent: event,
                eventHistory: [event],
            });
        });

        it("should maintain order in event history", () => {
            const event1 = { type: "start", content: "Beginning" };
            const event2 = { type: "middle", content: "Processing" };
            const event3 = { type: "end", content: "Complete" };

            const context = {
                currentState: {
                    eventHistory: [event1, event2],
                },
            };

            const data = {
                type: "debug_event_info",
                event: event3,
            };

            const result = handler.handle(data as any, context);

            expect(result.stateUpdate?.eventHistory).toEqual([event1, event2, event3]);
        });
    });
});
