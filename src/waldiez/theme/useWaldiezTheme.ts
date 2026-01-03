/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { createContext, useContext } from "react";

/**
 * Type definition for the Waldiez theme context.
 * This type includes the current theme state and functions to toggle or set the theme.
 * @param isDark - boolean - Indicates if the current theme is dark mode.
 * @param toggleTheme - function - Function to toggle the theme between dark and light mode.
 * @param setTheme - function - Function to set the theme to a specific mode (dark or light).
 */
type WaldiezThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
    setTheme: (dark: boolean) => void;
};

/**
 * Context for managing the Waldiez theme.
 * This context provides the current theme state and a function to toggle the theme.
 */
export const WaldiezThemeContext = createContext<WaldiezThemeContextType | undefined>(undefined);

/**
 * Hook to use the WaldiezThemeContext.
 * This hook provides access to the theme context values.
 * @returns The current theme context values.
 * @throws Error if the hook is used outside of a WaldiezThemeProvider context.
 */
export const useWaldiezTheme = (): WaldiezThemeContextType => {
    const context = useContext(WaldiezThemeContext);
    if (!context) {
        throw new Error("useWaldiezTheme must be used within a WaldiezThemeProvider context");
    }
    return context;
};
