/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { capitalize, getDateString, getFriendlyString } from "@waldiez/utils";

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

describe("getFriendlyString", () => {
    it("should return a friendly string", () => {
        const str = "hello world";
        expect(getFriendlyString(str)).toBe("Hello World");
    });
    it("should handle dashes", () => {
        const str = "hello-world";
        expect(getFriendlyString(str)).toBe("Hello World");
    });
    it("should handle underscores", () => {
        const str = "hello_world";
        expect(getFriendlyString(str)).toBe("Hello World");
    });
    it("should handle camel case", () => {
        const str = "helloWorld";
        expect(getFriendlyString(str)).toBe("Hello World");
    });
});
