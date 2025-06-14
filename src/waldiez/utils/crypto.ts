/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Get the crypto object for browser environment
 * @returns - Crypto The Crypto object
 * @throws - If the Web Crypto API is not supported
 */
const getCrypto = (): Crypto => {
    // Modern browsers
    if (window.crypto && window.crypto.subtle) {
        return window.crypto;
    }
    // Fallback for some edge cases or test environments
    if (globalThis.crypto && globalThis.crypto.subtle) {
        return globalThis.crypto;
    }
    throw new Error("Web Crypto API not supported in this browser. Please use a modern browser with HTTPS.");
};
/**
 * Helper function to compute SHA-256 hash
 * @param message - The message to hash
 * @returns Hex string of the hash
 */
export const sha256 = async (message: string): Promise<string> => {
    // Use the Web Crypto API for hashing (works in browsers and newer Node.js versions)
    try {
        const crypto = getCrypto();
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, "0"))
            .join("");
    } catch (error) {
        console.error("Error computing SHA-256 hash:", error);
        throw new Error("Failed to compute SHA-256 hash. Ensure you are using a supported environment.");
    }
};

/**
 * Helper function to compute HMAC SHA-256
 * @param key - The key (either string or Uint8Array)
 * @param message - The message to sign
 * @param outputFormat - The output format ('hex' for hex string, otherwise Uint8Array)
 * @returns The HMAC result
 */
export const hmacSha256 = async (
    key: string | Uint8Array,
    message: string,
    outputFormat = "",
): Promise<string | Uint8Array> => {
    try {
        const crypto = getCrypto();
        const keyBuffer = typeof key === "string" ? new TextEncoder().encode(key) : key;
        const messageBuffer = new TextEncoder().encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            "raw",
            keyBuffer,
            { name: "HMAC", hash: "SHA-256" },
            false,
            ["sign"],
        );

        const signature = await crypto.subtle.sign("HMAC", cryptoKey, messageBuffer);

        if (outputFormat === "hex") {
            return Array.from(new Uint8Array(signature))
                .map(b => b.toString(16).padStart(2, "0"))
                .join("");
        }

        return new Uint8Array(signature);
    } catch (error) {
        throw new Error(
            `Error computing HMAC SHA-256: ${error instanceof Error ? error.message : String(error)}`,
        );
    }
};
