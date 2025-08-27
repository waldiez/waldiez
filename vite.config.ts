/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
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
// https://vitejs.dev/config/
/// <reference types="vitest/config" /
// noinspection JSUnusedGlobalSymbols,DuplicatedCode
export default defineConfig(({ command }) => ({
    publicDir: getPublicDir(command),
    server: {
        headers: {
            "content-security-policy-report-only":
                "default-src 'none'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; script-src 'self' https://drag-drop-touch-js.github.io/; font-src 'self'; img-src 'self' data:; connect-src *; report-to /_/csp",
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
            name: "@waldiez",
            formats: ["es", "cjs", "umd"],
            fileName: "@waldiez",
        },
        minify: "terser" as const,
        rollupOptions: {
            external: [
                "jszip",
                "react",
                "react-dom",
                "react/jsx-runtime",
                "nanoid",
                "@xyflow/react",
                "react-hotkeys-hook",
                "react-icons/fa",
                "react-icons/fa6",
                "react-icons/ai",
                "react-icons/gi",
                "react-icons/go",
                "react-icons/md",
                "react-markdown",
                "rehype-highlight",
                "remark-gfm",
                "@monaco-editor/react",
                "zustand",
                "zundo",
                "microdiff",
                "zustand/shallow",
                "zustand/traditional",
                "react-select",
                "react-error-boundary",
                "strip-ansi",
                "framer-motion",
                "recharts",
                "@fontsource/fredoka",
            ],
            output: {
                exports: "named",
                globals: {
                    "react/jsx-runtime": "jsxRuntime",
                    nanoid: "nanoid",
                    "@xyflow/react": "XYFlowReact",
                    "@fontsource/fredoka": "fredoka",
                    "react-hotkeys-hook": "reactHotkeysHook",
                    "react-icons/fa": "reactIconsFa",
                    "react-icons/fa6": "reactIconsFa6",
                    "react-icons/ai": "reactIconsAi",
                    "react-icons/gi": "reactIconsGi",
                    "react-icons/go": "reactIconsGo",
                    "react-icons/md": "reactIconsMd",
                    "@monaco-editor/react": "react$1",
                    react: "react",
                    "react-dom": "reactDom",
                    zustand: "zustand",
                    zundo: "zundo",
                    jszip: "jszip",
                    "react-markdown": "reactMarkdown",
                    "rehype-highlight": "rehypeHighlight",
                    "remark-gfm": "remarkGfm",
                    microdiff: "microdiff",
                    "zustand/shallow": "zustandShallow",
                    "zustand/traditional": "zustandTraditional",
                    "react-select": "reactSelect",
                    "react-error-boundary": "reactErrorBoundary",
                    "strip-ansi": "stripAnsi",
                    "framer-motion": "framerMotion",
                    recharts: "recharts",
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
        },
    },
    resolve: {
        alias: {
            "@waldiez": normalizedResolve("src", "waldiez"),
        },
    },
    plugins: [
        react(),
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
                    ? [
                          {
                              src: normalizedResolve("public", "icons", "logo.svg"),
                              dest: "",
                          },
                          {
                              src: normalizedResolve("public", "icons", "icon.svg"),
                              dest: "",
                          },
                      ]
                    : [
                          {
                              src: `${normalizedResolve("public", "icons")}/*`,
                              dest: "icons",
                          },
                          {
                              src: `${normalizedResolve("public", "screenshots")}/*`,
                              dest: "screenshots",
                          },
                          {
                              src: normalizedResolve("public", "apple-touch-icon.png"),
                              dest: "",
                          },
                          {
                              src: normalizedResolve("public", "favicon.ico"),
                              dest: "",
                          },
                          {
                              src: normalizedResolve("public", "robots.txt"),
                              dest: "",
                          },
                          {
                              src: normalizedResolve("public", "vs"),
                              dest: "",
                          },
                          {
                              src: normalizedResolve("public", "min-maps"),
                              dest: "",
                          },
                      ],
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

console.log(`Waldiez build configuration:
- Version: ${getVersion()}
- Hub API URL: ${getHubUrl()}`);
if (getPublicDir("build")) {
    console.log(`- Public Directory: ${getPublicDir("build")}`);
}
