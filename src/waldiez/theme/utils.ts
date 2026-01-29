/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */

/**
 * Checks if the initial theme is dark mode based on localStorage, body class, or system preference.
 * @returns boolean -  True if the initial theme is dark mode, false otherwise.
 */
export const isInitiallyDark = () => {
    /* c8 ignore next 3 -- @preserve */
    if (typeof window === "undefined") {
        return false;
    }

    const ls = window.localStorage as unknown;

    if (ls && typeof (ls as Storage).getItem === "function") {
        // In some environments accessing localStorage can throw (privacy mode / disabled)
        try {
            const stored = (ls as Storage).getItem("waldiez-theme");
            if (stored === "dark") {
                return true;
            }
            if (stored === "light") {
                return false;
            }
        } catch {
            // ignore storage failures
        }
    }

    if (document.body.classList.contains("waldiez-dark")) {
        return true;
    }
    if (document.body.classList.contains("waldiez-light")) {
        return false;
    }

    const darkQuery = window.matchMedia("(prefers-color-scheme: dark)");
    return darkQuery.matches;
};

/**
 * Sets the theme mode (dark or light) by updating the body class and localStorage.
 * @param isDark - boolean - True for dark mode, false for light mode.
 */
export const setIsDarkMode = (isDark: boolean) => {
    setBodyClass(isDark);
    setStorageTheme(isDark);
    setDocumentClass(isDark);
};

/**
 * Sets the body class based on the theme mode (dark or light).
 * @param isDark - boolean - True for dark mode, false for light mode.
 */
const setBodyClass = (isDark: boolean) => {
    document.body.classList.remove("waldiez-light", "waldiez-dark");
    if (isDark) {
        document.body.classList.add("waldiez-dark");
    } else {
        document.body.classList.add("waldiez-light");
    }
};

const setDocumentClass = (isDark: boolean) => {
    document.documentElement.classList.remove("dark", "light");
    if (isDark) {
        document.documentElement.classList.add("dark");
    } else {
        document.documentElement.classList.add("light");
    }
};

/**
 * Sets the theme in localStorage.
 * @param isDark - boolean - True for dark mode, false for light mode.
 */
const setStorageTheme = (isDark: boolean) => {
    /* c8 ignore next 3 -- @preserve */
    if (typeof window === "undefined") {
        return;
    }

    const ls = window.localStorage as unknown;

    if (ls && typeof (ls as Storage).setItem === "function") {
        try {
            (ls as Storage).setItem("waldiez-theme", isDark ? "dark" : "light");
        } catch {
            // ignore storage failures (disabled, quota, privacy mode)
        }
    }
};
