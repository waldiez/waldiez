/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import react from "@vitejs/plugin-react";
import fs from "fs-extra";
import { resolve } from "path";
import { defineConfig } from "vite";
import dts from "vite-plugin-dts";
import { externalizeDeps } from "vite-plugin-externalize-deps";

const defaultIncludes = ["**/tests/**/*.test.{ts,tsx}"];
const defaultBrowserIncludes = ["**/ui-tests/**/*.test.{ts,tsx}"];
const isBrowserTest = process.argv.includes("--browser.enabled");
const recordingsDir = resolve(__dirname, ".local", "recordings");
fs.ensureDirSync(recordingsDir);

const viewport = { width: 1280, height: 720 };
// coverage thresholds, let's try to keep them high
const thresholds = {
    statements: 80,
    branches: 80,
    functions: 80,
    lines: 80,
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
    publicDir: command === "build" ? resolve(__dirname, "public", "logo") : resolve(__dirname, "public"),
    server: {
        headers: {
            "content-security-policy-report-only":
                "default-src 'none'; style-src 'self' 'unsafe-inline'; worker-src 'self' blob:; script-src 'self'; font-src 'self'; img-src 'self' data:; connect-src *; report-to /_/csp",
        },
    },
    build: {
        emptyOutDir: true,
        outDir: resolve(__dirname, "dist"),
        lib: {
            entry: resolve(__dirname, "src", "waldiez", "index.ts"),
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
                "rc-slider",
                "react-error-boundary",
            ],
            output: {
                exports: "named",
                globals: {
                    "react/jsx-runtime": "jsxRuntime",
                    nanoid: "nanoid",
                    "@xyflow/react": "XYFlowReact",
                    "react-hotkeys-hook": "reactHotkeysHook",
                    "react-icons/fa": "reactIconsFa",
                    "react-icons/fa6": "reactIconsFa6",
                    "react-icons/ai": "reactIconsAi",
                    "react-icons/gi": "reactIconsGi",
                    "react-icons/go": "reactIconsGo",
                    "react-icons/md": "reactIconsMd",
                    "@monaco-editor/react": "react$1",
                    react: "react",
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
                    "rc-slider": "rcSlider",
                    "react-error-boundary": "reactErrorBoundary",
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
            "@waldiez": resolve(__dirname, "src", "waldiez"),
        },
    },
    plugins: [
        react(),
        externalizeDeps(),
        dts({
            insertTypesEntry: true,
            // rollupTypes: true,
            tsconfigPath: "./tsconfig.build.json",
        }),
    ],
    test: {
        include: isBrowserTest ? defaultBrowserIncludes : defaultIncludes,
        exclude: [".local/**"],
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
            reportsDirectory: resolve(__dirname, "coverage", "react"),
            ignoreEmptyLines: true,
            thresholds,
            all: true,
        },
        onConsoleLog(log: string, type: "stdout" | "stderr"): boolean | void {
            // const logLower = log.toLowerCase();
            const isNotFound = log.includes("not found");
            // svg circle:
            // Warning: Received NaN for the `x` attribute.
            // Warning: Received NaN for the `y` attribute.
            // Warning: Received NaN for the `r` attribute.
            // Warning: Received NaN for the `cx` attribute.
            // Warning: Received NaN for the `cy` attribute.
            const isReceivedNaNRexExp = /Received NaN for the `(.*)` attribute/;
            // Warning: An update to x inside a test was not wrapped in act(...).
            const isNoActWarning = log.includes(
                "When testing, code that causes React state updates should be wrapped into act",
            );
            // SyntaxError: Unexpected token 'o', "not a json" is not valid JSON
            // SyntaxError: Expected property name or '}' in JSON at position 1 (line 1 column 2)
            const isNotValidJSON = log.includes("SyntaxError: Expected property name or '}' in JSON");
            const isReceivedNaN = isReceivedNaNRexExp.test(log);
            const isErrorBoundary = log.includes("Cannot read properties of undefined (reading 'x')");
            if (
                type === "stderr" &&
                (isNotFound || isErrorBoundary || isReceivedNaN || isNoActWarning || isNotValidJSON)
            ) {
                // we expect these warnings in `non-browser` tests
                return false;
            }
            return true;
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
