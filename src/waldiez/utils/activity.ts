/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
export const eventToActivity = (e: any): string | null => {
    if (!e) {
        return null;
    }
    let t = e.type ?? e.debug_type ?? e.data?.type ?? "";
    if (!t) {
        return null;
    }
    t = t.toString();
    if (t.includes("process")) {
        return "thinking";
    }
    if (t.includes("code") || t.includes("function") || t.includes("tool")) {
        return "tool";
    }
    return "message";
};

export const activityEmoji = (activity: string | null | undefined) => {
    if (!activity) {
        return "";
    }
    if (activity === "thinking") {
        return " ⏳ ";
    }
    if (activity === "tool") {
        return " ⚙️ ";
    }
    if (activity === "message") {
        return " 💬 ";
    }
};
