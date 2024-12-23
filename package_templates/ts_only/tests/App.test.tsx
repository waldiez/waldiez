import { mockMatchMedia } from "../vitest.setup";
import { act, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { App } from "@my/package/App";

describe("App Component", () => {
    beforeEach(() => {
        document.body.classList.remove("dark-theme", "light-theme");
    });
    it("renders without crashing", () => {
        const { getByText } = render(<App />);
        expect(getByText("App")).toBeInTheDocument();
    });
    it("uses dark theme if prefers-color-scheme is dark", async () => {
        mockMatchMedia(true);
        act(() => {
            render(<App />);
        });
        vi.advanceTimersByTime(1000);
        // screen.debug(undefined, 10000);
        expect(document.body.classList.contains("dark-theme")).toBe(true);
    });
    it("uses light theme if prefers-color-scheme is light", async () => {
        mockMatchMedia(false);
        act(() => {
            render(<App />);
        });
        expect(document.body.classList.contains("light-theme")).toBe(true);
    });
});
