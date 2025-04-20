/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* If we try to 'setup-node' and (corepack, yarn)
, we get error because we use bun.
let's patch (and un-patch) the package manager in package.json
*/
import fs from "fs-extra";
import packageJson from "../../package.json";

const yarn = "yarn@4.9.1";
const bun = "bun@1.2.10";

// check arg (if --patch or --rollback)

const doPatch = process.argv.includes("--patch");
const doRollback = process.argv.includes("--rollback");

if (doPatch && doRollback) {
    console.error("Cannot patch and rollback at the same time");
    process.exit(1);
}
if (!doPatch && !doRollback) {
    console.error("You must specify either --patch or --rollback");
    process.exit(1);
}

// patch
if (doPatch) {
    if (packageJson.packageManager.includes("bun")) {
        packageJson.packageManager = yarn;
        fs.writeJsonSync("package.json", packageJson, { spaces: 4, encoding: "utf-8" });
    }
}
if (doRollback) {
    if (packageJson.packageManager.includes("yarn")) {
        packageJson.packageManager = bun;
        fs.writeJsonSync("package.json", packageJson, { spaces: 4, encoding: "utf-8" });
    }
}
