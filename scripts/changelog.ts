/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { readFileSync } from "fs-extra";
import { resolve } from "path";

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));

const changelog = readFileSync(resolve("CHANGELOG.md"), "utf-8");

const tag = packageJson.version;

const lines = changelog.split("\n");

let found = false;
let changes = "";
for (const line of lines) {
    if (line.startsWith(`## v${tag}`)) {
        found = true;
    } else if (line.startsWith("## ") && found) {
        break;
    } else if (found) {
        changes += line + "\n";
    }
}

const output = changes.trim();
if (output === "") {
    throw new Error(`No changes found for tag v${tag}`);
}
console.log(output);
