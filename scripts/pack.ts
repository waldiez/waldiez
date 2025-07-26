/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// let's do sth similar to the thing we do in ci:
// before bun pm pack:
// backup README.md
// use README.npm.md for README.md
// after bun pm pack:
// restore README.md
// use README.npm.md for README.md
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs-extra";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const _dot_local = path.resolve(rootDir, ".local");
const README_NPM = path.resolve(rootDir, "README.npm.md");
const README = path.resolve(rootDir, "README.md");
const README_BAK = path.resolve(_dot_local, "README.md.bak");

const beforePack = () => {
    if (!fs.existsSync(_dot_local)) {
        fs.mkdirSync(_dot_local);
    }
    if (fs.existsSync(README) && fs.existsSync(README_NPM)) {
        fs.moveSync(README, README_BAK, { overwrite: true });
        fs.moveSync(README_NPM, README, { overwrite: true });
    }
};

const afterPack = () => {
    // restore README.md and README.npm.md
    if (fs.existsSync(README_BAK) && fs.existsSync(README)) {
        fs.moveSync(README, README_NPM, { overwrite: true });
        fs.moveSync(README_BAK, README, { overwrite: true });
    }
};

const main = () => {
    // --before | before | --after | after
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.error("Please provide an argument: --before | before | --after | after");
        process.exit(1);
    }
    const arg = args[0].toLowerCase();
    if (arg === "--before" || arg === "before") {
        beforePack();
    } else if (arg === "--after" || arg === "after") {
        afterPack();
    } else {
        console.error("Invalid argument: " + arg);
        console.error("Please provide an argument: --before | before | --after | after");
        process.exit(1);
    }
};

main();
