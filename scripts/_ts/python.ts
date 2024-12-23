/**
 * Run python commands using the compatible python version.
 * If no virtual environment is found, it creates one.
 */
import { execSync } from "child_process";
import fs from "fs-extra";
import path from "path";

import { rootDir } from "./_lib";

// this dir: scripts/_ts
const __me = path.relative(rootDir, __filename);

const isWindows = process.platform === "win32";
const possibleVenvNames = [".venv", "venv"];
const possiblePys = ["python", "python3", "python3.10", "python3.11", "python3.12"];

/**
 * Check if the python version is greater than or equal to 3.10 and less than 3.13
 * @param pyCmd the python command to check
 * @returns true if the python version is compatible, false otherwise
 */
function isPyGte310lte313(pyCmd: string) {
    const pythonVersion = execSync(`${pyCmd} --version`).toString();
    const version = pythonVersion.split(" ")[1];
    const [major, minor] = version.split(".").map(x => parseInt(x, 10));
    if (major !== 3 || minor < 10 || minor >= 13) {
        return false;
    }
    return true;
}

/**
 * Check if the python executable is in a virtual environment
 * @param pythonExecutable the python executable
 * @returns true if the python executable is in a virtual environment, false otherwise
 */
function inVenv(pythonExecutable: string): boolean {
    try {
        const toRun =
            "import sys; print((hasattr(sys, 'real_prefix') or (hasattr(sys, 'base_prefix') and sys.base_prefix != sys.prefix)))";
        const output = execSync(`${pythonExecutable} -c "${toRun}"`).toString();
        return output.trim() === "True";
    } catch (_) {
        console.error("Error checking if in virtual environment");
        return false;
    }
}

/**
 * Get a compatible python executable
 * @returns the compatible python executable if found, null otherwise,
 * along with a boolean indicating if the python executable is in a virtual environment
 * if no compatible python is found
 */
function getCompatiblePythonExecutable(): { path: string | null; virtualEnv: boolean } {
    let pyThonExec: string | null = null;
    for (const pyCmd of possiblePys) {
        try {
            execSync(`${pyCmd} --version`);
            if (isPyGte310lte313(pyCmd)) {
                pyThonExec = pyCmd;
                break;
            }
        } catch (_) {
            continue;
        }
    }
    if (!pyThonExec) {
        return { path: null, virtualEnv: false };
    }
    return { path: pyThonExec, virtualEnv: inVenv(pyThonExec) };
}

/**
 * Get a new python executable
 * @returns the new python executable
 */
function getNewPythonExecutable() {
    console.info("No virtual environment found. Creating one...");
    const pyThonExec = getCompatiblePythonExecutable();
    if (!pyThonExec) {
        console.error("No compatible python found");
        process.exit(1);
    }
    const resolvedDir = path.resolve(rootDir, possibleVenvNames[0]);
    execSync(`${pyThonExec} -m venv ${resolvedDir}`);
    const pythonPath = isWindows
        ? path.join(resolvedDir, "Scripts", "python.exe")
        : path.join(resolvedDir, "bin", "python");
    execSync(`${pythonPath} -m pip install --upgrade pip uv`);
    return pythonPath;
}

/**
 * Get the python executable from the virtual environment directory
 * @param venvDir the virtual environment directory
 * @returns the python executable
 */
function getVenvPythonExecutable(venvDir: string) {
    const venvPythonPath = isWindows
        ? path.join(venvDir, "Scripts", "python.exe")
        : path.join(venvDir, "bin", "python");
    return venvPythonPath;
}

/**
 * Get the python executable
 * @returns the python executable
 */
function tryGetPythonExecutable(): string | null {
    let { path: pythonPath, virtualEnv: found } = getCompatiblePythonExecutable();
    if (found) {
        return pythonPath;
    }
    for (const venvName of possibleVenvNames) {
        const venvDir = path.join(rootDir, venvName);
        const venvPythonPath = getVenvPythonExecutable(venvDir);
        if (fs.existsSync(venvPythonPath)) {
            pythonPath = venvPythonPath;
            found = true;
            break;
        }
    }
    return found === true ? pythonPath : getNewPythonExecutable();
}

/**
 * Get the python executable
 * @returns the python executable
 */
function getPythonExecutable(): string {
    const pythonExec = tryGetPythonExecutable();
    if (!pythonExec) {
        console.error("No compatible python found");
        process.exit(1);
    }
    if (!inVenv(pythonExec)) {
        for (const venvName of possibleVenvNames) {
            const venvDir = path.join(rootDir, venvName);
            const venvPythonPath = getVenvPythonExecutable(venvDir);
            if (fs.existsSync(venvPythonPath)) {
                return venvPythonPath;
            }
        }
    }
    return pythonExec;
}

/**
 * Show help
 */
function showHelp() {
    console.info(`\x1b[36mUsage: node --import=tsx ${__me} <args>`);
    console.info(
        "\x1b[36m\nExamples: \n" +
            "\nyarn python --version\n" +
            "node --import=tsx scripts/python.ts -m pip install -r requirements/all.txt\n" +
            "bun scripts/python.ts path/to/file.py\n",
    );
    process.exit(0);
}

/**
 * Main function
 */
function main() {
    try {
        const cmd_args = process.argv.slice(2);
        if (cmd_args.length === 0 || cmd_args[0] === "-h" || cmd_args[0] === "--help") {
            showHelp();
        }
        const pythonExec = getPythonExecutable();
        const cmd_args_str = cmd_args.join(" ");
        execSync(`${pythonExec} ${cmd_args_str}`, { stdio: "inherit" });
    } catch (err) {
        console.error("Error:", (err as Error).message);
        process.exit(1);
    }
}

main();
