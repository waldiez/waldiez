/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* Run formatters in the project's subdirectories. */

import path from "path";
import fs from "fs-extra";

import { runEsLint, runPrettier, packageJson, __rootDir, runCommandInDir, getPackageManager } from "./_lib";

const formatThisDir = (): void => {
    try {
        runPrettier(__dirname, true);
        runEsLint(__rootDir, true, true);
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
};

const main = (): void => {
    formatThisDir();
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(__rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["install"]);
            runCommandInDir(projectDir, packageManager, ["run", "format"]);
        } else {
            console.log(`Skipping ${projectDir} as it does not have a package.json file.`);
        }
    }
};

main();
