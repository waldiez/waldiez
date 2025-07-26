/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * simple `mkdir -p` using fsPromises.mkdir
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { promises as fs } from "fs";
import { resolve, sep } from "path";

/**
 * Create a directory
 * @param path - the path to create
 * @param parents - whether to create parent directories
 */
const mkdir = (path: string, parents: boolean): Promise<void> => {
    const options = { recursive: parents };
    const resolved = resolve(path);
    return new Promise<void>((resolve, reject) => {
        fs.access(resolved)
            .then(() => {
                fs.stat(resolved)
                    .then(stats => {
                        if (stats.isDirectory()) {
                            resolve();
                        } else {
                            reject(new Error(`${resolved} is not a directory`));
                        }
                    })
                    .catch(err => {
                        reject(err);
                    });
            })
            .catch(() => {
                // Directory does not exist, create it
                fs.mkdir(resolved, options)
                    .then(() => {
                        resolve();
                    })
                    .catch(err => {
                        reject(err);
                    });
            });
    });
};

const usage = (isHelp: boolean = false) => {
    const myName = process.argv[1].split(sep).pop();
    const consoleLog = isHelp ? console.info : console.error;
    const exitCode = isHelp ? 0 : 1;
    consoleLog(`Usage: node --import=tsx ${myName} --path <path> [--parents]`);
    process.exit(exitCode);
};

const isValidCall = () => {
    if (
        process.argv.includes("-h") ||
        process.argv.includes("--help") ||
        process.argv.length < 3 ||
        process.argv.length > 5
    ) {
        usage(true);
    }
};
const parseArgs = () => {
    const args = process.argv.slice(2);
    let path = "";
    let parents = false;
    for (let i = 0; i < args.length; i++) {
        if (args[i] === "--path") {
            path = args[i + 1];
            i++;
        } else if (args[i] === "--parents") {
            parents = true;
        }
    }
    return { path, parents };
};

const main = () => {
    isValidCall();
    const { path, parents } = parseArgs();
    if (path === "") {
        usage();
        return;
    }
    mkdir(path, parents)
        .then(() => {
            process.exit(0);
        })
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
};

main();
