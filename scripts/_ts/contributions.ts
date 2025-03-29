/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

import path from "path";
import fs from "fs-extra";

import { packageJson, rootDir, getPackageManager, runCommandInDir } from "./_lib";

const ALL_CONTRIBUTIONS_RC = ".all-contributorsrc";

const getRootContributions = (): any => {
    const allContributionsPath = path.join(rootDir, ALL_CONTRIBUTIONS_RC);
    if (!fs.existsSync(allContributionsPath)) {
        console.warn(`No ${ALL_CONTRIBUTIONS_RC} found in ${rootDir}`);
        process.exit(0);
    }
    const allContributions = fs.readJSONSync(allContributionsPath);
    return allContributions;
};

const getRootContributors = (): any[] => {
    const allContributions = getRootContributions();
    let allContributors = allContributions.contributors;
    if (!allContributors) {
        allContributors = [];
    }
    return allContributors;
};

const getSubmoduleContributions = (submodule: string): any => {
    const allContributionsPath = path.join(rootDir, submodule, ALL_CONTRIBUTIONS_RC);
    if (!fs.existsSync(allContributionsPath)) {
        console.warn(`No ${ALL_CONTRIBUTIONS_RC} found in ${submodule}`);
        return null;
    }
    const allContributions = fs.readJSONSync(allContributionsPath);
    return allContributions;
};
const getSubmoduleContributors = (submodule: string): any[] => {
    const allContributions = getSubmoduleContributions(submodule);
    if (!allContributions) {
        return [];
    }
    let allContributors = allContributions.contributors;
    if (!allContributors) {
        allContributors = [];
    }
    return allContributors;
};
const mergeContributors = (rootContributors: any[], submoduleContributors: any[]): any[] => {
    const mergedContributors = [...rootContributors];
    for (const submoduleContributor of submoduleContributors) {
        const existingContributor = mergedContributors.find(
            contributor => contributor.login === submoduleContributor.login,
        );
        if (existingContributor) {
            // merge contributions
            const existingContributions = existingContributor.contributions || [];
            const newContributions = submoduleContributor.contributions || [];
            const mergedContributions = [...new Set([...existingContributions, ...newContributions])];
            existingContributor.contributions = mergedContributions;
        } else {
            // add new contributor
            mergedContributors.push(submoduleContributor);
        }
    }
    return mergedContributors;
};
const writeContributions = (allContributions: any): void => {
    const allContributionsPath = path.join(rootDir, ALL_CONTRIBUTIONS_RC);
    fs.writeJSONSync(allContributionsPath, allContributions, { spaces: 4 });
};
const getSubmodules = (): string[] => {
    const tsSubmodules = packageJson.packages.ts;
    const pySubmodules = packageJson.packages.py;
    const allSubmodules = [...tsSubmodules, ...pySubmodules];
    return allSubmodules;
};
const getSubmoduleContributionsFromAllSubmodules = (submodules: string[]): any[] => {
    const allContributors: any[] = [];
    for (const submodule of submodules) {
        const submoduleContributors = getSubmoduleContributors(submodule);
        if (submoduleContributors) {
            allContributors.push(...submoduleContributors);
        }
    }
    return allContributors;
};
const getMergedContributors = (): any[] => {
    const rootContributors = getRootContributors();
    const submodules = getSubmodules();
    const submoduleContributors = getSubmoduleContributionsFromAllSubmodules(submodules);
    const mergedContributors = mergeContributors(rootContributors, submoduleContributors);
    return mergedContributors;
};
const main = (): void => {
    const allContributions = getRootContributions();
    const mergedContributors = getMergedContributors();
    allContributions.contributors = mergedContributors;
    writeContributions(allContributions);
    console.log(`Merged allContributions: ${JSON.stringify(allContributions, null, 4)}`);
    // let's also call: NODE_NO_WARNINGS=1 ${packageManager} all-contributors check
    //
    // no warnings: to avoid: (node:79251)
    // [DEP0040] DeprecationWarning: The `punycode` module is deprecated.
    //  Please use a userland alternative instead.
    const packageManager = getPackageManager(rootDir);
    const allContributorsCheckCommand = `${packageManager} all-contributors check`;
    runCommandInDir(rootDir, allContributorsCheckCommand, [], true, { NODE_NO_WARNINGS: "1" });
    // let's also re-generate the all-contributors view in README.md:
    const allContributorsGenerateCommand = `${packageManager} all-contributors generate`;
    runCommandInDir(rootDir, allContributorsGenerateCommand, [], true, { NODE_NO_WARNINGS: "1" });
};

main();
