/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import react from "@vitejs/plugin-react";
import "dotenv/config";
import { resolve } from "path";
import { defineConfig } from "vite";

/* additional config for building a static site (and not a library) */
// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
    const base = process.env["BASE_URL"] || "./";
    const publicDir =
        command === "build" ? resolve(__dirname, "public", "logo") : resolve(__dirname, "public");
    return {
        publicDir,
        base,
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
            outDir: resolve(__dirname, "out", "static"),
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes("node_modules")) {
                            return id.toString().split("node_modules/")[1].split("/")[0].toString();
                        }
                    },
                },
            },
        },
        resolve: {
            alias: {
                "@waldiez": resolve(__dirname, "src", "waldiez"),
            },
        },
        plugins: [react()],
    };
});
