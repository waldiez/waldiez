/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { spawnSync } from "child_process";
import fs from "fs-extra";
import { lookpath } from "lookpath";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __rootDir = path.resolve(__dirname, "..");

const reactLcov = path.resolve(__rootDir, "coverage", "react", "lcov.info");
const pythonLcov = path.resolve(__rootDir, "coverage", "py", "lcov.info");
const mergedLcov = path.resolve(__rootDir, "coverage", "lcov.info");

const runCommand = (args: string[]) => {
    console.log("Running command:", args.join(" "));
    const proc = spawnSync(args[0], args.slice(1), {
        cwd: __rootDir,
        stdio: "inherit",
        env: process.env,
    });
    if (proc.status !== 0) {
        console.error("Command failed.");
        process.exit(proc.status ?? 1);
    }
};

const doMerge = (lcovCmd: string[]) => {
    const branchCoverage = isLcovV2(lcovCmd) ? "branch_coverage=1" : "lcov_branch_coverage=1";
    runCommand([
        ...lcovCmd,
        "--add-tracefile",
        reactLcov,
        "--add-tracefile",
        pythonLcov,
        "--rc",
        branchCoverage,
        "--rc",
        "geninfo_auto_base=1",
        "--ignore-errors",
        "inconsistent,inconsistent",
        "--ignore-errors",
        "corrupt",
        "--ignore-errors",
        "count",
        "-o",
        mergedLcov,
    ]);
};

const isLcovV2 = (lcovCmd: string[]): boolean => {
    try {
        const result = spawnSync(lcovCmd[0], [...lcovCmd.slice(1), "--version"], {
            cwd: __rootDir,
            encoding: "utf-8",
            stdio: ["ignore", "pipe", "ignore"],
        });

        if (result.status !== 0 || !result.stdout) {
            return false;
        }

        const output = result.stdout.trim();
        return output.includes("version 2");
    } catch {
        return false;
    }
};

const getLcovMac = () => {
    const which = spawnSync("which", ["lcov"]);
    if (which.status === 0 && which.stdout) {
        return ["lcov"];
    }
    console.warn("lcov not found. Skipping.");
    console.warn("You could try using brew to install lcov:");
    console.warn("`brew install lcov`");
    return [];
};

const getLcovLinux = () => {
    const which = spawnSync("which", ["lcov"]);
    if (which.status === 0 && which.stdout) {
        return ["lcov"];
    }
    console.warn("You could try using apt/dnf/pacman/whatever to install lcov");
    console.warn("`sudo apt install lcov`");
    console.warn("`sudo dnf install lcov`");
    console.warn("`sudo pacman -S lcov`");
    return [];
};

const getLcovWindows = (): string[] => {
    const perl = "C:/Strawberry/perl/bin/perl.exe";
    const lcov = "C:/ProgramData/chocolatey/lib/lcov/tools/bin/lcov";
    if (fs.existsSync(perl) && fs.existsSync(lcov)) {
        return [perl, lcov];
    }
    console.warn("lcov not found. You may install it using `choco install lcov`.");
    return [];
};

const checkForLcov = async () => {
    const lCovPath = await lookpath("lcov");
    if (!lCovPath) {
        if (process.platform === "darwin") {
            return getLcovMac();
        }
        if (process.platform === "linux") {
            return getLcovLinux();
        }
        if (process.platform === "win32") {
            return getLcovWindows();
        }
        return [];
    }
    return [lCovPath];
};

const shouldMerge = () => {
    if (!fs.existsSync(reactLcov) || !fs.existsSync(pythonLcov)) {
        console.log("Not all lcov files found. Skipping merge.");
        return false;
    }

    const reactTime = fs.statSync(reactLcov).mtime;
    const pythonTime = fs.statSync(pythonLcov).mtime;

    if (reactTime <= pythonTime) {
        console.log("React lcov is not newer than Python lcov. Skipping merge.");
        return false;
    }
    return true;
};

const main = async () => {
    if (!shouldMerge()) {
        return;
    }
    if (fs.existsSync(mergedLcov)) {
        fs.rmSync(mergedLcov);
    }
    const lcov = await checkForLcov();
    if (lcov && lcov.length > 0) {
        doMerge(lcov);
    }
};

main()
    .then(_ => {
        process.exit(0);
    })
    .catch(e => {
        console.error(e);
        process.exit(1);
    });
