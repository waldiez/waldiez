/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { showSnackbar } from "@waldiez/utils";

describe("Snackbar", () => {
    const flowId = "test-flow";

    beforeEach(() => {
        document.body.innerHTML = "";
        localStorage.clear();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.clearAllTimers();
        vi.restoreAllMocks();
    });

    it("should display a snackbar with correct message, level, and details", () => {
        showSnackbar(flowId, "Test message", "info", "Test details");
        const snackbar = document.querySelector(`#${flowId}-snackbar`);
        expect(snackbar?.textContent).toContain("Test message");
        expect(snackbar?.textContent).toContain("Test details");
        expect(snackbar?.className).toContain("snackbar");
        expect(snackbar?.className).toContain("info");
    });

    it("should lock and unlock the snackbar correctly", () => {
        const duration = 3000;
        expect(localStorage.getItem(`snackbar-${flowId}.lock`)).toBeNull();
        showSnackbar(flowId, "Lock test", "info", null, duration, false);
        expect(localStorage.getItem(`snackbar-${flowId}.lock`)).toBe("1");
        vi.advanceTimersByTime(duration);
        expect(localStorage.getItem(`snackbar-${flowId}.lock`)).toBeNull();
    });

    it("should not show a close button unless explicitly requested", () => {
        showSnackbar(flowId, "No close button", "info", null, undefined, false);
        const closeButton = document.querySelector(`#${flowId}-snackbar .close`);
        expect(closeButton).toBeNull();
    });

    it("should include a close button when requested", () => {
        showSnackbar(flowId, "With close button", "info", null, undefined, true);
        const closeButton = document.querySelector(`#${flowId}-snackbar .close`);
        expect(closeButton).not.toBeNull();
    });

    it("should allow manual closing via the close button", async () => {
        showSnackbar(flowId, "Manually close", "info", null, undefined, true);
        const closeButton = document.querySelector(`#${flowId}-snackbar .close`) as HTMLElement;
        closeButton.click();
        vi.advanceTimersByTime(300);
        await waitFor(() => {
            expect(document.querySelector(`#${flowId}-snackbar`)).toBeNull();
        });
    });

    it("should auto-dismiss after default duration if no duration is provided and no close button", () => {
        showSnackbar(flowId, "Auto dismiss default", "info", null, undefined, false);
        const snackbar = document.querySelector(`#${flowId}-snackbar`);
        expect(snackbar).not.toBeNull();
        vi.advanceTimersByTime(3000); // Default duration
        expect(document.querySelector(`#${flowId}-snackbar`)).toBeNull();
    });

    it("should auto-dismiss after specified duration even with close button", () => {
        showSnackbar(flowId, "Dismiss with close", "info", null, 4000, true);
        expect(document.querySelector(`#${flowId}-snackbar`)).not.toBeNull();
        vi.advanceTimersByTime(4000);
        expect(document.querySelector(`#${flowId}-snackbar`)).toBeNull();
    });

    it("should persist snackbar if close button is provided and no duration", () => {
        showSnackbar(flowId, "Persistent", "info", null, undefined, true);
        vi.advanceTimersByTime(5000);
        expect(document.querySelector(`#${flowId}-snackbar`)).not.toBeNull();
    });

    it("should reuse the existing snackbar for the same flowId", () => {
        showSnackbar(flowId, "Message 1");
        const initial = document.querySelector(`#${flowId}-snackbar`);
        expect(initial?.textContent).toContain("Message 1");
        // Manually unlock to allow retry immediately
        localStorage.removeItem(`snackbar-${flowId}.lock`);
        showSnackbar(flowId, "Message 2");
        // Simulate retry delay
        vi.advanceTimersByTime(200);
        const updated = document.querySelector(`#${flowId}-snackbar`);
        expect(updated).toBe(initial);
        expect(updated?.textContent).toContain("Message 2");
    });

    it("should render details as collapsible content", () => {
        showSnackbar(flowId, "Has details", "info", "Extra info");
        const details = document.querySelector(`#${flowId}-snackbar details`);
        expect(details).not.toBeNull();
        expect(details?.querySelector("summary")?.textContent).toBe("Details");
        expect(details?.textContent).toContain("Extra info");
    });

    it("should use error.message if passed an Error object", () => {
        showSnackbar(flowId, "Error test", "error", new Error("boom"));
        const details = document.querySelector(`#${flowId}-snackbar details`);
        expect(details?.textContent).toContain("boom");
    });

    it("should use error.detail if present", () => {
        showSnackbar(flowId, "Error detail", "error", {
            detail: "Detailed error",
        });
        const detail = document.querySelector(`#${flowId}-snackbar details div`);
        expect(detail?.textContent).toContain("Detailed error");
    });

    it("should use error.message if present", () => {
        showSnackbar(flowId, "Error message", "error", {
            message: "Message error",
        });
        const detail = document.querySelector(`#${flowId}-snackbar details div`);
        expect(detail?.textContent).toContain("Message error");
    });

    it("should use statusText if present", () => {
        showSnackbar(flowId, "Status text error", "error", {
            statusText: "Server Error",
        });
        const detail = document.querySelector(`#${flowId}-snackbar details div`);
        expect(detail?.textContent).toContain("Error: Server Error");
    });

    it("should show generic error for unknown objects", () => {
        showSnackbar(flowId, "Unknown error", "error", {
            unexpected: true,
        } as any);
        const detail = document.querySelector(`#${flowId}-snackbar details div`);
        expect(detail?.textContent).toContain("An unexpected error occurred.");
    });

    it("should retry if snackbar is locked", () => {
        localStorage.setItem(`snackbar-${flowId}.lock`, "1");
        showSnackbar(flowId, "Retry message");
        expect(document.querySelector(`#${flowId}-snackbar`)).toBeNull();

        // After 200ms retry
        vi.advanceTimersByTime(200);
        localStorage.removeItem(`snackbar-${flowId}.lock`);
        vi.advanceTimersByTime(200);
        expect(document.querySelector(`#${flowId}-snackbar`)).not.toBeNull();
    });
});
