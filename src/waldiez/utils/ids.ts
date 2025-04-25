/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

export const getId = () => {
    return `${Date.now()}${nanoid()}`;
};
