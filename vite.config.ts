/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "fs-extra";
import { resolve } from "path";
import { defineConfig, normalizePath } from "vite";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";
import { viteStaticCopy } from "vite-plugin-static-copy";

import packageJson from "./package.json";
import { addHeaderToDistFiles, transformPublicFiles } from "./vite.plugins";

dotenv.config({ quiet: true, encoding: "utf8" });
const normalizedResolve = (...paths: string[]): string => normalizePath(resolve(__dirname, ...paths));
const defaultIncludes = ["**/tests/**/*.test.{ts,tsx}"];
const defaultBrowserIncludes = ["**/ui-tests/**/*.test.{ts,tsx}"];
const isBrowserTest = process.argv.includes("--browser.enabled");
const recordingsDir = normalizedResolve(".local", "recordings");
fs.ensureDirSync(recordingsDir);

const viewport = { width: 1280, height: 720 };
// coverage thresholds, let's try to keep them high
const LOWER_THRESHOLD = 80;

const thresholds = {
    statements: LOWER_THRESHOLD,
    branches: LOWER_THRESHOLD,
    functions: LOWER_THRESHOLD,
    lines: LOWER_THRESHOLD,
};

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

const getHubUrl = (): string => {
    const hubUrl = process.env.HUB_API_URL || "https://api.waldiez.io";
    if (!hubUrl.startsWith("http")) {
        throw new Error(`Invalid HUB_API_URL: ${hubUrl}`);
    }
    return JSON.stringify(hubUrl);
};

/**
 * Get the public directory based on the command.
 * @param command - The command being executed, either "build" or "serve".
 * @returns - The path to the public directory.
 */
const getPublicDir = (command: "build" | "serve"): string | false => {
    return command === "build" ? false : normalizedResolve("public");
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

// https://vitejs.dev/config/
/// <reference types="vitest/config" /
// noinspection JSUnusedGlobalSymbols,DuplicatedCode
export default defineConfig(({ command }) => ({
    publicDir: getPublicDir(command),
    server: {
        headers: {
            "content-security-policy-report-only":
                "default-src 'none'; manifest-src 'self'; style-src 'self' https://cdn.jsdelivr.net/npm/ data: 'unsafe-inline'; worker-src 'self' blob: https://cdn.jsdelivr.net/npm/; script-src 'self' blob: https://cdn.jsdelivr.net/npm/ https://drag-drop-touch-js.github.io/; font-src 'self' https://cdn.jsdelivr.net/npm/ data:; img-src 'self' https://cdn.jsdelivr.net/npm/ data:; connect-src *; report-to /_/csp",
            "content-security-policy": "manifest-src 'self';",
        },
    },
    define: {
        __WALDIEZ_VERSION__: getVersion(),
        __HUB_API_URL__: getHubUrl(),
    },
    build: {
        emptyOutDir: true,
        outDir: normalizedResolve("dist"),
        lib: {
            entry: normalizedResolve("src", "waldiez", "index.ts"),
            name: "Waldiez",
            formats: ["es", "umd"],
            fileName: "@waldiez",
            cssFileName: "@waldiez",
        },
        sourcemap: command === "serve",
        minify: "terser" as const,
        rollupOptions: {
            external: [
                "react",
                "react-dom",
                "react/jsx-runtime",
                "@xyflow/react",
                "recharts",
                "framer-motion",
                "zundo",
                "zustand",
                "jszip",
                "@monaco-editor/react",
                "highlight.js",
                "marked",
                "react-icons",
                "react-icons/fa",
                "react-icons/fa6",
                "react-icons/ai",
                "react-icons/gi",
                "react-icons/go",
                "react-icons/md",
            ],
            output: {
                exports: "named",
                globals: {
                    react: "React",
                    "react-dom": "ReactDom",
                    "react/jsx-runtime": "JsxRuntime",
                    "@xyflow/react": "ReactFlow",
                    "@monaco-editor/react": "react$1",
                    recharts: "Recharts",
                    "framer-motion": "FramerMotion",
                    zundo: "Zundo",
                    zustand: "Zustand",
                    "zustand/shallow": "ZustandShallow",
                    "zustand/traditional": "ZustandTraditional",
                    jszip: "Jszip",
                    "react-error-boundary": "ReactErrorBoundary",
                    "strip-ansi": "StripAnsi",
                    "highlight.js": "HighlightJs",
                    marked: "Marked",
                    "react-icons": "ReactIcons",
                    "react-icons/fa": "ReactIconsFa",
                    "react-icons/fa6": "ReactIconsFa6",
                    "react-icons/ai": "ReactIconsAi",
                    "react-icons/gi": "ReactIconsGi",
                    "react-icons/go": "ReactIconsGo",
                    "react-icons/md": "ReactIconsMd",
                },
            },
        },
        terserOptions: {
            format: {
                comments: false,
            },
            compress: {
                drop_console: true,
                drop_debugger: true,
            },
            mangle: true,
        },
    },
    resolve: {
        alias: {
            "@waldiez": normalizedResolve("src", "waldiez"),
        },
    },
    plugins: [
        react(),
        tailwindcss(),
        externalizeDeps(),
        dts({
            insertTypesEntry: true,
            rollupTypes: true,
            tsconfigPath: "./tsconfig.build.json",
            beforeWriteFile: (filePath, content) => {
                // remove SPDX and Copyright comments from the generated types
                // we'll add one header later at the top of the generated file
                content = content.replace(/\/\*\*[\s\S]*?(?:SPDX|Copyright)[\s\S]*?\*\//g, "").trim();
                return { filePath, content };
            },
        }),
        transformPublicFiles("lib"),
        addHeaderToDistFiles(),
        viteStaticCopy({
            targets:
                command === "build"
                    ? safeTargets([
                          ["icons/logo.svg", ""],
                          ["icons/icon.svg", ""],
                      ])
                    : safeTargets([
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
    test: {
        include: isBrowserTest ? defaultBrowserIncludes : defaultIncludes,
        exclude: [".local/**", "node_modules/**", "**/dist/**", "**/out/**", "**/site/**"],
        // support `describe`, `test` etc. globally,
        globals: true,
        // pool: 'vmThreads',
        // isolate: false,
        bail: 1,
        environment: "jsdom",
        coverage: {
            provider: "v8",
            reporter: ["lcov", "text", "text-summary", "html"],
            include: ["src/**/*"],
            exclude: [
                "**/types.ts",
                "src/wrapped/**",
                "src/waldiez/docs.ts",
                "src/waldiez/schema.ts",
                "src/index.tsx",
                "**/tests/**",
                "**/ui-tests/**",
            ],
            reportsDirectory: normalizedResolve("coverage", "react"),
            ignoreEmptyLines: true,
            thresholds,
            all: true,
        },
        onConsoleLog(log: string, type: "stdout" | "stderr"): boolean | void {
            // expected warnings
            // snackbar provider might not be mounted (we only render specific components in some tests)
            const isSnackbarNotMounted = log.includes("SnackbarProvider is not mounted");
            const isNotFound = log.includes("not found");
            const isNoItemToExport = log.includes("No item to export");
            // svg circle:
            // Warning: Received NaN for the `x` attribute.
            // Warning: Received NaN for the `y` attribute.
            // Warning: Received NaN for the `r` attribute.
            // Warning: Received NaN for the `cx` attribute.
            // Warning: Received NaN for the `cy` attribute.
            const isReceivedNaNRexExp = /Received NaN for the `(.*)` attribute/;
            // let's keep the act warnings, they might be useful
            // Warning: An update to x inside a test was not wrapped in act(...).
            const isNoActWarning =
                log.includes("should be wrapped into act") || log.includes("configured to support act(...)");
            // SyntaxError: Unexpected token 'o', "not a json" is not valid JSON
            // SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
            const isNotValidJSON = log.includes("SyntaxError: Expected property name or '}' in JSON");
            const isReceivedNaN = isReceivedNaNRexExp.test(log);
            const isErrorBoundary = log.includes("Cannot read properties of undefined (reading 'x')");
            const shouldBeIgnored =
                isNotFound ||
                isNoItemToExport ||
                isErrorBoundary ||
                isReceivedNaN ||
                isNoActWarning ||
                isNotValidJSON ||
                isSnackbarNotMounted;
            return type === "stderr" && !shouldBeIgnored;
        },
        // global test setup
        setupFiles: isBrowserTest ? [] : ["./vitest.setup.tsx"],
        // browser setup is in workspace
        browser: {
            provider: "playwright", // or 'webdriverio'
            enabled: isBrowserTest,
            headless: true,
            viewport,
            instances: [
                {
                    browser: "chromium",
                    context: {
                        recordVideo: {
                            dir: recordingsDir,
                            size: viewport,
                        },
                        viewport,
                        reducedMotion: "reduce",
                    },
                },
            ],
        },
    },
}));
