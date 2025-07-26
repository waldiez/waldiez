/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, render, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useImageRetry } from "@waldiez/components/chatUI/hooks";
import { ImageWithRetry } from "@waldiez/components/chatUI/imageWithRetry";

// Mock the hook
// noinspection JSUnusedGlobalSymbols
vi.mock("@waldiez/components/chatUI/hooks", () => ({
    useImageRetry: () => ({
        registerImage: vi.fn(),
    }),
}));

describe("ImageWithRetry", () => {
    it("renders and registers the image", () => {
        const { getByAltText } = render(<ImageWithRetry src="https://example.com/image.jpg" alt="Example" />);

        const img = getByAltText("Example") as HTMLImageElement;
        expect(img).toBeInTheDocument();
        expect(img.src).toContain("example.com/image.jpg");
        expect(img.classList.contains("loading")).toBe(true);
    });

    it("calls onClick if provided", () => {
        const handleClick = vi.fn();

        const { getByAltText } = render(<ImageWithRetry src="test.jpg" onClick={handleClick} />);

        fireEvent.click(getByAltText("Chat image"));
        expect(handleClick).toHaveBeenCalled();
    });
    it("does not retry after reaching maxRetries", () => {
        const { result } = renderHook(() => useImageRetry(1, 500));
        const img = document.createElement("img");
        result.current.registerImage(img, "foo.png");

        act(() => img.onerror?.(new Event("error")));
        vi.advanceTimersByTime(1000);

        // One retry, now force another error (should not trigger setTimeout again)
        act(() => img.onerror?.(new Event("error")));
        waitFor(() => {
            expect(img.classList.contains("failed")).toBe(true);
        });
    });
});
