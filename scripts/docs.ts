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

const LICENSE_PATH = path.resolve(rootDir, "LICENSE");
const NOTICE_PATH = path.resolve(rootDir, "NOTICE.md");
const DOCS_OUT_DIR = path.resolve(rootDir, "docs");

if (!fs.existsSync(DOCS_OUT_DIR) || !fs.existsSync(LICENSE_PATH) || !fs.existsSync(NOTICE_PATH)) {
    throw new Error("Missing required files");
}
fs.copyFileSync(LICENSE_PATH, path.resolve(DOCS_OUT_DIR, "LICENSE"));
fs.copyFileSync(NOTICE_PATH, path.resolve(DOCS_OUT_DIR, "NOTICE.md"));
