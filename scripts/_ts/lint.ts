/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/** Run linting in the project's subdirectories. */
import path from "path";
import fs from "fs-extra";

import { runEsLint, runPrettier, packageJson, __rootDir, runCommandInDir, getPackageManager } from "./_lib";

const lintThisDir = (): void => {
    try {
        runPrettier(__dirname, false);
        runEsLint(path.join(__rootDir), false, true);
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
};

const main = (): void => {
    lintThisDir();
    if (process.argv.includes("--root")) {
        return;
    }
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(__rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["install"]);
            runCommandInDir(projectDir, packageManager, ["run", "lint"]);
        }
    }
};

main();
