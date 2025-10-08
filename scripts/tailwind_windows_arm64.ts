/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/*
with bun, when trying to build (vite), we might get:
    Error: Cannot find module 'lightningcss.win32-arm64-msvc.node'
It seems that "lightningcss-win32-x64-msvc" is installed instead
bun reports "process.arch": "x64"
let's try to detect and fix this case
*/
import { execSync, spawnSync } from "child_process";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// this dir: scripts
const __rootDir = path.resolve(__dirname, "..");

const lightningPkg = "lightningcss-win32-arm64-msvc";
const oxidePkg = "@tailwindcss/oxide-win32-arm64-msvc";
const extraPackages = [lightningPkg, oxidePkg];

function install(pkg: string) {
    console.log(`[setup-native-tailwind] Installing ${pkg} ...`);
    execSync(`npm install --save-dev ${pkg}`, { stdio: "inherit" });
}

function isInstalled(pkg: string): boolean {
    const modulePath = path.join("node_modules", pkg);
    return existsSync(modulePath);
}

function getTrueArch(): string {
    const result = spawnSync("node", ["-p", "process.arch"], { encoding: "utf8" });
    return result.stdout.trim();
}

function installExtraPkgs(): void {
    extraPackages.forEach(pkg => {
        if (!isInstalled(pkg)) {
            install(pkg);
        }
    });
}

function rollbackPackageJson(): void {
    const pkgPath = path.resolve(__rootDir, "package.json");
    const raw = readFileSync(pkgPath, "utf8");
    const pkg = JSON.parse(raw);

    const devDeps = pkg.devDependencies || {};
    const normalDeps = pkg.dependencies || {};
    const removedDeps: string[] = [];
    const removedDevDeps: string[] = [];

    extraPackages.forEach(dep => {
        if (devDeps[dep]) {
            delete devDeps[dep];
            removedDevDeps.push(dep);
        }
        if (normalDeps[dep]) {
            delete normalDeps[dep];
            removedDeps.push(dep);
        }
    });

    if (removedDevDeps.length > 0) {
        pkg.devDependencies = devDeps;
    }
    if (removedDeps.length > 0) {
        pkg.dependencies;
    }
    if (removedDevDeps.length > 0 || removedDeps.length > 0) {
        writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
    }
}

function cleanUp(): void {
    rollbackPackageJson();
    const packageLock = path.resolve(__rootDir, "package-lock.json");
    if (existsSync(packageLock)) {
        rmSync(packageLock);
    }
}

function main() {
    const isWindows = process.platform === "win32";
    if (!isWindows) {
        return;
    }
    const arch = getTrueArch();
    const isWinArm64 = arch.toLowerCase() === "arm64";
    if (!isWinArm64) {
        return;
    }
    installExtraPkgs();
    cleanUp();
}

try {
    main();
} catch {
    //
}
