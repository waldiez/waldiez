/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import fs from "fs-extra";
import path from "path";
import type { Plugin } from "vite";

import packageJson from "../package.json";

const owner = "Waldiez";
const projectBirthYear = 2024;
const licenseIdentifier = packageJson.license || "Apache-2.0";
const thisYear = new Date().getFullYear();
const copyrightYears = `${projectBirthYear} - ${thisYear}`;
const copyrightHolder = `${owner} & contributors`;
const distExtensions = [".js", ".css", ".cjs", ".mjs", ".ts", ".d.ts"];

const addHeaderToFile = async (filePath: string): Promise<void> => {
    const content = await fs.readFile(filePath, "utf-8");
    let header = `/**
 * SPDX-License-Identifier: ${licenseIdentifier}
 * Copyright ${copyrightYears} ${copyrightHolder}
 */`;
    if (path.extname(filePath) === ".css") {
        header += "\n/* stylelint-disable */";
    }
    // Avoid adding twice
    if (!content.startsWith(header)) {
        let newContent = `${header}\n\n${content}`.replace(/\r\n/g, "\n");
        if (!newContent.endsWith("\n")) {
            // Ensure the file ends with a newline
            newContent += "\n";
        }
        await fs.writeFile(filePath, newContent, "utf-8");
        console.log(`\n\x1b[36m[add-header-to-dist-files]\x1b[0m Header added to ${filePath}`);
    }
};

export const addHeaderToDistFiles = (): Plugin => {
    return {
        name: "add-header-to-dist-files",
        apply: "build",
        enforce: "post", // ensure it runs AFTER other plugins

        async writeBundle() {
            const distPath = path.resolve("dist");
            // Ensure the dist directory exists
            if (!fs.existsSync(distPath)) {
                console.warn(
                    `\n\x1b[33m[add-header-to-dist-files]\x1b[0m Skipped: dist directory not found at ${distPath}`,
                );
                return;
            }
            // Add header to all .js and .css files in dist
            const files = await fs.readdir(distPath);
            for (const file of files) {
                const filePath = path.join(distPath, file);
                if (distExtensions.some(ext => file.endsWith(ext))) {
                    try {
                        await addHeaderToFile(filePath);
                    } catch (error) {
                        console.error(
                            `\n\x1b[31m[add-header-to-dist-files]\x1b[0m Error adding header to ${filePath}:`,
                            error,
                        );
                    }
                }
            }
        },
    };
};
