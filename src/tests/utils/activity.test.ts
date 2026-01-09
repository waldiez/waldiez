/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { activityEmoji, eventToActivity } from "@waldiez/utils/activity";

describe("eventToActivity", () => {
    it("returns null for falsy/empty inputs", () => {
        expect(eventToActivity(null)).toBeNull();
        expect(eventToActivity(undefined as any)).toBeNull();
        expect(eventToActivity({})).toBeNull();
        expect(eventToActivity({ type: "" })).toBeNull();
        expect(eventToActivity({ data: { type: "" } })).toBeNull();
    });

    it("maps *process* types to 'thinking'", () => {
        expect(eventToActivity({ type: "process_start" })).toBe("thinking");
        expect(eventToActivity({ type: "my_process_step" })).toBe("thinking");
        expect(eventToActivity({ debug_type: "background_process" })).toBe("thinking");
        expect(eventToActivity({ data: { type: "process" } })).toBe("thinking");
    });

    it("maps *code/function/tool* types to 'tool'", () => {
        expect(eventToActivity({ type: "code_block" })).toBe("tool");
        expect(eventToActivity({ type: "function_call" })).toBe("tool");
        expect(eventToActivity({ type: "tool_use" })).toBe("tool");
        // also through nested data
        expect(eventToActivity({ data: { type: "code_exec" } })).toBe("tool");
    });

    it("defaults to 'message' for other non-empty types", () => {
        expect(eventToActivity({ type: "message_text" })).toBe("message");
        expect(eventToActivity({ type: "anything-else" })).toBe("message");
    });

    it("is case-sensitive (does not lowercase)", () => {
        // 'Process' (capital P) does not include 'process' -> falls through to message
        expect(eventToActivity({ type: "Process" })).toBe("message");
    });

    it("coerces non-string types via toString()", () => {
        expect(eventToActivity({ type: 123 })).toBe("message"); // "123" has none of the keywords
    });
});

describe("activityEmoji", () => {
    it("returns empty string for falsy", () => {
        expect(activityEmoji(null)).toBe("");
        expect(activityEmoji(undefined)).toBe("");
        expect(activityEmoji("")).toBe("");
    });

    it("returns emoji for known activities", () => {
        expect(activityEmoji("thinking")).toBe(" ⏳ ");
        expect(activityEmoji("tool")).toBe(" ⚙️ ");
        expect(activityEmoji("message")).toBe(" 💬 ");
    });

    it("returns undefined for unknown activities (current behavior)", () => {
        expect(activityEmoji("unknown" as any)).toBeUndefined();
    });
});
