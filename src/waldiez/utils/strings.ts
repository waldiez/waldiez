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
