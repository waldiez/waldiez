/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/** Build typescript-based projects */

import path from "path";
import fs from "fs-extra";

import { packageJson, __rootDir, runCommandInDir, getPackageManager } from "./_lib";

const main = (): void => {
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(__rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (!fs.existsSync(packageJsonPath)) {
            throw new Error(`package.json not found in ${projectDir}`);
        }
        const mangerCmd = getPackageManager(projectDir);
        runCommandInDir(projectDir, mangerCmd, ["install"]);
        runCommandInDir(projectDir, mangerCmd, ["run", "build"]);
    }
};

main();
