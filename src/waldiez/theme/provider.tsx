/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { ReactNode, useEffect, useState } from "react";

import { WaldiezThemeContext } from "@waldiez/theme/useWaldiezTheme";
import { isInitiallyDark, setIsDarkMode } from "@waldiez/theme/utils";

export const WaldiezThemeProvider: React.FC<{ children: ReactNode; initial?: boolean }> = ({
    children,
    initial,
}) => {
    const initialDark = typeof initial === "boolean" ? initial : isInitiallyDark();
    const [isDark, setIsDark] = useState(initialDark);
    useEffect(() => {
        const initialDark = isInitiallyDark();
        setIsDark(initialDark);
    }, []);
    const toggleTheme = () => {
        setIsDark(prev => {
            setIsDarkMode(!prev);
            return !prev;
        });
    };
    return (
        <WaldiezThemeContext.Provider value={{ isDark, toggleTheme }}>
            {children}
        </WaldiezThemeContext.Provider>
    );
};
