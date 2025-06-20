/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

/**
 * Checks if the initial theme is dark mode based on localStorage, body class, or system preference.
 * @returns boolean -  True if the initial theme is dark mode, false otherwise.
 */
export const isInitiallyDark = () => {
    if (typeof window === "undefined") {
        return false;
    }
    if ("localStorage" in window) {
        if (localStorage.getItem("waldiez-theme") === "dark") {
            return true;
        }
        if (localStorage.getItem("waldiez-theme") === "light") {
            return false;
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
};

/**
 * Sets the body class based on the theme mode (dark or light).
 * @param isDark - boolean - True for dark mode, false for light mode.
 */
const setBodyClass = (isDark: boolean) => {
    if (isDark) {
        document.body.classList.remove("waldiez-light");
        document.body.classList.add("waldiez-dark");
    } else {
        document.body.classList.remove("waldiez-dark");
        document.body.classList.add("waldiez-light");
    }
};

/**
 * Sets the theme in localStorage.
 * @param isDark - boolean - True for dark mode, false for light mode.
 */
const setStorageTheme = (isDark: boolean) => {
    if (typeof window !== "undefined" && "localStorage" in window) {
        localStorage.setItem("waldiez-theme", isDark ? "dark" : "light");
    }
};
