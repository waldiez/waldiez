/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WaldiezChatPostCarryoverHandler } from "@waldiez/utils/chat/handlers/post_carryover";

vi.mock("nanoid", () => ({
    nanoid: vi.fn(() => "mock-nanoid-id"),
}));

describe("WaldiezChatPostCarryoverHandler", () => {
    let handler: WaldiezChatPostCarryoverHandler;

    beforeEach(() => {
        handler = new WaldiezChatPostCarryoverHandler();
        vi.setSystemTime(new Date("2024-01-01T12:00:00.000Z"));
        vi.clearAllMocks();
    });

    describe("canHandle", () => {
        it("returns true for 'post_carryover_processing'", () => {
            expect(handler.canHandle("post_carryover_processing")).toBe(true);
        });

        it("returns false for other types", () => {
            expect(handler.canHandle("executed_function")).toBe(false);
            expect(handler.canHandle("execute_function")).toBe(false);
            expect(handler.canHandle("text")).toBe(false);
            expect(handler.canHandle("")).toBe(false);
        });
    });

    describe("isValidPostCarryoverMessage", () => {
        it("accepts objects with sender and recipient", () => {
            expect(
                WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage({
                    sender: "assistant",
                    recipient: "user",
                }),
            ).toBe(true);
        });

        it("rejects when sender is missing", () => {
            expect(
                WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage({
                    recipient: "user",
                }),
            ).toBe(false);
        });

        it("rejects when recipient is missing", () => {
            expect(
                WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage({
                    sender: "assistant",
                }),
            ).toBe(false);
        });

        it("rejects non-objects and nulls", () => {
            expect(WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage(null)).toBe(false);
            expect(WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage("string")).toBe(false);
            expect(WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage(123)).toBe(false);
            expect(WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage({})).toBe(false);
        });
    });

    describe("handle", () => {
        it("returns a message when input is valid (with uuid)", () => {
            const data = {
                uuid: "carryover-uuid-123",
                sender: "assistant",
                recipient: "user",
            };

            const res = handler.handle(data);

            expect(res).toEqual({
                message: {
                    type: "post_carryover_processing",
                    id: "carryover-uuid-123",
                    timestamp: "2024-01-01T12:00:00.000Z",
                    content: "Using auto reply",
                    sender: "assistant",
                    recipient: "user",
                },
            });
        });

        it("generates nanoid if uuid is missing", () => {
            const data = {
                sender: "assistant",
                recipient: "user",
            };

            const res = handler.handle(data);

            expect(res?.message?.id).toBe("mock-nanoid-id");
            expect(res?.message?.timestamp).toBe("2024-01-01T12:00:00.000Z");
            expect(res?.message?.type).toBe("post_carryover_processing");
            expect(res?.message?.content).toBe("Using auto reply");
            expect(res?.message?.sender).toBe("assistant");
            expect(res?.message?.recipient).toBe("user");
        });

        it("returns undefined for invalid data shapes", () => {
            expect(handler.handle(null as any)).toBeUndefined();
            expect(handler.handle("string" as any)).toBeUndefined();
            expect(handler.handle({} as any)).toBeUndefined();
            expect(handler.handle({ sender: "assistant" } as any)).toBeUndefined();
            expect(handler.handle({ recipient: "user" } as any)).toBeUndefined();
        });
    });
});
