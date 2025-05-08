/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const capitalize = (s: string) => {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
};

export const getDateString = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString() + " " + d.toLocaleTimeString();
};

export const getFriendlyString = (str: string) => {
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/([0-9])/g, " $1")
        .replace(/_/g, " ")
        .replace(/-/g, " ")
        .trim()
        .toLowerCase()
        .split(" ")
        .map(word => capitalize(word))
        .join(" ");
};
