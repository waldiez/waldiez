/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DebugPrintHandler } from "@waldiez/utils/stepByStep/handlers";

describe("DebugPrintHandler", () => {
    let handler: DebugPrintHandler;

    beforeEach(() => {
        handler = new DebugPrintHandler();
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("should return true for debug_print type", () => {
            expect(handler.canHandle("debug_print")).toBe(true);
        });

        it("should return false for other types", () => {
            expect(handler.canHandle("debug_error")).toBe(false);
            expect(handler.canHandle("debug_input_request")).toBe(false);
            expect(handler.canHandle("debug_help")).toBe(false);
            expect(handler.canHandle("unknown_type")).toBe(false);
        });
    });

    describe("handle", () => {
        it("should handle regular debug_print message", () => {
            const data = {
                type: "debug_print",
                content: "Executing step 1: Initializing agents...",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
            expect(result.controlAction).toBeUndefined();
            expect(result.stateUpdate).toBeUndefined();
        });

        it("should detect workflow finished message", () => {
            const data = {
                type: "debug_print",
                content: "<Waldiez step-by-step> - Workflow finished successfully with results",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "completed",
            });
            expect(result.stateUpdate).toEqual({
                activeRequest: null,
                pendingControlInput: null,
            });
        });

        it("should detect workflow stopped by user message", () => {
            const data = {
                type: "debug_print",
                content: "<Waldiez step-by-step> - Workflow stopped by user request",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "user_stopped",
            });
            expect(result.stateUpdate).toEqual({
                activeRequest: null,
                pendingControlInput: null,
            });
        });

        it("should detect workflow execution failed message", () => {
            const data = {
                type: "debug_print",
                content: "<Waldiez step-by-step> - Workflow execution failed: Agent connection timeout",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "error",
            });
            expect(result.stateUpdate).toEqual({
                activeRequest: null,
                pendingControlInput: null,
            });
        });

        it("should handle workflow end message with additional text", () => {
            const data = {
                type: "debug_print",
                content: "Debug output: <Waldiez step-by-step> - Workflow finished - Total time: 45.2s",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "completed",
            });
        });

        it("should handle non-workflow-end message", () => {
            const data = {
                type: "debug_print",
                content: "Agent 'assistant' is processing message from 'user'",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
            expect(result.controlAction).toBeUndefined();
            expect(result.stateUpdate).toBeUndefined();
        });

        it("should return error for invalid debug_print structure - wrong type", () => {
            const data = {
                type: "debug_error",
                content: "This should be debug_print",
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_print structure",
                originalData: data,
            });
        });

        it("should return error for invalid debug_print structure - missing content", () => {
            const data = {
                type: "debug_print",
                // Missing content
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_print structure",
                originalData: data,
            });
        });

        it("should return error for invalid debug_print structure - non-string content", () => {
            const data = {
                type: "debug_print",
                content: 123,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_print structure",
                originalData: data,
            });
        });

        it("should return error for null content", () => {
            const data = {
                type: "debug_print",
                content: null,
            };

            const result = handler.handle(data as any, {});

            expect(result.error).toEqual({
                message: "Invalid debug_print structure",
                originalData: data,
            });
        });

        it("should handle empty string content", () => {
            const data = {
                type: "debug_print",
                content: "",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
        });

        it("should ignore context parameter", () => {
            const data = {
                type: "debug_print",
                content: "Test message",
            };

            const context = {
                requestId: "req-123",
                flowId: "flow-456",
                currentState: {
                    pendingControlInput: {
                        request_id: "old-req",
                        prompt: "Old prompt",
                    },
                },
            };

            const result = handler.handle(data as any, context);

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
        });

        it("should handle debug_print with additional properties", () => {
            const data = {
                type: "debug_print",
                content: "Debug message with metadata",
                timestamp: "2024-01-01T10:00:00Z",
                source: "agent_manager",
                level: "info",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
        });

        it("should handle multiple workflow end markers in single message", () => {
            const data = {
                type: "debug_print",
                content:
                    "Debug: <Waldiez step-by-step> - Workflow finished and also <Waldiez step-by-step> - Workflow stopped by user",
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            // Should detect the first match (completed)
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "completed",
            });
        });

        it("should handle case variations in workflow end detection", () => {
            // The handler should be case sensitive based on constants
            const data = {
                type: "debug_print",
                content: "<waldiez step-by-step> - workflow finished", // lowercase
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false); // Should not match due to case sensitivity
        });

        it("should handle workflow end with undefined reason", () => {
            // Create a message that matches end marker but doesn't match any specific reason
            const data = {
                type: "debug_print",
                content: "<Waldiez step-by-step> - Workflow ended unexpectedly",
            };

            // This won't actually trigger isWorkflowEnd since it doesn't match any WORKFLOW_STEP_END_MARKERS
            // But let's test the extractEndReason method indirectly
            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(false);
        });

        it("should handle very long debug content", () => {
            const longContent = "A".repeat(10000) + " <Waldiez step-by-step> - Workflow finished ";
            const data = {
                type: "debug_print",
                content: longContent,
            };

            const result = handler.handle(data as any, {});

            expect(result.debugMessage).toBe(data);
            expect(result.isWorkflowEnd).toBe(true);
            expect(result.controlAction).toEqual({
                type: "workflow_ended",
                reason: "completed",
            });
        });
    });
    it("should extract participants from print message", () => {
        const message = {
            type: "print" as const,
            participants: [
                { id: "u", name: "user_proxy", humanInputMode: "ALWAYS", agentType: "user_proxy" },
                { name: "assistant_1", humanInputMode: "NEVER", agentType: "assistant" },
            ],
        };
        const result = handler.handle(message as any, {});
        expect(result).toEqual({
            stateUpdate: {
                participants: [
                    {
                        id: "u",
                        name: "user_proxy",
                        isUser: true,
                    },
                    {
                        id: "assistant_1",
                        name: "assistant_1",
                        isUser: false,
                    },
                ],
            },
        });
    });
});
