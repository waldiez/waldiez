/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Postinstall script to ensure
 * that package.json has a \n as EOL.
 */

import fs from "fs-extra";
import path from "path";

import { rootDir } from "./_lib";

// const files = ["bun.lockb", "package.json"];

const files = ["package.json"];

try {
    files.forEach(file => {
        const filePath = path.join(rootDir, file);
        const content = fs.readFileSync(filePath, "utf-8");
        if (!content.endsWith("\n")) {
            const fixedContent = content.replace(/\r\n/g, "\n");
            fs.writeFileSync(filePath, fixedContent + "\n");
        }
    });
} catch (error) {
    console.error("Error while ensuring EOL in package.json", error);
    process.exit(1);
}
