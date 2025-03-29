/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import path from "path";
import url from "url";
import fs from "fs-extra";
import { execSync } from "child_process";
import packageJson from "../../package.json";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, "..", "..");

export { packageJson, rootDir };

/**
 * Run a command in a directory.
 * @param dir The directory in which to run the command.
 * @param cmd The command to run.
 * @param args The arguments to pass to the command.
 * @param strict Whether to throw an error if the command fails.
 * @param extraEnv Extra environment variables to pass to the command.
 * @returns {void}
 * @throws {Error} If the command fails and strict is true.
 */
export function runCommandInDir(
    dir: string,
    cmd: string,
    args: string[],
    strict: boolean = true,
    extraEnv: { [key: string]: string } = {},
): void {
    const relativeToRoot = getRelativePathToRoot(dir);
    const commandString = `${cmd} ${args.join(" ")}`.replace(rootDir, ".");
    let relativeToRootToLog = relativeToRoot;
    if (relativeToRoot === ".") {
        relativeToRootToLog = __dirname;
    }
    const toLog = `\nRunning: ${commandString} in ${relativeToRootToLog}\n`;
    console.info(toLog);
    try {
        execSync(`${cmd} ${args.join(" ")}`, {
            cwd: dir,
            stdio: "inherit",
            encoding: "utf-8",
            env: {
                ...process.env,
                ...extraEnv,
            },
        });
    } catch (err) {
        console.error(`Error running command: ${toLog}`);
        if (strict) {
            console.error(err);
            let msg = `Error running command: ${commandString}. Error: ${err}`;
            msg += "\n\n";
            msg += "You might want to run the command manually.";
            msg += "\n\n";
            msg += "If you are getting an 'Error: The service was stopped' error,";
            msg += "you might want to run the command outside your IDE (if it consumes many resources).";
            msg += "\n\n";
            msg += "See: https://github.com/evanw/esbuild/issues/320 for a possible cause and solution.";
            msg += "\n\n";
            msg += "\nOr (as a last resolution) remove the 'node_modules'";
            msg += `in the ${relativeToRoot} folder and install the dependencies again.`;
            console.error(msg);
            process.exit(1);
        }
    }
}
/**
 * Run Prettier in a directory.
 * @param dir The directory in which to run Prettier.
 * @param fix Whether to fix the files.
 * @returns {void}
 */
export function runPrettier(dir: string, fix: boolean): void {
    const cmdArgs = ["prettier"];
    if (fix) {
        cmdArgs.push("--write");
    } else {
        cmdArgs.push("--check");
    }
    cmdArgs.push(".");
    runCommandInDir(dir, "npx", cmdArgs);
}

/**
 * Run ESLint in a directory.
 * @param dir The directory in which to run ESLint.
 * @param fix Whether to fix the files.
 * @param isRoot Whether the directory is the root directory.
 * @returns {void}
 */
export function runEsLint(dir: string, fix: boolean, isRoot: boolean = false): void {
    const configFile = path.join(dir, "eslint.config.mjs");
    if (!fs.existsSync(configFile)) {
        console.warn(`No ESLint configuration file found in ${dir}.`);
        return;
    }
    const cmdArgs = getEsLintArgs(configFile, fix, isRoot);
    runCommandInDir(dir, "npx", cmdArgs);
}

/**
 * Get the relative path to the root directory.
 * @param dir The directory for which to get the relative path.
 * @returns {string} The relative path to the root directory.
 */
function getRelativePathToRoot(dir: string): string {
    let relativeToRoot = path.relative(rootDir, dir);
    if (relativeToRoot === "") {
        relativeToRoot = ".";
    }
    return relativeToRoot;
}

/**
 * Get the ESLint arguments.
 * @param configFile The ESLint configuration file.
 * @param fix Whether to fix the files.
 * @param isRoot Whether the directory is the root directory.
 * @returns {string[]} The ESLint arguments.
 */
function getEsLintArgs(configFile: string, fix: boolean, isRoot: boolean): string[] {
    const cmdArgs = [
        "eslint",
        "--report-unused-disable-directives",
        "--max-warnings",
        "0",
        "--cache",
        "--config",
        configFile,
        "--stats",
        "-f",
        "stylish",
        "--env-info",
    ];
    if (fix) {
        cmdArgs.push("--fix");
    }
    if (isRoot) {
        cmdArgs.push("--ignore-pattern", "packages/*");
    }
    for (const ignorePattern of packageJson.packages.ignorePatterns) {
        cmdArgs.push("--ignore-pattern", ignorePattern);
    }
    return cmdArgs;
}

/**
 * Get the package manager for a project.
 * @param projectDir The directory of the project.
 * @returns {string} The package manager.
 */
export function getPackageManager(projectDir: string): "bun" | "yarn" | "npm" | "pnpm" {
    const ifNotFound = "yarn";
    const packageJsonPath = path.join(projectDir, "package.json");
    if (!fs.existsSync(packageJsonPath)) {
        return ifNotFound;
    }
    const packageJson = fs.readJsonSync(packageJsonPath);
    try {
        const packageManager = packageJson.packageManager || ifNotFound;
        return packageManager.split("@")[0];
    } catch (err) {
        console.error(`Error reading package manager from ${packageJsonPath}.`);
        return ifNotFound;
    }
}
