/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

import path from "path";
import fs from "fs-extra";
import { execSync } from "child_process";

import { packageJson, __rootDir } from "./_lib";

const expectedBranch = "main";

const getCurrentGitBranch = (projectDir: string): string => {
    try {
        return execSync("git rev-parse --abbrev-ref HEAD", {
            cwd: projectDir,
            encoding: "utf-8",
        }).trim();
    } catch (err) {
        throw new Error(`Failed to get current branch in ${projectDir}: ${err}`);
    }
};

const getGitSubmodules = (dir: string): string[] => {
    const submodulesFile = path.join(dir, ".gitmodules");
    if (!fs.existsSync(submodulesFile)) {
        throw new Error(`No .gitmodules file found in ${dir}`);
    }
    const submodulesContent = fs.readFileSync(submodulesFile, "utf-8");
    const submoduleLines = submodulesContent.split("\n");
    const submodules: string[] = [];
    for (const line of submoduleLines) {
        const match = line.match(/^\s*path\s*=\s*(.*)/);
        if (match) {
            const submodulePath = match[1].trim();
            if (submodulePath && !submodules.includes(submodulePath)) {
                submodules.push(submodulePath);
            }
        }
    }
    return submodules;
};

const main = (): void => {
    const submodules = getGitSubmodules(__rootDir);

    for (const project of submodules) {
        const projectDir = path.join(__rootDir, project);

        if (!fs.existsSync(path.join(projectDir, ".git"))) {
            console.warn(`Skipping ${projectDir} : not a Git repo.`);
            continue;
        }

        const currentBranch = getCurrentGitBranch(projectDir);
        if (currentBranch !== expectedBranch) {
            throw new Error(
                `Submodule ${project} is on branch '${currentBranch}', expected '${expectedBranch}'.`,
            );
        } else {
            console.log(`${project} is on '${expectedBranch}'`);
        }
    }
};

main();
