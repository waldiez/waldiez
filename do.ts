/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Simple wrapper to call "do" in the "scripts" directory.
 */
import { spawnSync } from "child_process";
import { platform } from "os";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

// Determine script directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCRIPTS = resolve(__dirname, "scripts");

// Determine platform and command
const isWindows = platform() === "win32";
const scriptPath = isWindows ? join(SCRIPTS, "do.ps1") : join(SCRIPTS, "do.sh");
const cmd = isWindows ? "pwsh" : scriptPath;
const args = isWindows ? [scriptPath, ...process.argv.slice(2)] : process.argv.slice(2);

// Run the command
const result = spawnSync(cmd, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    shell: false,
});

if (result.status !== 0) {
    process.exit(result.status ?? 1);
}
