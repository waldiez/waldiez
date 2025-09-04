/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { type ReactNode, useEffect, useState } from "react";

import { WaldiezThemeContext } from "@waldiez/theme/useWaldiezTheme";
import { isInitiallyDark, setIsDarkMode } from "@waldiez/theme/utils";

/**
 * Provider component for managing the Waldiez theme.
 * This component provides the current theme state and functions to toggle or set the theme.
 * @param children - The child components to be rendered within the provider.
 * @param initialDark - Optional initial theme state. If true, the theme starts in dark mode; if false or undefined, it starts in light mode.
 */
export const WaldiezThemeProvider: React.FC<{
    children: ReactNode;
    initialDark?: boolean;
}> = ({ children, initialDark }) => {
    const [isDark, setIsDark] = useState(() =>
        /* c8 ignore next */
        typeof initialDark === "boolean" ? initialDark : isInitiallyDark(),
    );
    /* c8 ignore next 3 */
    if (typeof initialDark === "boolean") {
        setIsDarkMode(initialDark);
    }
    /**
     * Toggles the current theme between dark and light mode.
     * It updates the state and calls setIsDarkMode to persist the theme preference.
     */
    const toggleTheme = () => {
        setIsDark(prev => {
            setIsDarkMode(!prev);
            return !prev;
        });
    };
    /**
     * Sets the theme to dark or light mode.
     * @param dark - If true, sets the theme to dark mode; otherwise, sets it to light mode.
     */
    /* c8 ignore next 4 */
    const setTheme = (dark: boolean) => {
        setIsDarkMode(dark);
        setIsDark(dark);
    };
    useEffect(() => {
        if (typeof initialDark === "boolean") {
            setIsDarkMode(initialDark);
        }

        // Observer to detect external theme changes
        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                if (mutation.type === "attributes" && mutation.attributeName === "class") {
                    const bodyClassList = document.body.classList;
                    const externalIsDark =
                        bodyClassList.contains("waldiez-dark") ||
                        bodyClassList.contains("dark-theme") || // Add other possible dark class names
                        (!bodyClassList.contains("waldiez-light") &&
                            !bodyClassList.contains("light-theme") &&
                            window.matchMedia("(prefers-color-scheme: dark)").matches);

                    // Only update if there's a mismatch
                    setIsDark(prev => {
                        if (prev !== externalIsDark) {
                            return externalIsDark;
                        }
                        return prev;
                    });
                }
            });
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ["class"],
        });

        return () => observer.disconnect();
    }, [initialDark]);
    return (
        <WaldiezThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
            {children}
        </WaldiezThemeContext.Provider>
    );
};
