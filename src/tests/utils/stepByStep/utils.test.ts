/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { StepByStepUtils } from "@waldiez/utils/stepByStep/stepByStepUtils";

describe("StepByStepUtils", () => {
    describe("extractEventParticipants", () => {
        it("should extract sender and recipient from event", () => {
            const event = {
                sender: "user",
                recipient: "assistant",
                type: "message",
            };

            const result = StepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: "user",
                recipient: "assistant",
            });
        });

        it("should handle missing participants", () => {
            const event = { type: "message" };

            const result = StepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: undefined,
                recipient: undefined,
            });
        });

        it("should handle non-string participants", () => {
            const event = {
                sender: 123,
                recipient: null,
                type: "message",
            };

            const result = StepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: undefined,
                recipient: undefined,
            });
        });

        it("should handle empty strings as valid", () => {
            const event = {
                sender: "",
                recipient: "",
                type: "message",
            };

            const result = StepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: "",
                recipient: "",
            });
        });
    });

    describe("formatEventContent", () => {
        it("should return string content as-is when short", () => {
            const event = { content: "Short message" };

            const result = StepByStepUtils.formatEventContent(event);

            expect(result).toBe("Short message");
        });

        it("should truncate long string content", () => {
            const event = { content: "A".repeat(150) };

            const result = StepByStepUtils.formatEventContent(event, 100);

            expect(result).toBe("A".repeat(100) + "...");
            expect(result.length).toBe(103);
        });

        it("should format object content as JSON", () => {
            const event = {
                content: {
                    type: "message",
                    data: "hello",
                },
            };

            const result = StepByStepUtils.formatEventContent(event);

            expect(result).toBe('{"type":"message","data":"hello"}');
        });

        it("should truncate long JSON content", () => {
            const event = {
                content: {
                    data: "A".repeat(150),
                },
            };

            const result = StepByStepUtils.formatEventContent(event, 50);

            expect(result).toHaveLength(53); // 50 + "..."
            expect(result.endsWith("...")).toBe(true);
        });

        it("should handle null/undefined content", () => {
            expect(StepByStepUtils.formatEventContent({ content: null })).toBe("");
            expect(StepByStepUtils.formatEventContent({ content: undefined })).toBe("");
            expect(StepByStepUtils.formatEventContent({})).toBe("");
        });

        it("should handle non-object/string content", () => {
            expect(StepByStepUtils.formatEventContent({ content: 123 })).toBe("");
            expect(StepByStepUtils.formatEventContent({ content: true })).toBe("");
        });

        it("should use custom max length", () => {
            const event = { content: "Hello world" };

            const result = StepByStepUtils.formatEventContent(event, 5);

            expect(result).toBe("Hello...");
        });

        it("should handle exact length content", () => {
            const event = { content: "Exactly 10" }; // 10 characters

            const result = StepByStepUtils.formatEventContent(event, 10);

            expect(result).toBe("Exactly 10");
        });
    });

    describe("isWorkflowInputRequest", () => {
        it("should return true for input_request type", () => {
            const event = { type: "input_request" };

            const result = StepByStepUtils.isWorkflowInputRequest(event);

            expect(result).toBe(true);
        });

        it("should return false for other types", () => {
            expect(StepByStepUtils.isWorkflowInputRequest({ type: "message" })).toBe(false);
            expect(StepByStepUtils.isWorkflowInputRequest({ type: "error" })).toBe(false);
            expect(StepByStepUtils.isWorkflowInputRequest({})).toBe(false);
        });

        it("should handle non-string type", () => {
            expect(StepByStepUtils.isWorkflowInputRequest({ type: 123 })).toBe(false);
            expect(StepByStepUtils.isWorkflowInputRequest({ type: null })).toBe(false);
        });
    });

    describe("extractWorkflowEndReason", () => {
        it("should detect completed workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow finished successfully";

            const result = StepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("completed");
        });

        it("should detect user stopped workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow stopped by user";

            const result = StepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("user_stopped");
        });

        it("should detect error in workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow execution failed: Error occurred";

            const result = StepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("error");
        });

        it("should return unknown for other content", () => {
            const content = "Some other message";

            const result = StepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("unknown");
        });

        it("should handle case insensitive matching", () => {
            expect(StepByStepUtils.extractWorkflowEndReason("WORKFLOW FINISHED")).toBe("completed");
            expect(StepByStepUtils.extractWorkflowEndReason("STOPPED BY USER")).toBe("user_stopped");
            expect(StepByStepUtils.extractWorkflowEndReason("EXECUTION FAILED")).toBe("error");
        });

        it("should handle empty/null content", () => {
            expect(StepByStepUtils.extractWorkflowEndReason("")).toBe("unknown");
        });
    });

    describe("isWorkflowStart", () => {
        it("should detect workflow start message", () => {
            const content = "<Waldiez step-by-step> - Starting workflow...";

            const result = StepByStepUtils.isWorkflowStart(content);

            expect(result).toBe(true);
        });

        it("should return false for other messages", () => {
            expect(StepByStepUtils.isWorkflowStart("Regular message")).toBe(false);
            expect(StepByStepUtils.isWorkflowStart("Workflow finished")).toBe(false);
            expect(StepByStepUtils.isWorkflowStart("")).toBe(false);
        });

        it("should handle partial matches", () => {
            const content = "Debug: <Waldiez step-by-step> - Starting workflow... with extra text";

            const result = StepByStepUtils.isWorkflowStart(content);

            expect(result).toBe(true);
        });
    });

    describe("isStepByStepMessage", () => {
        it("should return true for debug message types", () => {
            expect(StepByStepUtils.isStepByStepMessage({ type: "debug_print" })).toBe(true);
            expect(StepByStepUtils.isStepByStepMessage({ type: "debug_input_request" })).toBe(true);
            expect(StepByStepUtils.isStepByStepMessage({ type: "debug_error" })).toBe(true);
        });

        it("should return false for non-debug message types", () => {
            expect(StepByStepUtils.isStepByStepMessage({ type: "message" })).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage({ type: "error" })).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage({ type: "print" })).toBe(false);
        });

        it("should return false for invalid content", () => {
            expect(StepByStepUtils.isStepByStepMessage(null)).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage(undefined)).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage("string")).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage(123)).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage({})).toBe(false);
        });

        it("should handle non-string type property", () => {
            expect(StepByStepUtils.isStepByStepMessage({ type: 123 })).toBe(false);
            expect(StepByStepUtils.isStepByStepMessage({ type: null })).toBe(false);
        });
    });

    describe("canProcess", () => {
        it("should delegate to isStepByStepMessage", () => {
            expect(StepByStepUtils.canProcess({ type: "debug_print" })).toBe(true);
            expect(StepByStepUtils.canProcess({ type: "message" })).toBe(false);
            expect(StepByStepUtils.canProcess(null)).toBe(false);
        });
    });

    describe("extractEventType", () => {
        it("should extract direct type property", () => {
            const event = { type: "message", content: "hello" };

            const result = StepByStepUtils.extractEventType(event);

            expect(result).toBe("message");
        });

        it("should extract type from nested content", () => {
            const event = {
                content: {
                    type: "tool_call",
                    data: "some data",
                },
            };

            const result = StepByStepUtils.extractEventType(event);

            expect(result).toBe("tool_call");
        });

        it("should prefer direct type over nested type", () => {
            const event = {
                type: "message",
                content: {
                    type: "tool_call",
                },
            };

            const result = StepByStepUtils.extractEventType(event);

            expect(result).toBe("message");
        });

        it("should return unknown for missing type", () => {
            expect(StepByStepUtils.extractEventType({})).toBe("unknown");
            expect(StepByStepUtils.extractEventType({ content: {} })).toBe("unknown");
            expect(StepByStepUtils.extractEventType({ content: "string" })).toBe("unknown");
        });

        it("should handle non-string types", () => {
            expect(StepByStepUtils.extractEventType({ type: 123 })).toBe("unknown");
            expect(StepByStepUtils.extractEventType({ type: null })).toBe("unknown");
            expect(StepByStepUtils.extractEventType({ type: true })).toBe("unknown");
        });

        it("should handle nested non-string types", () => {
            const event = {
                content: {
                    type: 123,
                },
            };

            const result = StepByStepUtils.extractEventType(event);

            expect(result).toBe("unknown");
        });
    });

    describe("createControlResponse", () => {
        it("should create proper response structure", () => {
            const result = StepByStepUtils.createControlResponse("req-123", "continue");

            expect(result).toEqual({
                type: "debug_input_response",
                request_id: "req-123",
                data: "continue",
            });
        });

        it("should handle different commands", () => {
            expect(StepByStepUtils.createControlResponse("req-1", "step")).toEqual({
                type: "debug_input_response",
                request_id: "req-1",
                data: "step",
            });

            expect(StepByStepUtils.createControlResponse("req-2", "list")).toEqual({
                type: "debug_input_response",
                request_id: "req-2",
                data: "list",
            });
        });

        it("should handle empty strings", () => {
            const result = StepByStepUtils.createControlResponse("", "");

            expect(result).toEqual({
                type: "debug_input_response",
                request_id: "",
                data: "",
            });
        });
    });
});
