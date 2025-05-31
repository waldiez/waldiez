/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { hmacSha256, sha256 } from "@waldiez/utils/crypto";

// Precomputed test values
const testMessage = "hello world";
const testKey = "secret";

// SHA-256 of "hello world" (hex)
const expectedSha256 = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";

// HMAC-SHA256 of "hello world" with key "secret" (hex)
const expectedHmacSha256 = "734cc62f32841568f45715aeb9f4d7891324e6d948e4c6c60c0621cdac48623a";
// const expectedHmacSha256 = "c6e2ad11683b3cd09dc3c8b2e49bba0b3f453cb007493f10ce07d8fed484f485";

describe("sha256", () => {
    it("should compute correct SHA-256 hash of a message", async () => {
        const hash = await sha256(testMessage);
        expect(hash).toBe(expectedSha256);
    });

    it("should return a string of 64 hex characters", async () => {
        const hash = await sha256("any input");
        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });
});

describe("hmacSha256", () => {
    it("should compute correct HMAC SHA-256 with string key", async () => {
        const hmac = await hmacSha256(testKey, testMessage, "hex");
        expect(hmac).toBe(expectedHmacSha256);
    });

    it("should compute correct HMAC SHA-256 with Uint8Array key", async () => {
        const encodedBytes = new TextEncoder().encode(testKey);
        const keyBytes = new Uint8Array(encodedBytes);
        const hmac = await hmacSha256(keyBytes, testMessage, "hex");
        expect(hmac).toBe(expectedHmacSha256);
    });

    it("should return Uint8Array when outputFormat is not 'hex'", async () => {
        const result = await hmacSha256(testKey, testMessage);
        expect(result).toBeInstanceOf(Uint8Array);
        expect((result as Uint8Array).length).toBe(32); // SHA-256 => 32 bytes
    });
});
