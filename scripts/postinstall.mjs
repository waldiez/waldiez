/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __rootDir = resolve(__dirname, "..");

// eslint seems to need ajv 6.12.4, that includes the old json-schema-draft-04
// node_modules/eslint/node_modules/ seem to indeed have this version.
// but we sometimes get: "Cannot find module 'ajv/lib/refs/json-schema-draft-04.json"
// (so it looks in root's node_modules?)
const source = join(__rootDir, "node_modules", "ajv-draft-04", "lib", "refs", "json-schema-draft-04.json");
const targetDir = join(__rootDir, "node_modules", "ajv", "lib", "refs");
const target = join(targetDir, "json-schema-draft-04.json");

function copyAjvDraftIfNeeded() {
    try {
        if (existsSync(source) && !existsSync(target)) {
            mkdirSync(targetDir, { recursive: true });
            copyFileSync(source, target);
        }
    } catch (error) {
        console.error("Error in postinstall:", error.message);
    }
}

function main() {
    copyAjvDraftIfNeeded();
}

main();
