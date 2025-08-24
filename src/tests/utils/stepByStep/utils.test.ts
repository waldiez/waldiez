/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezStepByStepUtils } from "@waldiez/utils/stepByStep/stepByStepUtils";

describe("WaldiezStepByStepUtils", () => {
    describe("extractEventParticipants", () => {
        it("should extract sender and recipient from event", () => {
            const event = {
                sender: "user",
                recipient: "assistant",
                type: "message",
            };

            const result = WaldiezStepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: "user",
                recipient: "assistant",
            });
        });

        it("should handle missing participants", () => {
            const event = { type: "message" };

            const result = WaldiezStepByStepUtils.extractEventParticipants(event);

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

            const result = WaldiezStepByStepUtils.extractEventParticipants(event);

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

            const result = WaldiezStepByStepUtils.extractEventParticipants(event);

            expect(result).toEqual({
                sender: "",
                recipient: "",
            });
        });
    });

    describe("formatEventContent", () => {
        it("should return string content as-is when short", () => {
            const event = { content: "Short message" };

            const result = WaldiezStepByStepUtils.formatEventContent(event);

            expect(result).toBe("Short message");
        });

        it("should truncate long string content", () => {
            const event = { content: "A".repeat(150) };

            const result = WaldiezStepByStepUtils.formatEventContent(event, 100);

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

            const result = WaldiezStepByStepUtils.formatEventContent(event);

            expect(result).toBe('{"type":"message","data":"hello"}');
        });

        it("should truncate long JSON content", () => {
            const event = {
                content: {
                    data: "A".repeat(150),
                },
            };

            const result = WaldiezStepByStepUtils.formatEventContent(event, 50);

            expect(result).toHaveLength(53); // 50 + "..."
            expect(result.endsWith("...")).toBe(true);
        });

        it("should handle null/undefined content", () => {
            expect(WaldiezStepByStepUtils.formatEventContent({ content: null })).toBe("");
            expect(WaldiezStepByStepUtils.formatEventContent({ content: undefined })).toBe("");
            expect(WaldiezStepByStepUtils.formatEventContent({})).toBe("");
        });

        it("should handle non-object/string content", () => {
            expect(WaldiezStepByStepUtils.formatEventContent({ content: 123 })).toBe("");
            expect(WaldiezStepByStepUtils.formatEventContent({ content: true })).toBe("");
        });

        it("should use custom max length", () => {
            const event = { content: "Hello world" };

            const result = WaldiezStepByStepUtils.formatEventContent(event, 5);

            expect(result).toBe("Hello...");
        });

        it("should handle exact length content", () => {
            const event = { content: "Exactly 10" }; // 10 characters

            const result = WaldiezStepByStepUtils.formatEventContent(event, 10);

            expect(result).toBe("Exactly 10");
        });
    });

    describe("isWorkflowInputRequest", () => {
        it("should return true for input_request type", () => {
            const event = { type: "input_request" };

            const result = WaldiezStepByStepUtils.isWorkflowInputRequest(event);

            expect(result).toBe(true);
        });

        it("should return false for other types", () => {
            expect(WaldiezStepByStepUtils.isWorkflowInputRequest({ type: "message" })).toBe(false);
            expect(WaldiezStepByStepUtils.isWorkflowInputRequest({ type: "error" })).toBe(false);
            expect(WaldiezStepByStepUtils.isWorkflowInputRequest({})).toBe(false);
        });

        it("should handle non-string type", () => {
            expect(WaldiezStepByStepUtils.isWorkflowInputRequest({ type: 123 })).toBe(false);
            expect(WaldiezStepByStepUtils.isWorkflowInputRequest({ type: null })).toBe(false);
        });
    });

    describe("extractWorkflowEndReason", () => {
        it("should detect completed workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow finished successfully";

            const result = WaldiezStepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("completed");
        });

        it("should detect user stopped workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow stopped by user";

            const result = WaldiezStepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("user_stopped");
        });

        it("should detect error in workflow", () => {
            const content = "<Waldiez step-by-step> - Workflow execution failed: Error occurred";

            const result = WaldiezStepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("error");
        });

        it("should return unknown for other content", () => {
            const content = "Some other message";

            const result = WaldiezStepByStepUtils.extractWorkflowEndReason(content);

            expect(result).toBe("unknown");
        });

        it("should handle case insensitive matching", () => {
            expect(WaldiezStepByStepUtils.extractWorkflowEndReason("WORKFLOW FINISHED")).toBe("completed");
            expect(WaldiezStepByStepUtils.extractWorkflowEndReason("STOPPED BY USER")).toBe("user_stopped");
            expect(WaldiezStepByStepUtils.extractWorkflowEndReason("EXECUTION FAILED")).toBe("error");
        });

        it("should handle empty/null content", () => {
            expect(WaldiezStepByStepUtils.extractWorkflowEndReason("")).toBe("unknown");
        });
    });

    describe("isWorkflowStart", () => {
        it("should detect workflow start message", () => {
            const content = "<Waldiez step-by-step> - Starting workflow...";

            const result = WaldiezStepByStepUtils.isWorkflowStart(content);

            expect(result).toBe(true);
        });

        it("should return false for other messages", () => {
            expect(WaldiezStepByStepUtils.isWorkflowStart("Regular message")).toBe(false);
            expect(WaldiezStepByStepUtils.isWorkflowStart("Workflow finished")).toBe(false);
            expect(WaldiezStepByStepUtils.isWorkflowStart("")).toBe(false);
        });

        it("should handle partial matches", () => {
            const content = "Debug: <Waldiez step-by-step> - Starting workflow... with extra text";

            const result = WaldiezStepByStepUtils.isWorkflowStart(content);

            expect(result).toBe(true);
        });
    });

    describe("isStepByStepMessage", () => {
        it("should return true for debug message types", () => {
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "debug_print" })).toBe(true);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "debug_input_request" })).toBe(true);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "debug_error" })).toBe(true);
        });

        it("should return false for non-debug message types", () => {
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "message" })).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "error" })).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: "print" })).toBe(false);
        });

        it("should return false for invalid content", () => {
            expect(WaldiezStepByStepUtils.isStepByStepMessage(null)).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage(undefined)).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage("string")).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage(123)).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({})).toBe(false);
        });

        it("should handle non-string type property", () => {
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: 123 })).toBe(false);
            expect(WaldiezStepByStepUtils.isStepByStepMessage({ type: null })).toBe(false);
        });
    });

    describe("canProcess", () => {
        it("should delegate to isStepByStepMessage", () => {
            expect(WaldiezStepByStepUtils.canProcess({ type: "debug_print" })).toBe(true);
            expect(WaldiezStepByStepUtils.canProcess({ type: "message" })).toBe(false);
            expect(WaldiezStepByStepUtils.canProcess(null)).toBe(false);
        });
    });

    describe("extractEventType", () => {
        it("should extract direct type property", () => {
            const event = { type: "message", content: "hello" };

            const result = WaldiezStepByStepUtils.extractEventType(event);

            expect(result).toBe("message");
        });

        it("should extract type from nested content", () => {
            const event = {
                content: {
                    type: "tool_call",
                    data: "some data",
                },
            };

            const result = WaldiezStepByStepUtils.extractEventType(event);

            expect(result).toBe("tool_call");
        });

        it("should prefer direct type over nested type", () => {
            const event = {
                type: "message",
                content: {
                    type: "tool_call",
                },
            };

            const result = WaldiezStepByStepUtils.extractEventType(event);

            expect(result).toBe("message");
        });

        it("should return unknown for missing type", () => {
            expect(WaldiezStepByStepUtils.extractEventType({})).toBe("unknown");
            expect(WaldiezStepByStepUtils.extractEventType({ content: {} })).toBe("unknown");
            expect(WaldiezStepByStepUtils.extractEventType({ content: "string" })).toBe("unknown");
        });

        it("should handle non-string types", () => {
            expect(WaldiezStepByStepUtils.extractEventType({ type: 123 })).toBe("unknown");
            expect(WaldiezStepByStepUtils.extractEventType({ type: null })).toBe("unknown");
            expect(WaldiezStepByStepUtils.extractEventType({ type: true })).toBe("unknown");
        });

        it("should handle nested non-string types", () => {
            const event = {
                content: {
                    type: 123,
                },
            };

            const result = WaldiezStepByStepUtils.extractEventType(event);

            expect(result).toBe("unknown");
        });
    });

    describe("createControlResponse", () => {
        it("should create proper response structure", () => {
            const result = WaldiezStepByStepUtils.createControlResponse("req-123", "continue");

            expect(result).toEqual({
                type: "debug_input_response",
                request_id: "req-123",
                data: "continue",
            });
        });

        it("should handle different commands", () => {
            expect(WaldiezStepByStepUtils.createControlResponse("req-1", "step")).toEqual({
                type: "debug_input_response",
                request_id: "req-1",
                data: "step",
            });

            expect(WaldiezStepByStepUtils.createControlResponse("req-2", "list")).toEqual({
                type: "debug_input_response",
                request_id: "req-2",
                data: "list",
            });
        });

        it("should handle empty strings", () => {
            const result = WaldiezStepByStepUtils.createControlResponse("", "");

            expect(result).toEqual({
                type: "debug_input_response",
                request_id: "",
                data: "",
            });
        });
    });
});
