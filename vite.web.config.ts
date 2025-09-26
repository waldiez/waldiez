/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { defineConfig, normalizePath } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";

import packageJson from "./package.json";
import { transformPublicFiles } from "./vite.plugins";

dotenv.config({ quiet: true, encoding: "utf8" });
const normalizedResolve = (...paths: string[]): string => normalizePath(path.resolve(__dirname, ...paths));

// noinspection DuplicatedCode
/**
 * Get the version from package.json, ensuring it is a valid semver.
 * @returns - The version string, cleaned and validated.
 */
const getVersion = (): string => {
    const version = packageJson.version;
    if (!version) {
        throw new Error("Version not found in package.json");
    }
    // remove leading 'v' if present
    const cleanedVersion = version.startsWith("v") ? version.slice(1) : version;
    // make sure it's a valid semver
    const semverRegex = /^\d+\.\d+\.\d+(-\w+)?$/;
    if (!semverRegex.test(cleanedVersion)) {
        throw new Error(`Invalid version format: ${cleanedVersion}`);
    }
    return JSON.stringify(cleanedVersion);
};
/**
 * Get the base URL for the application based on the command / mode.
 * @param command - The command being executed, either "build" or "serve".
 * @returns - The base URL as a string.
 */
const getBaseUrl = (command: "build" | "serve"): string => {
    if (command === "build") {
        return process.env["BASE_URL"] || "./";
    }
    return "./";
};

/**
 * Get the Hub API URL from environment variables or default to a predefined URL.
 * Validates that the URL starts with "http" to ensure it's a proper URL.
 * @returns - The Hub API URL as a JSON string.
 * @throws - Error if the URL is invalid.
 */
const getHubUrl = (): string => {
    const hubUrl = process.env.HUB_API_URL || "https://api.waldiez.io";
    if (!hubUrl.startsWith("http")) {
        throw new Error(`Invalid HUB_API_URL: ${hubUrl}`);
    }
    return JSON.stringify(hubUrl);
};
/**
 * Get the public directory based on the command.
 * If building, only include the logo directory; otherwise, include all public assets.
 * @param _command - The command being executed, either "build" or "serve".
 * @returns - The path to the public directory.
 */
const getPublicDir = (_command: "build" | "serve"): string => {
    return normalizedResolve("public");
};

type CopyTarget = { src: string; dest: string };

/**
 * Build viteStaticCopy targets safely
 */
const safeTargets = (entries: [string, string][]): CopyTarget[] => {
    return entries
        .map(([src, dest]) => {
            const abs = normalizedResolve("public", src);
            const hasGlob = src.includes("*");

            if (hasGlob) {
                const dir = abs.replace(/\/\*.*$/, ""); // strip glob part
                if (!fs.existsSync(dir)) {
                    return null;
                }
            } else if (!fs.existsSync(abs)) {
                return null;
            }

            return { src: abs, dest };
        })
        .filter((t): t is CopyTarget => t !== null);
};

/* separate config for building a static site (and not a library) */
// https://vitejs.dev/config/
// noinspection JSUnusedGlobalSymbols
export default defineConfig(({ command }) => {
    const base = getBaseUrl(command);
    const publicDir = getPublicDir(command);
    // noinspection DuplicatedCode
    return {
        publicDir,
        base,
        define: {
            __WALDIEZ_VERSION__: getVersion(),
            __HUB_API_URL__: getHubUrl(),
        },
        build: {
            emptyOutDir: true,
            minify: "terser",
            terserOptions: {
                compress: {
                    drop_console: true,
                    drop_debugger: true,
                },
            },
            target: "esnext",
            outDir: normalizedResolve(__dirname, "out", "static"),
            rollupOptions: {
                output: {
                    manualChunks: function (id) {
                        if (id.includes("node_modules")) {
                            // Split the path to get the package name
                            const parts = id.split("node_modules/");
                            if (parts.length > 0 && parts[1]) {
                                // Return the package name, which is the first part after "node_modules/"
                                return parts[1].split("/")[0];
                            }
                            // return id.toString().split("node_modules/")[1].split("/")[0].toString();
                        }
                    },
                },
                // cspell: disable-next-line
                onwarn(warning, warn) {
                    // Suppress specific "empty chunk" harmless warnings
                    if (warning.code === "EMPTY_BUNDLE") {
                        return;
                    }
                    warn(warning);
                },
            },
        },
        resolve: {
            alias: {
                "@waldiez": normalizedResolve(__dirname, "src", "waldiez"),
            },
        },
        plugins: [
            react(),
            tailwindcss(),
            transformPublicFiles("web"),
            // addHeaderToDistFiles(),
            viteStaticCopy({
                targets: safeTargets([
                    ["icons/*", "icons"],
                    ["screenshots/*", "screenshots"],
                    ["apple-touch-icon.png", ""],
                    ["favicon.ico", ""],
                    ["icon.icns", ""],
                    ["robots.txt", ""],
                    ["browserconfig.xml", ""],
                    ["site.webmanifest", ""],
                    // optional? (might not exist)
                    ["vs/*", "vs"],
                    ["min-maps/*", "min-maps"],
                ]),
            }),
        ],
    };
});
