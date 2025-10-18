/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { spawnSync } from "child_process";
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const __rootDir = resolve(__dirname, "..");

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

function runTailwindCheck() {
    try {
        const result = spawnSync("node", ["--import=tsx", "scripts/tailwind_windows_arm64.ts"], {
            stdio: "inherit",
            shell: true,
            cwd: __rootDir,
        });
        if (result.status !== 0) {
            console.log(`Tailwind check exited with code ${result.status}`);
        }
    } catch (error) {
        console.error("Error running Tailwind check:", error.message);
    }
}

function main() {
    copyAjvDraftIfNeeded();
    runTailwindCheck();
}

main();
