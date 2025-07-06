/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactNode, useState } from "react";

import { WaldiezThemeContext } from "@waldiez/theme/useWaldiezTheme";
import { isInitiallyDark, setIsDarkMode } from "@waldiez/theme/utils";

/**
 * Provider component for managing the Waldiez theme.
 * This component provides the current theme state and functions to toggle or set the theme.
 * @param children - The child components to be rendered within the provider.
 * @param initial - Optional initial theme state (dark or light).
 */
export const WaldiezThemeProvider: React.FC<{
    children: ReactNode;
    initialDark?: boolean;
}> = ({ children, initialDark }) => {
    const [isDark, setIsDark] = useState(() =>
        typeof initialDark === "boolean" ? initialDark : isInitiallyDark(),
    );
    if (typeof initialDark === "boolean") {
        setIsDarkMode(initialDark);
    }
    const toggleTheme = () => {
        setIsDark(prev => {
            setIsDarkMode(!prev);
            return !prev;
        });
    };
    const setTheme = (dark: boolean) => {
        setIsDarkMode(dark);
        setIsDark(dark);
    };
    return (
        <WaldiezThemeContext.Provider value={{ isDark, toggleTheme, setTheme }}>
            {children}
        </WaldiezThemeContext.Provider>
    );
};
