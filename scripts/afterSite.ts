/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import fs from "fs-extra";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const PUBLIC_DIR = path.resolve(rootDir, "public");
const STATIC_DIR = path.resolve(rootDir, "out", "static");

const main = () => {
    for (const dir of ["vs", "min-maps"]) {
        const publicDir = path.resolve(PUBLIC_DIR, dir);
        const staticDir = path.resolve(STATIC_DIR, dir);
        if (fs.existsSync(publicDir)) {
            fs.removeSync(staticDir);
            fs.renameSync(publicDir, staticDir);
        }
    }
};

main();
