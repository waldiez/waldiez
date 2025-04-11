/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/** Install the requirements for each ts sub-project. */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

import { packageJson, __rootDir, getPackageManager } from "./_lib";

/**
 * Install the requirements for each ts sub-project.
 */
const main = (): void => {
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(__rootDir, project);
        const packageJson = path.join(projectDir, "package.json");
        if (!fs.existsSync(packageJson)) {
            console.log(`Skipping ${project}...`);
            continue;
        }
        console.log(`Installing requirements for ${project}...`);
        const packageManager = getPackageManager(projectDir);
        if (packageManager === "yarn" && !fs.existsSync(path.join(projectDir, "yarn.lock"))) {
            fs.writeFileSync(path.join(projectDir, "yarn.lock"), "\n", { encoding: "utf-8" });
        }
        execSync(`${packageManager} install`, { cwd: projectDir, stdio: "inherit" });
    }
};

main();
