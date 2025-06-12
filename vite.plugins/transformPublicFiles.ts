/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import fs from "fs-extra";
import { glob } from "glob";
import path from "path";
import { Plugin } from "vite";

export const transformPublicFiles = (mode: "lib" | "web"): Plugin => {
    const fileExtensions = [".webmanifest", ".json", ".xml", ".txt"];
    return {
        name: "transform-public-files",
        // Server-level hook for development
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url && fileExtensions.some(ext => req.url?.endsWith(ext))) {
                    const filePath = path.join("public", req.url);
                    if (fs.existsSync(filePath)) {
                        let content = fs.readFileSync(filePath, "utf-8");
                        content = content.replace(/%BASE_URL%/g, server.config.base || "/");
                        if (req.url.endsWith(".webmanifest") || req.url.endsWith(".json")) {
                            res.setHeader("Content-Type", "application/json");
                        } else if (req.url.endsWith(".xml")) {
                            res.setHeader("Content-Type", "application/xml");
                        }
                        res.end(content);
                        return;
                    }
                }
                next();
            });
        },
        generateBundle() {
            if (mode === "lib") {
                // no need for extra files in library mode
                return;
            }
            const filesToProcess = glob.sync("public/**/*.{webmanifest,json,xml,txt}");

            filesToProcess.forEach(filePath => {
                if (fs.existsSync(filePath)) {
                    let content = fs.readFileSync(filePath, "utf-8");
                    if (content.includes("%BASE_URL%")) {
                        content = content.replace(/%BASE_URL%/g, this.meta.rollupVersion ? "/" : "/");

                        // Emit as asset
                        this.emitFile({
                            type: "asset",
                            fileName: path.basename(filePath),
                            source: content,
                        });
                    }
                }
            });
        },
    };
};
