/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

/**
 * Generate a unique ID using the current timestamp and nanoid.
 *
 * This function combines the current timestamp with a nanoid to create a unique identifier.
 * The timestamp ensures that the ID is unique across different calls, while nanoid adds randomness.
 *
 * @returns A unique string ID.
 */
export const getId = () => {
    return `${Date.now()}${nanoid()}`;
};
