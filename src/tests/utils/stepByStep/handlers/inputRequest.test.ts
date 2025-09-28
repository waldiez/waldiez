/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugInputRequestHandler } from "@waldiez/utils/stepByStep/handlers";

describe("DebugInputRequestHandler", () => {
    let handler: DebugInputRequestHandler;

    beforeEach(() => {
        handler = new DebugInputRequestHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_input_request type", () => {
            expect(handler.canHandle("debug_input_request")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_print")).toBe(false);
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_help")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle valid debug_input_request message", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: "Enter debug command (type 'help' for options):",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-123",
                    prompt: "Enter debug command (type 'help' for options):",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-123",
                prompt: "Enter debug command (type 'help' for options):",
            });
        });

        it("should handle debug_input_request with minimal data", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-456",
                prompt: ">",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-456",
                    prompt: ">",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-456",
                prompt: ">",
            });
        });

        it("should handle debug_input_request with empty prompt", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-789",
                prompt: "",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-789",
                    prompt: "",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-789",
                prompt: "",
            });
        });

        it("should handle debug_input_request with long descriptive prompt", () => {
            const prompt =
                "The workflow is paused at a breakpoint. Available commands: step, continue, break <event>, un-break <event>, list, help. Enter your command:";
            const data = {
                type: "debug_input_request",
                request_id: "req-detailed",
                prompt,
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-detailed",
                    prompt,
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-detailed",
                prompt,
            });
        });

        it("should return error for missing request_id", () => {
            const data = {
                type: "debug_input_request",
                prompt: "Enter command:",
                // Missing request_id
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_input_request structure",
                originalData: data,
            });
        });

        it("should return error for missing prompt", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-123",
                // Missing prompt
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_input_request structure",
                originalData: data,
            });
        });

        it("should return error for invalid message type", () => {
            const data = {
                type: "debug_print",
                request_id: "req-123",
                prompt: "Enter command:",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_input_request structure",
                originalData: data,
            });
        });

        it("should return error for null request_id", () => {
            const data = {
                type: "debug_input_request",
                request_id: null,
                prompt: "Enter command:",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_input_request structure",
                originalData: data,
            });
        });

        it("should return error for non-string prompt", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-123",
                prompt: 123,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_input_request structure",
                originalData: data,
            });
        });

        it("should ignore context parameter", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-context",
                prompt: "Context test:",
            };

            const context = {
                requestId: "different-req",
                flowId: "flow-123",
                currentState: {
                    pendingControlInput: {
                        request_id: "old-req",
                        prompt: "Old prompt",
                    },
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-context",
                    prompt: "Context test:",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-context",
                prompt: "Context test:",
            });
        });

        it("should handle debug_input_request with additional properties", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-extra",
                prompt: "Command:",
                timestamp: "2024-01-01T10:00:00Z",
                source: "debugger",
                metadata: {
                    step: 5,
                    agent: "user",
                },
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-extra",
                    prompt: "Command:",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "req-extra",
                prompt: "Command:",
            });
        });

        it("should handle empty string request_id", () => {
            const data = {
                type: "debug_input_request",
                request_id: "",
                prompt: "Enter command:",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "",
                    prompt: "Enter command:",
                },
            });
            expect(result.controlAction).toEqual({
                type: "debug_input_request_received",
                requestId: "",
                prompt: "Enter command:",
            });
        });

        it("should handle unicode characters in prompt", () => {
            const data = {
                type: "debug_input_request",
                request_id: "req-unicode",
                prompt: "▶️ Enter debug command (🔍 type 'help' for options):",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.stateUpdate).toEqual({
                pendingControlInput: {
                    request_id: "req-unicode",
                    prompt: "▶️ Enter debug command (🔍 type 'help' for options):",
                },
            });
        });
    });
});
