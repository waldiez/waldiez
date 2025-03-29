/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* Run formatters in the project's subdirectories. */

import path from "path";
import fs from "fs-extra";

import { runEsLint, runPrettier, packageJson, rootDir, runCommandInDir, getPackageManager } from "./_lib";

function formatThisDir(): void {
    try {
        runPrettier(__dirname, true);
        runEsLint(rootDir, true, true);
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

function main(): void {
    formatThisDir();
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["install"]);
            runCommandInDir(projectDir, packageManager, ["run", "format"]);
        } else {
            console.log(`Skipping ${projectDir} as it does not have a package.json file.`);
        }
    }
}

main();
