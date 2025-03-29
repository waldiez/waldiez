/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/** Run tests in the project's subdirectories. */
import path from "path";
import fs from "fs-extra";

import { packageJson, rootDir, runCommandInDir, getPackageManager } from "../_ts/_lib";

function runTests() {
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["run", "test"]);
        } else {
            console.log(`No package.json in ${projectDir} skipping ...`);
        }
    }
}

runTests();
