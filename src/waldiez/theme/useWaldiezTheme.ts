/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { createContext, useContext } from "react";

type WaldiezThemeContextType = {
    isDark: boolean;
    toggleTheme: () => void;
};

export const WaldiezThemeContext = createContext<WaldiezThemeContextType | undefined>(undefined);

export const useWaldiezTheme = (): WaldiezThemeContextType => {
    const context = useContext(WaldiezThemeContext);
    if (!context) {
        throw new Error("useWaldiezTheme must be used within a WaldiezThemeProvider context");
    }
    return context;
};
