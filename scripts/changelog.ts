/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/*
Read the changelog file
and output the current tag's changes
*/
import fs from "fs-extra";
import path from "path";
import url from "url";
import { resolve } from "path";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const packageJsonPath = resolve(__dirname, "..", "package.json");
const changelogPath = resolve(__dirname, "..", "CHANGELOG.md");

const packageJson = fs.readJsonSync(packageJsonPath, { encoding: "utf-8" });
const changelog = fs.readFileSync(changelogPath, { encoding: "utf-8" });
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
