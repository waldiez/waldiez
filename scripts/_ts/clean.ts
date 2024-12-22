/* Cleanup unneeded files */

// "clean:cache": "rimraf .eslintcache .stylelintcache",
// "clean:coverage": "rimraf coverage",
// "clean:dist": "rimraf dist",

import path from "path";
import fs from "fs-extra";

import { packageJson, rootDir, runCommandInDir, getPackageManager } from "./_lib";

function main(): void {
    for (const project of packageJson.packages.ts) {
        const projectDir = path.join(rootDir, project);
        const packageJsonPath = path.join(projectDir, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const packageManager = getPackageManager(projectDir);
            runCommandInDir(projectDir, packageManager, ["install"]);
            runCommandInDir(projectDir, packageManager, ["run", "clean"]);
        } else {
            console.log(`Skipping ${projectDir} as it does not have a package.json file.`);
        }
    }
}

main();
