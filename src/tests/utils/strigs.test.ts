/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { capitalize, getDateString } from "@waldiez/utils";

describe("capitalize", () => {
    it("should capitalize the first letter", () => {
        expect(capitalize("hello")).toBe("Hello");
    });
    it("should lowercase the rest of the string", () => {
        expect(capitalize("HELLO")).toBe("Hello");
    });
});

describe("getDateString", () => {
    it("should return a date string", () => {
        const date = new Date().toISOString();
        expect(getDateString(date)).toEqual(expect.any(String));
    });
});
