/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import React from "react";

import { WaldiezThemeProvider, isInitiallyDark, setIsDarkMode, useWaldiezTheme } from "@waldiez/theme";

describe("WaldiezThemeProvider", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");

    beforeEach(() => {
        getItemSpy.mockClear();
        setItemSpy.mockClear();
    });

    afterEach(() => {
        getItemSpy.mockClear();
        setItemSpy.mockClear();
        document.body.classList.remove("waldiez-dark");
        document.body.classList.remove("waldiez-light");
    });

    it("should render children", () => {
        const { getByText } = render(
            <WaldiezThemeProvider>
                <div>test</div>
            </WaldiezThemeProvider>,
        );
        expect(getByText("test")).toBeInTheDocument();
    });

    it("should set theme", () => {
        render(
            <WaldiezThemeProvider>
                <div>test</div>
            </WaldiezThemeProvider>,
        );
        setIsDarkMode(true);
        waitFor(() => {
            expect(document.body.classList.contains("waldiez-dark")).toBe(true);
        });
    });

    it("should set dark theme", () => {
        render(
            <WaldiezThemeProvider>
                <div>test</div>
            </WaldiezThemeProvider>,
        );
        setIsDarkMode(true);
        waitFor(() => {
            expect(document.body.classList.contains("waldiez-dark")).toBe(true);
        });
    });

    it("should set light theme", () => {
        render(
            <WaldiezThemeProvider>
                <div>test</div>
            </WaldiezThemeProvider>,
        );
        setIsDarkMode(false);
        waitFor(() => {
            expect(document.body.classList.contains("waldiez-light")).toBe(true);
        });
    });
    it("should set theme from storage", () => {
        getItemSpy.mockReturnValueOnce("dark");
        render(
            <WaldiezThemeProvider>
                <div>test</div>
            </WaldiezThemeProvider>,
        );
        waitFor(() => {
            expect(document.body.classList.contains("waldiez-dark")).toBe(true);
        });
    });
    it("should toggle the theme when calling toggleTheme", () => {
        const wrapper = ({ children }: { children: React.ReactNode }) => (
            <WaldiezThemeProvider>{children}</WaldiezThemeProvider>
        );
        const { result } = renderHook(() => useWaldiezTheme(), { wrapper });
        setIsDarkMode(true);
        result.current.toggleTheme();
        waitFor(() => {
            expect(document.body.classList.contains("waldiez-light")).toBe(true);
        });
    });
    it("should throw if not in a provider", () => {
        expect(() => {
            renderHook(() => useWaldiezTheme());
        }).toThrowError("useWaldiezTheme must be used within a WaldiezThemeProvider context");
    });
    it("should get the dark theme from the document body", () => {
        getItemSpy.mockReturnValueOnce(null);
        document.body.classList.add("waldiez-dark");
        const isDark = isInitiallyDark();
        expect(isDark).toBe(true);
    });
    it("should get the light theme from the document body", () => {
        getItemSpy.mockReturnValueOnce(null);
        document.body.classList.add("waldiez-light");
        const isDark = isInitiallyDark();
        expect(isDark).toBe(false);
    });
});
