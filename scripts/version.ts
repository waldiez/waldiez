/** Bump or get/check the version number in package.json and in all sub-packages
 * Usage:
 * - `yarn|bun|.. version --major`
 * - `yarn|bun|.. version --minor`
 * - `yarn|bun|.. version --patch`
 * - yarn|bun|.. version --set x.y.z`
 * - `yarn|bun|.. version --get`
 * - `yarn|bun|.. version --check`
 */

import fs from "fs-extra";
import { join, resolve } from "path";

import { getPackageManager, packageJson, rootDir } from "./_ts/_lib";
import { execSync } from "child_process";

/**
 * Show the help message.
 * @param exitCode The exit code.
 * @returns {void}
 */
function showHelp(exitCode: number = 0): void {
    const manger = getPackageManager(rootDir);
    console.info(`\x1b[36mUsage: ${manger} version <args>\n`);
    console.info("\x1b[36mExamples: \n");
    console.info(`${manger} version --major`);
    console.info(`${manger} version --minor`);
    console.info(`${manger} version --patch`);
    console.info(`${manger} version --set x.y.z`);
    console.info(`${manger} version --get\n`);
    console.info(`${manger} version --check\n`);
    process.exit(exitCode);
}

/**
 * Get the index of the version part to bump.
 * @returns The index of the version part to bump.
 */
function getVersionIndexToBump(): number {
    const arg = process.argv.slice(2)[0];
    if (arg === "--major") {
        return 0;
    }
    if (arg === "--minor") {
        return 1;
    }
    if (arg === "--patch") {
        return 2;
    }
    showHelp(1);
    return -1;
}

/**
 * Show the current version.
 * @returns {void}
 */
function showVersion(): void {
    console.info(`\x1b[36mVersion: ${packageJson.version}\n`);
    process.exit(0);
}

/**
 * Get the new version string.
 * @returns The new version string.
 * @throws {Error} If an error occurs.
 */
function getNextVersion(): string {
    try {
        const index = getVersionIndexToBump();
        const version = fs.readJsonSync(resolve(rootDir, "package.json"), {
            encoding: "utf-8",
        });
        const versionParts = version.version.split(".");
        versionParts[index] = (parseInt(versionParts[index]) + 1).toString();
        for (let i = index + 1; i < versionParts.length; i++) {
            versionParts[i] = "0";
        }
        return versionParts.join(".");
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

/**
 * Get the new version number.
 * @returns The new version number.
 */
function getNewVersion(): string {
    if (process.argv.slice(2)[0] === "--set") {
        if (process.argv.length < 4) {
            console.error("Error: Missing version number");
            showHelp(1);
        }
        const newVersion = process.argv.slice(2)[1];
        if (!newVersion.match(/^\d+\.\d+\.\d+$/)) {
            console.error(`Error: Invalid version number got: ${newVersion}`);
            showHelp(1);
        }
        return newVersion;
    }
    return getNextVersion();
}

/**
 * Bump the version number in package.json and in all sub-packages.
 * @param newVersion The new version number.
 * @throws {Error} If an error occurs.
 * @returns {void}
 */
function bumpTs(newVersion: string): void {
    try {
        for (const tsProject of packageJson.packages.ts) {
            const packageJsonPath = resolve(rootDir, tsProject, "package.json");
            if (!fs.existsSync(packageJsonPath)) {
                console.log(`Skipping ${tsProject}...`);
                continue;
            }
            const packageJson = fs.readJsonSync(packageJsonPath, {
                encoding: "utf-8",
            });
            packageJson.version = newVersion;
            fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 4 });
        }
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

/**
 * Bump the version number in python projects.
 * We expect one of:
 * - `project_dir/scripts/version.py` or
 * - `project_dir/scripts/dev/version.py`
 * to exist. If not, we skip the project.
 * @param newVersion The new version number.
 * @throws {Error} If an error occurs.
 */
function bumpPy(newVersion: string) {
    for (const pyProject of packageJson.packages.py) {
        const versionFile = resolve(rootDir, pyProject, "scripts", "version.py");
        const devVersionFile = resolve(rootDir, pyProject, "scripts", "dev", "version.py");
        const versionFilePath = fs.existsSync(versionFile) ? versionFile : devVersionFile;
        if (!fs.existsSync(versionFilePath)) {
            console.log(`Skipping ${pyProject}...`);
            continue;
        }
        const packageManager = getPackageManager(rootDir);
        execSync(`${packageManager} python ${versionFilePath} --set ${newVersion}`, {
            encoding: "utf-8",
            stdio: "inherit",
            cwd: rootDir,
        });
    }
}

/**
 * Bump the version number in the root package.json.
 * @param newVersion The new version number.
 * @throws {Error} If an error occurs.
 */
function bumpRoot(newVersion: string) {
    try {
        const packageJsonPath = join(rootDir, "package.json");
        const packageJson = fs.readJsonSync(packageJsonPath);
        packageJson.version = newVersion;
        fs.writeJsonSync(packageJsonPath, packageJson, { spaces: 4 });
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

/**
 * Check the version number in all projects.
 * @returns {void}
 * @throws {Error} If an error occurs.
 */
function checkTsVersions(): void {
    const version = packageJson.version;
    const tsProjects = packageJson.packages.ts;
    for (const tsProject of tsProjects) {
        const packageJsonPath = resolve(rootDir, tsProject, "package.json");
        if (fs.existsSync(packageJsonPath)) {
            const projectPackageJson = fs.readJsonSync(packageJsonPath, {
                encoding: "utf-8",
            });
            if (projectPackageJson.version !== version) {
                console.error(
                    `Error: ${tsProject} version mismatch. Got: ${projectPackageJson.version}, expected: ${version}`,
                );
                process.exit(1);
            }
            console.info(`\x1b[36m${tsProject} version: ${projectPackageJson.version}`);
        }
    }
}

/**
 * Get the path to the version file in a python project.
 * @param pyProject The python project name.
 * @returns The path to the version.py file.
 */
function getPyVersionPathPath(pyProject: string): string {
    const versionFile = resolve(rootDir, pyProject, "scripts", "version.py");
    const devVersionFile = resolve(rootDir, pyProject, "scripts", "dev", "version.py");
    return fs.existsSync(versionFile) ? versionFile : devVersionFile;
}

/**
 * Check the version number in all python projects.
 * @returns {void}
 * @throws {Error} If an error occurs.
 */
function checkPyVersions(): void {
    const version = packageJson.version;
    const pyProjects = packageJson.packages.py;
    for (const pyProject of pyProjects) {
        const versionFilePath = getPyVersionPathPath(pyProject);
        const versionFilePathRelativeToRoot = versionFilePath.replace(rootDir, ".");
        const packageManager = getPackageManager(rootDir);
        const projectVersion = execSync(`${packageManager} python ${versionFilePathRelativeToRoot} --get`, {
            encoding: "utf-8",
            cwd: rootDir,
        }).trim();
        if (projectVersion !== version) {
            console.error(
                `Error: ${pyProject} version mismatch. Got: ${projectVersion}, expected: ${version}`,
            );
            process.exit(1);
        }
        console.info(`\x1b[36m${pyProject} version: ${projectVersion}`);
    }
}

/**
 * Check the version number in all projects.
 * @returns {void}
 * @throws {Error} If an error occurs.
 */
function checkVersions(): void {
    checkTsVersions();
    checkPyVersions();
    console.info("All versions match\n");
    console.info(`\x1b[36mVersion: ${packageJson.version}\n`);
}

/**
 * Check the command line arguments.
 * If no write action is requested, we exit.
 * @returns {void}
 */
function checkArgs(): void {
    if (process.argv.length < 3) {
        showHelp();
        return;
    }
    if (process.argv.slice(2)[0] === "--help") {
        showHelp();
        return;
    }
    if (process.argv.slice(2)[0] === "--get") {
        showVersion();
        return;
    }
}

/**
 * Main function.
 */
function main() {
    checkArgs();
    if (process.argv.slice(2)[0] === "--check") {
        checkVersions();
        return;
    }
    const newVersion = getNewVersion();
    console.info(`\x1b[36mSetting version: ${newVersion}\n`);
    bumpTs(newVersion);
    bumpPy(newVersion);
    bumpRoot(newVersion);
}

main();
