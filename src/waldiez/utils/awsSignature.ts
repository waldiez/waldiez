/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { hmacSha256, sha256 } from "@waldiez/utils/crypto";

/**
 * Bedrock model validation helpers
 */
export const awsSignatureUtils = {
    /**
     * Generate an AWS Signature Version 4 for a request
     */
    // eslint-disable-next-line max-statements
    async signRequest(
        method: string,
        url: string,
        region: string,
        service: string,
        accessKey: string,
        secretKey: string,
        sessionToken?: string | null,
        headers: Record<string, string> = {},
        payload: string = "",
    ): Promise<Record<string, string>> {
        // Prepare request details
        const { host, path } = this.parseUrl(url);
        const now = new Date();
        const amzdate = now.toISOString().replace(/[:-]|\.\d{3}/g, "");
        const datestamp = amzdate.slice(0, 8);

        // Empty payload hash (for GET requests)
        const payloadHash = await sha256(payload);

        // Prepare headers
        const requestHeaders: { [key: string]: string } = {
            ...headers,
            host,
            "x-amz-date": amzdate,
            "x-amz-content-sha256": payloadHash,
        };

        // Add session token if available
        if (sessionToken) {
            requestHeaders["x-amz-security-token"] = sessionToken;
        }

        // Create canonical request components
        const canonicalHeaders = this.buildCanonicalHeaders(requestHeaders);
        const signedHeaders = this.buildSignedHeadersList(requestHeaders);

        // Build the canonical request
        const canonicalRequest = [
            method,
            path,
            "", // Query string (empty for this use case)
            canonicalHeaders,
            signedHeaders,
            payloadHash,
        ].join("\n");

        // Build string to sign
        const algorithm = "AWS4-HMAC-SHA256";
        const credentialScope = `${datestamp}/${region}/${service}/aws4_request`;
        const stringToSign = [algorithm, amzdate, credentialScope, await sha256(canonicalRequest)].join("\n");

        // Calculate signature
        const signingKey = await this.getSignatureKey(secretKey, datestamp, region, service);
        const signature = await hmacSha256(signingKey, stringToSign, "hex");

        // Add authorization header
        requestHeaders["Authorization"] =
            `${algorithm} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

        return requestHeaders;
    },

    /**
     * Parse URL into host and path components
     * @param url - The URL to parse
     * @returns An object containing the host and path
     */
    parseUrl(url: string): { host: string; path: string } {
        try {
            const parsed = new URL(url);
            return {
                host: parsed.host,
                path: parsed.pathname,
            };
        } catch (_) {
            throw new Error(`Invalid URL: ${url}`);
        }
    },

    /**
     * Build canonical headers string
     * @param headers - Headers to include in the canonical request
     * @returns A string of canonical headers formatted for AWS Signature V4
     */
    buildCanonicalHeaders(headers: Record<string, string>): string {
        return Object.keys(headers)
            .sort()
            .map(key => `${key.toLowerCase()}:${headers[key]?.trim()}\n`)
            .join("");
    },

    /**
     * Build signed headers list
     * @param headers - Headers to include in the signed headers
     * @returns A string of signed headers formatted for AWS Signature V4
     */
    buildSignedHeadersList(headers: Record<string, string>): string {
        return Object.keys(headers)
            .sort()
            .map(key => key.toLowerCase())
            .join(";");
    },

    /**
     * Derive signing key for AWS Signature V4
     * @param key - The secret access key
     * @param dateStamp - The date in YYYYMMDD format
     * @param regionName - The AWS region name
     * @param serviceName - The AWS service name
     * @returns A promise that resolves to the signing key as a Uint8Array
     * @throws Error if the key derivation fails
     */
    async getSignatureKey(
        key: string,
        dateStamp: string,
        regionName: string,
        serviceName: string,
    ): Promise<Uint8Array> {
        const kDate = (await hmacSha256("AWS4" + key, dateStamp)) as Uint8Array;
        const kRegion = (await hmacSha256(kDate, regionName)) as Uint8Array;
        const kService = (await hmacSha256(kRegion, serviceName)) as Uint8Array;
        return (await hmacSha256(kService, "aws4_request")) as Uint8Array;
    },
};
