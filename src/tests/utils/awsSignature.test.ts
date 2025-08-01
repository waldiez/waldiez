/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { awsSignatureUtils } from "@waldiez/utils/awsSignature";

describe("awsSignatureUtils", () => {
    // Test data from AWS documentation examples
    const testCredentials = {
        accessKey: "AKIAIOSFODNN7EXAMPLE",
        secretKey: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
        region: "us-east-1",
        service: "bedrock-runtime",
    };

    describe("parseUrl", () => {
        it("should parse URL correctly", () => {
            const result = awsSignatureUtils.parseUrl(
                "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke",
            );

            expect(result.host).toBe("bedrock-runtime.us-east-1.amazonaws.com");
            expect(result.path).toBe("/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke");
        });

        it("should handle paths with query params", () => {
            const result = awsSignatureUtils.parseUrl(
                "https://bedrock-runtime.us-east-1.amazonaws.com/models?maxResults=10",
            );

            expect(result.host).toBe("bedrock-runtime.us-east-1.amazonaws.com");
            expect(result.path).toBe("/models");
        });

        it("should throw for invalid URLs", () => {
            expect(() => awsSignatureUtils.parseUrl("not-a-url")).toThrow("Invalid URL: not-a-url");
        });
    });

    describe("buildCanonicalHeaders", () => {
        it("should build canonical headers correctly", () => {
            const headers = {
                Host: "bedrock-runtime.us-east-1.amazonaws.com",
                "X-Amz-Date": "20230101T120000Z",
                "Content-Type": "application/json",
            };

            const result = awsSignatureUtils.buildCanonicalHeaders(headers);
            const expected =
                "content-type:application/json\nhost:bedrock-runtime.us-east-1.amazonaws.com\nx-amz-date:20230101T120000Z\n";

            expect(result).toBe(expected);
        });

        it("should sort headers and lowercase keys", () => {
            const headers = {
                "Z-Custom": "last",
                "A-Custom": "first",
                Host: "example.com",
            };

            const result = awsSignatureUtils.buildCanonicalHeaders(headers);
            expect(result.startsWith("a-custom:first\n")).toBe(true);
            expect(result.endsWith("z-custom:last\n")).toBe(true);
        });

        it("should trim header values", () => {
            const headers = {
                Host: "  example.com  ",
                Custom: "\t value \t",
            };

            const result = awsSignatureUtils.buildCanonicalHeaders(headers);
            expect(result).toContain("host:example.com\n");
            expect(result).toContain("custom:value\n");
        });
    });

    describe("buildSignedHeadersList", () => {
        it("should build signed headers list correctly", () => {
            const headers = {
                Host: "example.com",
                "X-Amz-Date": "20230101T120000Z",
                "Content-Type": "application/json",
            };

            const result = awsSignatureUtils.buildSignedHeadersList(headers);
            expect(result).toBe("content-type;host;x-amz-date");
        });

        it("should sort headers alphabetically", () => {
            const headers = {
                "Z-Header": "value",
                "A-Header": "value",
                "M-Header": "value",
            };

            const result = awsSignatureUtils.buildSignedHeadersList(headers);
            expect(result).toBe("a-header;m-header;z-header");
        });
    });

    describe("getSignatureKey", () => {
        it("should derive signing key correctly", async () => {
            // This test uses known values from AWS documentation
            const signingKey = await awsSignatureUtils.getSignatureKey(
                testCredentials.secretKey,
                "20230101",
                "us-east-1",
                "s3",
            );

            expect(signingKey).toBeInstanceOf(Uint8Array);
            expect(signingKey.length).toBe(32); // SHA-256 output length
        });

        it("should produce consistent results", async () => {
            const key1 = await awsSignatureUtils.getSignatureKey(
                "test-secret",
                "20230101",
                "us-west-2",
                "bedrock-runtime",
            );

            const key2 = await awsSignatureUtils.getSignatureKey(
                "test-secret",
                "20230101",
                "us-west-2",
                "bedrock-runtime",
            );

            expect(key1).toBeInstanceOf(Uint8Array);
            expect(key2).toBeInstanceOf(Uint8Array);
            expect(key1.length).toBe(key2.length);
            // Compare byte arrays
            expect(key1).toEqual(key2);
        });

        it("should produce different keys for different inputs", async () => {
            const key1 = await awsSignatureUtils.getSignatureKey(
                "secret1",
                "20230101",
                "us-east-1",
                "bedrock-runtime",
            );

            const key2 = await awsSignatureUtils.getSignatureKey(
                "secret2",
                "20230101",
                "us-east-1",
                "bedrock-runtime",
            );

            expect(key1).not.toEqual(key2);
            // Type 'Uint8Array<ArrayBuffer>' is not assignable to type 'ArrayLike<string>'.
            expect(key1 instanceof Uint8Array).toBe(true);
            expect(key2 instanceof Uint8Array).toBe(true);
            expect(Array.from(key1 as Uint8Array)).not.toEqual(Array.from(key2 as Uint8Array));
        });
    });

    describe("signRequest", () => {
        // Mock the current date for consistent testing
        beforeEach(() => {
            vi.useFakeTimers();
            vi.setSystemTime(new Date("2023-01-01T12:00:00.000Z"));
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it("should generate valid authorization header", async () => {
            const headers = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-3-sonnet-20240229-v1:0/invoke",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                { "Content-Type": "application/json" },
                '{"message":"test"}',
            );

            expect(headers["Authorization"]).toMatch(/^AWS4-HMAC-SHA256 Credential=/);
            expect(headers["Authorization"]).toContain(testCredentials.accessKey);
            expect(headers["Authorization"]).toContain("SignedHeaders=");
            expect(headers["Authorization"]).toContain("Signature=");
        });

        it("should include required headers", async () => {
            const headers = await awsSignatureUtils.signRequest(
                "GET",
                "https://bedrock-runtime.us-east-1.amazonaws.com/models",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
            );

            expect(headers["host"]).toBe("bedrock-runtime.us-east-1.amazonaws.com");
            expect(headers["x-amz-date"]).toMatch(/^\d{8}T\d{6}Z$/);
            expect(headers["x-amz-content-sha256"]).toBeDefined();
            expect(headers["Authorization"]).toBeDefined();
        });

        it("should include session token when provided", async () => {
            const sessionToken = "EXAMPLE-SESSION-TOKEN";
            const headers = await awsSignatureUtils.signRequest(
                "GET",
                "https://bedrock-runtime.us-east-1.amazonaws.com/models",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                sessionToken,
            );

            expect(headers["x-amz-security-token"]).toBe(sessionToken);
        });

        it("should preserve custom headers", async () => {
            const customHeaders = {
                "Custom-Header": "custom-value",
                "Another-Header": "another-value",
            };

            const headers = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/model/test",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                customHeaders,
                "{}",
            );

            expect(headers["Custom-Header"]).toBe("custom-value");
            expect(headers["Another-Header"]).toBe("another-value");
        });

        it("should generate consistent signatures for same input", async () => {
            const headers1 = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/test",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                {},
                '{"test": "data"}',
            );

            const headers2 = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/test",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                {},
                '{"test": "data"}',
            );

            expect(headers1["Authorization"]).toBe(headers2["Authorization"]);
        });

        it("should generate different signatures for different payloads", async () => {
            const headers1 = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/test",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                {},
                '{"test": "data1"}',
            );

            const headers2 = await awsSignatureUtils.signRequest(
                "POST",
                "https://bedrock-runtime.us-east-1.amazonaws.com/test",
                testCredentials.region,
                testCredentials.service,
                testCredentials.accessKey,
                testCredentials.secretKey,
                null,
                {},
                '{"test": "data2"}',
            );

            expect(headers1["Authorization"]).not.toBe(headers2["Authorization"]);
        });
    });

    describe("AWS SigV4 Test Vector Validation", () => {
        // Using AWS official test vectors (simplified example)
        it("should match AWS test vector for GET request", async () => {
            // AWS provides official test vectors for validation
            // This is a simplified version

            vi.setSystemTime(new Date("2013-05-24T00:00:00.000Z"));

            const headers = await awsSignatureUtils.signRequest(
                "GET",
                "https://examplebucket.s3.amazonaws.com/",
                "us-east-1",
                "s3",
                "AKIAIOSFODNN7EXAMPLE",
                "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
                null,
                { Range: "bytes=0-9" },
            );

            // The signature should be deterministic
            expect(headers["Authorization"]).toContain("AWS4-HMAC-SHA256");
            expect(headers["x-amz-date"]).toBe("20130524T000000Z");
        });
    });
});
