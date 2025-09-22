/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Check if a value is a Promise-like (thenable)
 * @param value - The value to check
 * @returns boolean
 */
export const isPromise = <T = unknown>(value: unknown): value is Promise<T> => {
    return Boolean(
        value !== null &&
            (typeof value === "object" || typeof value === "function") &&
            typeof (value as any).then === "function",
    );
};
