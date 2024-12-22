import "@testing-library/jest-dom";
import { cleanup } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, vi } from "vitest";

export const mockMatchMedia = (matches: boolean = false) => {
    // window.matchMedia("(prefers-color-scheme: dark)");
    Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
            matches,
            media: query,
            onchange: null,
            addListener: vi.fn(), // deprecated
            removeListener: vi.fn(), // deprecated
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            dispatchEvent: vi.fn(),
        })),
    });
};

beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
});
afterEach(() => {
    cleanup();
    vi.useRealTimers();
});
beforeAll(() => {
    mockMatchMedia();
    // window.URL.createObjectURL = vi.fn();
    // window.URL.revokeObjectURL = vi.fn();
});
afterAll(() => {
    vi.resetAllMocks();
});
