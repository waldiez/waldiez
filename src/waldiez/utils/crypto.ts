/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Helper function to compute SHA-256 hash
 * @param message - The message to hash
 * @returns Hex string of the hash
 */
export const sha256 = async (message: string): Promise<string> => {
    // Use the Web Crypto API for hashing (works in browsers and newer Node.js versions)
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("");
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
    const keyBuffer = key instanceof Uint8Array ? key : new TextEncoder().encode(key);
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
};
