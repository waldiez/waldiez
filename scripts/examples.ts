/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import fs from "fs";
import diff from "microdiff";
import path from "path";
import url from "url";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - might not yet be built
import { exportFlow } from "../dist/@waldiez";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const examplesPath = path.resolve(__dirname, "..", "examples");

const examplesToSkip = ["dev"];

const getDiffs = (filePath: string) => {
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    const flow = exportFlow(jsonData, true, false);
    let diffResult = diff(jsonData, flow);
    if (diffResult.length > 0) {
        // we might have undefined values (nodes[].parentId) in the flow,
        // so let's stringify and parse again to see if
        // there are still differences
        const withoutUndefined = JSON.parse(JSON.stringify(flow));
        diffResult = diff(jsonData, withoutUndefined);
    }
    return diffResult;
};

const checkExampleFile = (
    file: string,
    subFile: string,
    subFilePath: string,
    strictMode: boolean = false,
) => {
    const diffResult = getDiffs(subFilePath);
    if (diffResult.length > 0) {
        if (strictMode) {
            console.log("\x1b[33mDiff:\x1b[0m");
            console.error(`\x1b[31mError: Example ${file}/${subFile} is not up to date.\x1b[0m`);
            console.log(JSON.stringify(diffResult, null, 2));
            process.exit(1);
        } else {
            console.log(`\x1b[33mExample: ${file}/${subFile} has been updated.\x1b[0m`);
            console.log("\x1b[33mDiff:\x1b[0m");
            console.log(JSON.stringify(diffResult, null, 2));
        }
    } else {
        console.log(`\x1b[34mExample: ${file}/${subFile} is up to date.\x1b[0m`);
    }
};

const handleExampleFile = (
    file: string,
    subFile: string,
    subFilePath: string,
    checkOnly: boolean = false,
    strictMode: boolean = false,
) => {
    if (checkOnly) {
        checkExampleFile(file, subFile, subFilePath, strictMode);
        return;
    }
    const jsonData = JSON.parse(fs.readFileSync(subFilePath, "utf-8"));
    const flow = exportFlow(jsonData, true, false);
    // override if not the same
    const diffResult = diff(jsonData, flow);
    if (diffResult.length > 0) {
        // console.info(`Example: ${file}/${subFile} has been updated.`);
        console.log(`\x1b[33mExample: ${file}/${subFile} has been updated.\x1b[0m`);
        fs.writeFileSync(subFilePath, JSON.stringify(flow, null, 2));
    } else {
        console.log(`\x1b[34mExample: ${file}/${subFile} is up to date.\x1b[0m`);
    }
};

const showHelp = () => {
    console.log(`
Usage: ${process.argv[1].split("/").pop()} [options]
Options:
  --check, -c       Check examples for updates (default).
  --update, -u      Update examples to the latest version.
  --strict, -s      Strict mode (with --check|-c): exit with error if any of the examples is not up to date.
  --help, -h       Show this help message.
Examples:
  node scripts/examples.js --check
  Check examples for updates.
  node scripts/examples.js --update
  Update examples to the latest version.
  node scripts/examples.js -c --strict
  Check examples for updates in strict mode.
`);
    process.exit(0);
};

const parseArguments = () => {
    let checkOnly = process.argv.includes("--check");
    if (process.argv.includes("--help") || process.argv.includes("-h")) {
        showHelp();
    }
    if (process.argv.includes("--check") || process.argv.includes("-c")) {
        checkOnly = true;
    }
    if (process.argv.includes("--update") || process.argv.includes("-u")) {
        checkOnly = false;
    }
    const strictMode = process.argv.includes("--strict") || process.argv.includes("-s");
    return { checkOnly, strictMode };
};

const collectFilePaths = (): string[] => {
    const filesPaths: string[] = [];
    for (const item of fs.readdirSync(examplesPath)) {
        const filePath = path.join(examplesPath, item);
        if (fs.statSync(filePath).isDirectory()) {
            const dirPrefix = item.split("-")[0].trim();
            if (examplesToSkip.includes(dirPrefix)) {
                console.log(`\x1b[33mSkipping example ${item}.\x1b[0m`);
                continue;
            }
            for (const subFile of fs.readdirSync(filePath)) {
                const subFilePath = path.join(filePath, subFile);
                if (subFile.endsWith(".waldiez")) {
                    filesPaths.push(subFilePath);
                }
            }
        }
    }
    return filesPaths;
};

const main = () => {
    const { checkOnly, strictMode } = parseArguments();
    if (checkOnly) {
        console.log("\x1b[36mChecking examples for updates...");
    } else {
        console.log("\x1b[36mUpdating examples...");
    }
    const filesPaths = collectFilePaths();
    for (const subFilePath of filesPaths) {
        const subFile = path.basename(subFilePath);
        const file = path.basename(path.dirname(subFilePath));
        handleExampleFile(file, subFile, subFilePath, checkOnly, strictMode);
    }
};

main();
