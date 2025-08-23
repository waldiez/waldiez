/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugErrorHandler } from "@waldiez/utils/stepByStep/handlers";

describe("DebugErrorHandler", () => {
    let handler: DebugErrorHandler;

    beforeEach(() => {
        handler = new DebugErrorHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_error type", () => {
            expect(handler.canHandle("debug_error")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("debug_breakpoints_list")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid debug_error message", () => {
            const data = {
                type: "debug_error",
                error: "Connection failed to agent 'user'",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                lastError: "Connection failed to agent 'user'",
            });
            expect(result.controlAction).toEqual({
                type: "show_notification",
                message: "Connection failed to agent 'user'",
                severity: "error",
            });
        });

        it("should handle debug_error with complex error message", () => {
            const errorMessage =
                "Runtime error: Module 'openai' not found. Please install it using 'pip install openai'";
            const data = {
                type: "debug_error",
                error: errorMessage,
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                lastError: errorMessage,
            });
            expect(result.controlAction).toEqual({
                type: "show_notification",
                message: errorMessage,
                severity: "error",
            });
        });

        it("should handle debug_error with empty error message", () => {
            const data = {
                type: "debug_error",
                error: "",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                lastError: "",
            });
            expect(result.controlAction).toEqual({
                type: "show_notification",
                message: "",
                severity: "error",
            });
        });

        it("should return error for invalid debug_error structure", () => {
            const data = {
                type: "debug_error",
                // Missing error property
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_error structure",
                originalData: data,
            });
        });

        it("should return error for data with wrong type", () => {
            const data = {
                type: "debug_print",
                error: "This is not a debug_error",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_error structure",
                originalData: data,
            });
        });

        it("should handle debug_error with null error", () => {
            const data = {
                type: "debug_error",
                error: null,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_error structure",
                originalData: data,
            });
        });

        it("should handle debug_error with non-string error", () => {
            const data = {
                type: "debug_error",
                error: 123,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_error structure",
                originalData: data,
            });
        });

        it("should ignore context parameter", () => {
            const data = {
                type: "debug_error",
                error: "Test error",
            };

            const context = {
                requestId: "req-123",
                flowId: "flow-456",
                currentState: {
                    lastError: "Previous error",
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                lastError: "Test error",
            });
            expect(result.controlAction).toEqual({
                type: "show_notification",
                message: "Test error",
                severity: "error",
            });
        });

        it("should handle debug_error with additional properties", () => {
            const data = {
                type: "debug_error",
                error: "Test error",
                timestamp: "2024-01-01T10:00:00Z",
                source: "agent_manager",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                lastError: "Test error",
            });
            expect(result.controlAction).toEqual({
                type: "show_notification",
                message: "Test error",
                severity: "error",
            });
        });
    });
});
