/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* Cleanup unneeded files */

// "clean:cache": "rimraf .eslintcache .stylelintcache",
// "clean:coverage": "rimraf coverage",
// "clean:dist": "rimraf dist",

import path from "path";
import fs from "fs-extra";

import { packageJson, __rootDir, runCommandInDir, getPackageManager } from "./_lib";

const main = (): void => {
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(__rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["install"]);
            runCommandInDir(projectDir, packageManager, ["run", "clean"]);
        } else {
            console.log(`Skipping ${projectDir} as it does not have a package.json file.`);
        }
    }
};

main();
