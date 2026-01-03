/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatMessageProcessor } from "@waldiez/utils/chat";
import { WaldiezChatTransitionEventHandler } from "@waldiez/utils/chat/handlers/transition";

// Mock nanoid (deterministic ids)
vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("TransitionEventHandler", () => {
    let mockDate: Date;

    beforeEach(() => {
        mockDate = new Date("2024-01-01T12:00:00.000Z");
        vi.setSystemTime(mockDate);
    });

    describe("canHandle", () => {
        it("should return true for supported transition types", () => {
            const h = new WaldiezChatTransitionEventHandler();
            expect(h.canHandle("on_context_condition_transition")).toBe(true);
            expect(h.canHandle("after_works_transition")).toBe(true);
            expect(h.canHandle("on_condition_llm_transition")).toBe(true);
            expect(h.canHandle("on_condition_l_l_m_transition")).toBe(true);
            expect(h.canHandle("reply_result_transition")).toBe(true);
        });

        it("should return false for unsupported types", () => {
            const h = new WaldiezChatTransitionEventHandler();
            expect(h.canHandle("something_else")).toBe(false);
            expect(h.canHandle("transition")).toBe(false);
            expect(h.canHandle("")).toBe(false);
        });
    });

    describe("isValidTransitionEvent", () => {
        it("should return true for valid nested-content shape", () => {
            const data = {
                type: "on_condition_llm_transition",
                content: {
                    source_agent: "manager",
                    transition_target: "worker",
                },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(true);
        });

        it("should return true for valid top-level shape", () => {
            const data = {
                type: "after_works_transition",
                source_agent: "manager",
                transition_target: "worker",
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(true);
        });

        it("should return true when target is missing (will be inferred later)", () => {
            const data = {
                type: "reply_result_transition",
                content: {
                    source_agent: "manager",
                    // no transition_target
                },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(true);
        });

        it("should return false when data is not an object", () => {
            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(null)).toBe(false);
            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent("x")).toBe(false);
            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(123)).toBe(false);
            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent([])).toBe(false);
        });

        it("should return false for unsupported type", () => {
            const data = {
                type: "not_a_transition",
                content: { source_agent: "a", transition_target: "b" },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(false);
        });

        it("should return false when source_agent is missing everywhere", () => {
            const data = {
                type: "on_context_condition_transition",
                content: {
                    // source_agent missing
                    transition_target: "b",
                },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(false);
        });

        it("should return false when id is present but not a string", () => {
            const data = {
                id: 123,
                type: "on_context_condition_transition",
                content: {
                    source_agent: "a",
                    transition_target: "b",
                },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(false);
        });

        it("should return true when transition_target is present but not a string", () => {
            const data = {
                type: "on_context_condition_transition",
                content: {
                    source_agent: "a",
                    transition_target: 123,
                },
            };

            expect(WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)).toBe(true);
        });
    });

    describe("processor integration", () => {
        it("should handle transition event with nested content (explicit target)", () => {
            const message = JSON.stringify({
                type: "on_condition_llm_transition",
                content: {
                    source_agent: "manager",
                    transition_target: "worker",
                    sender: "manager",
                    recipient: "worker",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "on_condition_llm_transition",
                    content: [{ type: "text", text: "LLMTransition Handoff" }],
                    sender: "manager",
                    recipient: "worker",
                },
            });
        });

        it("should infer target from recipient (top-level recipient)", () => {
            const message = JSON.stringify({
                type: "after_works_transition",
                content: {
                    source_agent: "manager",
                    // transition_target missing
                },
                recipient: "worker",
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "after_works_transition",
                    content: [{ type: "text", text: "AfterWork Handoff" }],
                    sender: "manager",
                    recipient: "worker",
                },
            });
        });

        it("should infer target from content.recipient when transition_target missing", () => {
            const message = JSON.stringify({
                type: "on_context_condition_transition",
                content: {
                    source_agent: "manager",
                    recipient: "worker",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "mock-nanoid-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "on_context_condition_transition",
                    content: [{ type: "text", text: "ContextCondition Handoff" }],
                    sender: "manager",
                    recipient: "worker",
                },
            });
        });

        it("should use provided id if present", () => {
            const message = JSON.stringify({
                id: "explicit-id",
                type: "reply_result_transition",
                content: {
                    source_agent: "manager",
                    transition_target: "worker",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);

            expect(result).toEqual({
                message: {
                    id: "explicit-id",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    type: "reply_result_transition",
                    content: [{ type: "text", text: "ReplyResult" }],
                    sender: "manager",
                    recipient: "worker",
                },
            });
        });

        it("should return undefined for invalid transition event", () => {
            const message = JSON.stringify({
                type: "on_condition_llm_transition",
                content: {
                    // source_agent missing => invalid
                    transition_target: "worker",
                },
            });

            const result = WaldiezChatMessageProcessor.process(message);
            expect(result).toBeUndefined();
        });
    });

    describe("direct handler usage", () => {
        it("handle() should return undefined for invalid input", () => {
            const h = new WaldiezChatTransitionEventHandler();
            expect(h.handle({ type: "on_condition_llm_transition" })).toBeUndefined();
        });
    });
});
