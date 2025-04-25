/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const isInitiallyDark = () => {
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

export const setIsDarkMode = (isDark: boolean) => {
    setBodyClass(isDark);
    setStorageTheme(isDark);
};

const setBodyClass = (isDark: boolean) => {
    if (isDark) {
        document.body.classList.remove("waldiez-light");
        document.body.classList.add("waldiez-dark");
    } else {
        document.body.classList.remove("waldiez-dark");
        document.body.classList.add("waldiez-light");
    }
};

const setStorageTheme = (isDark: boolean) => {
    if ("localStorage" in window) {
        localStorage.setItem("waldiez-theme", isDark ? "dark" : "light");
    }
};
