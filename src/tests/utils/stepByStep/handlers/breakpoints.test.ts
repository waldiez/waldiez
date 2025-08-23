/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it } from "vitest";

import { DebugBreakpointsHandler } from "@waldiez/utils/stepByStep/handlers/breakpoints";

describe("DebugBreakpointsHandler", () => {
    let handler: DebugBreakpointsHandler;

    beforeEach(() => {
        handler = new DebugBreakpointsHandler();
    });

    describe("canHandle", () => {
        it("should return true for breakpoint message types", () => {
            expect(handler.canHandle("debug_breakpoints_list")).toBe(true);
            expect(handler.canHandle("debug_breakpoint_added")).toBe(true);
            expect(handler.canHandle("debug_breakpoint_removed")).toBe(true);
            expect(handler.canHandle("debug_breakpoint_cleared")).toBe(true);
        });

        it("should return false for other message types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        describe("debug_breakpoints_list", () => {
            it("should handle breakpoints list message", () => {
                const data = {
                    type: "debug_breakpoints_list",
                    breakpoints: ["message", "tool_call", "error"],
                };

                const result = handler.handle(data as any, {});

                expect(result.debugMessage).toBe(data);
                expect(result.stateUpdate).toEqual({
                    breakpoints: ["message", "tool_call", "error"],
                });
                expect(result.controlAction).toEqual({
                    type: "update_breakpoints",
                    breakpoints: ["message", "tool_call", "error"],
                });
            });

            it("should handle empty breakpoints list", () => {
                const data = {
                    type: "debug_breakpoints_list",
                    breakpoints: [],
                };

                const result = handler.handle(data as any, {});

                expect(result.stateUpdate).toEqual({
                    breakpoints: [],
                });
                expect(result.controlAction).toEqual({
                    type: "update_breakpoints",
                    breakpoints: [],
                });
            });

            it("should return error for missing breakpoints property", () => {
                const data = {
                    type: "debug_breakpoints_list",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoints_list",
                    originalData: data,
                });
            });

            it("should return error for non-array breakpoints", () => {
                const data = {
                    type: "debug_breakpoints_list",
                    breakpoints: "not an array",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoints_list",
                    originalData: data,
                });
            });
        });

        describe("debug_breakpoint_added", () => {
            it("should handle breakpoint added message", () => {
                const data = {
                    type: "debug_breakpoint_added",
                    breakpoint: "message",
                };

                const context = {
                    currentState: {
                        breakpoints: ["tool_call"],
                    },
                };

                const result = handler.handle(data as any, context);

                expect(result.debugMessage).toBe(data);
                expect(result.stateUpdate).toEqual({
                    breakpoints: ["tool_call", "message"],
                });
                expect(result.controlAction).toEqual({
                    type: "show_notification",
                    message: "Breakpoint added: message",
                    severity: "success",
                });
            });

            it("should handle adding breakpoint with no existing breakpoints", () => {
                const data = {
                    type: "debug_breakpoint_added",
                    breakpoint: "error",
                };

                const result = handler.handle(data as any, {});

                expect(result.stateUpdate).toEqual({
                    breakpoints: ["error"],
                });
                expect(result.controlAction).toEqual({
                    type: "show_notification",
                    message: "Breakpoint added: error",
                    severity: "success",
                });
            });

            it("should return error for missing breakpoint property", () => {
                const data = {
                    type: "debug_breakpoint_added",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_added",
                    originalData: data,
                });
            });

            it("should return error for null breakpoint", () => {
                const data = {
                    type: "debug_breakpoint_added",
                    breakpoint: null,
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_added",
                    originalData: data,
                });
            });
        });

        describe("debug_breakpoint_removed", () => {
            it("should handle breakpoint removed message", () => {
                const data = {
                    type: "debug_breakpoint_removed",
                    breakpoint: "message",
                };

                const context = {
                    currentState: {
                        breakpoints: ["message", "tool_call", "error"],
                    },
                };

                const result = handler.handle(data as any, context);

                expect(result.debugMessage).toBe(data);
                expect(result.stateUpdate).toEqual({
                    breakpoints: ["tool_call", "error"],
                });
                expect(result.controlAction).toEqual({
                    type: "show_notification",
                    message: "Breakpoint removed: message",
                    severity: "info",
                });
            });

            it("should handle removing non-existent breakpoint", () => {
                const data = {
                    type: "debug_breakpoint_removed",
                    breakpoint: "unknown",
                };

                const context = {
                    currentState: {
                        breakpoints: ["message", "tool_call"],
                    },
                };

                const result = handler.handle(data as any, context);

                expect(result.stateUpdate).toEqual({
                    breakpoints: ["message", "tool_call"],
                });
            });

            it("should handle removing breakpoint with no existing breakpoints", () => {
                const data = {
                    type: "debug_breakpoint_removed",
                    breakpoint: "message",
                };

                const result = handler.handle(data as any, {});

                expect(result.stateUpdate).toEqual({
                    breakpoints: [],
                });
            });

            it("should return error for missing breakpoint property", () => {
                const data = {
                    type: "debug_breakpoint_removed",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_removed",
                    originalData: data,
                });
            });
        });

        describe("debug_breakpoint_cleared", () => {
            it("should handle breakpoints cleared message", () => {
                const data = {
                    type: "debug_breakpoint_cleared",
                    message: "All breakpoints have been cleared",
                };

                const result = handler.handle(data as any, {});

                expect(result.debugMessage).toBe(data);
                expect(result.stateUpdate).toEqual({
                    breakpoints: [],
                });
                expect(result.controlAction).toEqual({
                    type: "show_notification",
                    message: "All breakpoints have been cleared",
                    severity: "info",
                });
            });

            it("should return error for missing message property", () => {
                const data = {
                    type: "debug_breakpoint_cleared",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_cleared",
                    originalData: data,
                });
            });

            it("should return error for non-string message", () => {
                const data = {
                    type: "debug_breakpoint_cleared",
                    message: 123,
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_cleared",
                    originalData: data,
                });
            });
        });

        describe("unknown breakpoint message types", () => {
            it("should return error for unknown breakpoint message", () => {
                const data = {
                    type: "debug_breakpoint_unknown",
                };

                const result = handler.handle(data as any, {});

                expect(result.error).toEqual({
                    message: "Unknown breakpoint message type: debug_breakpoint_unknown",
                    originalData: data,
                });
            });
        });

        describe("edge cases", () => {
            it("should handle context without currentState", () => {
                const data = {
                    type: "debug_breakpoint_added",
                    breakpoint: "message",
                };

                const result = handler.handle(data as any, {});

                expect(result.stateUpdate).toEqual({
                    breakpoints: ["message"],
                });
            });

            it("should handle context with currentState but no breakpoints", () => {
                const data = {
                    type: "debug_breakpoint_added",
                    breakpoint: "message",
                };

                const context = {
                    currentState: {},
                };

                const result = handler.handle(data as any, context);

                expect(result.stateUpdate).toEqual({
                    breakpoints: ["message"],
                });
            });

            it("should handle removing multiple occurrences of same breakpoint", () => {
                const data = {
                    type: "debug_breakpoint_removed",
                    breakpoint: "message",
                };

                const context = {
                    currentState: {
                        breakpoints: ["message", "tool_call", "message", "error"],
                    },
                };

                const result = handler.handle(data as any, context);

                expect(result.stateUpdate).toEqual({
                    breakpoints: ["tool_call", "error"],
                });
            });
        });
    });
});
