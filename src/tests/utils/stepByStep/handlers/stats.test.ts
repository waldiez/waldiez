/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugStatsHandler } from "@waldiez/utils/stepByStep/handlers";

describe("DebugStatsHandler", () => {
    let handler: DebugStatsHandler;

    beforeEach(() => {
        handler = new DebugStatsHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_stats type", () => {
            expect(handler.canHandle("debug_stats")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid debug_stats message with all properties", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: ["message", "tool_call"],
                    current_step: 5,
                    total_steps: 12,
                    execution_time: 45.7,
                    messages_processed: 8,
                    tokens_used: 1250,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: ["message", "tool_call"],
            });
        });

        it("should handle debug_stats with minimal stats", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: false,
                    auto_continue: true,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: false,
                autoContinue: true,
                breakpoints: [],
            });
        });

        it("should handle debug_stats with missing breakpoints", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    current_step: 1,
                    // Missing breakpoints property
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
            });
        });

        it("should handle debug_stats with empty breakpoints", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: true,
                    breakpoints: [],
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: true,
                breakpoints: [],
            });
        });

        it("should handle debug_stats with detailed execution stats", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: false,
                    auto_continue: false,
                    breakpoints: ["error", "termination"],
                    current_step: 15,
                    total_steps: 20,
                    execution_time: 127.3,
                    messages_processed: 42,
                    tokens_used: 5672,
                    cost: 0.075,
                    agents_active: 3,
                    last_event_type: "message",
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: false,
                autoContinue: false,
                breakpoints: ["error", "termination"],
            });
        });

        it("should return error for invalid debug_stats structure", () => {
            const data = {
                type: "debug_stats",
                // Missing stats property
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_stats structure",
                originalData: data,
            });
        });

        it("should return error for wrong message type", () => {
            const data = {
                type: "debug_print",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_stats structure",
                originalData: data,
            });
        });

        it("should return error for null stats", () => {
            const data = {
                type: "debug_stats",
                stats: null,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_stats structure",
                originalData: data,
            });
        });

        it("should return error for non-object stats", () => {
            const data = {
                type: "debug_stats",
                stats: "not an object",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_stats structure",
                originalData: data,
            });
        });

        it("should handle stats with boolean values as strings", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: "true",
                    auto_continue: "false",
                    breakpoints: ["message"],
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: "true",
                autoContinue: "false",
                breakpoints: ["message"],
            });
        });

        it("should ignore context parameter", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    current_step: 3,
                },
            };

            const context = {
                requestId: "req-123",
                flowId: "flow-456",
                currentState: {
                    stats: {
                        step_mode: false,
                        auto_continue: true,
                        events_processed: 2,
                        total_events: 4,
                        breakpoints: [],
                        event_history_count: 5,
                    },
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
            });
        });

        it("should handle debug_stats with additional properties", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    version: "1.2.3",
                },
                timestamp: "2024-01-01T10:00:00Z",
                source: "debug_engine",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
            });
        });

        it("should handle stats with undefined step_mode and auto_continue", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    current_step: 1,
                    breakpoints: ["error"],
                    // Missing step_mode and auto_continue
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: undefined,
                autoContinue: undefined,
                breakpoints: ["error"],
            });
        });

        it("should handle stats with null breakpoints", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: null,
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: [],
            });
        });

        it("should handle stats with nested objects", () => {
            const data = {
                type: "debug_stats",
                stats: {
                    step_mode: true,
                    auto_continue: false,
                    breakpoints: ["message"],
                    performance: {
                        cpu_usage: 25.5,
                        memory_usage: 128.7,
                        network_requests: 15,
                    },
                    agents: {
                        active: 2,
                        total: 4,
                        names: ["user", "assistant"],
                    },
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                stats: data.stats,
                stepMode: true,
                autoContinue: false,
                breakpoints: ["message"],
            });
        });
    });
});
