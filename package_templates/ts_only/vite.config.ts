import react from "@vitejs/plugin-react";
import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { relative, resolve } from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const coverageInclude = relative(process.cwd(), resolve(__dirname, "src")).replace(/\\/g, "/");
const coverageDir = relative(process.cwd(), resolve(__dirname, "coverage")).replace(/\\/g, "/");
const isBrowserTest = process.argv.includes("--browser.enabled");
//  isBrowserTest ? "e2e/**/*.spec.{ts,tsx}" : "tests/**/*.test.{ts,tsx}"
let relativePath = relative(process.cwd(), resolve(__dirname)).replace(/\\/g, "/");
if (!relativePath.endsWith("/")) {
    relativePath += "/";
}
if (relativePath.startsWith("/")) {
    relativePath = relativePath.substring(1);
}
const testsInclude = isBrowserTest
    ? `${relativePath}e2e/**/*.spec.{ts,tsx}`
    : `${relativePath}tests/**/*.test.{ts,tsx}`;

dotenv.config();

const thresholdLimit = 50;
const viewport = { width: 1280, height: 720 };
const thresholds = {
    statements: thresholdLimit,
    branches: thresholdLimit,
    functions: thresholdLimit,
    lines: thresholdLimit,
};

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    const envFile = resolve(__dirname, ".env");
    if (fs.existsSync(envFile)) {
        const envConfig = dotenv.parse(fs.readFileSync(envFile));
        process.env = { ...process.env, ...envConfig };
    }
    const base = command === "build" ? process.env["BASE_URL"] || "/" : "/";
    const publicDir = resolve(__dirname, "public");
    return {
        publicDir,
        base,
        build: {
            emptyOutDir: true,
            minify: "terser",
            outDir: resolve(__dirname, "dist"),
            rollupOptions: {
                output: {
                    manualChunks: {
                        react: ["react"],
                        "react-dom": ["react-dom"],
                        "react-icons": ["react-icons"],
                    },
                },
            },
        },
        plugins: [react()],
        resolve: {
            alias: {
                "@my/package": resolve(__dirname, "src"),
            },
        },
        test: {
            include: testsInclude,
            // support `describe`, `test` etc. globally,
            globals: true,
            // pool: 'vmThreads',
            // isolate: false,
            bail: 1,
            // run tests in jsdom environment
            environment: "jsdom",
            coverage: {
                provider: "v8",
                reporter: ["lcov", "text", "text-summary", "html"],
                include: [coverageInclude],
                reportsDirectory: coverageDir,
                exclude: [],
                ignoreEmptyLines: true,
                thresholds,
                all: true,
            },
            // global test setup
            setupFiles: [resolve(__dirname, "vitest.setup.ts")],
            // browser setup is in workspace
            browser: {
                provider: "playwright", // or 'webdriverio'
                enabled: isBrowserTest,
                name: "chromium", // browser name is required
                headless: true,
                viewport,
                providerOptions: {
                    context: {
                        recordVideo: {
                            dir: resolve(__dirname, "e2e", "videos"),
                            size: viewport,
                        },
                        viewport,
                        reducedMotion: "reduce",
                    },
                },
            },
        },
    };
});
