import { execSync } from "child_process";
import { Command } from "commander";
import dotenv from "dotenv";
import path from "path";
import url from "url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ override: false });

process.env.PYTHONUNBUFFERED = "1";
const ROOT_DIR = path.resolve(__dirname, "..");
const DEFAULT_IMAGE = process.env.IMAGE_NAME || "my/package";
const FALLBACK_TAG = process.argv.includes("--dev") ? "dev" : "latest";
const DEFAULT_TAG = process.env.IMAGE_TAG || FALLBACK_TAG;
const DEFAULT_PLATFORM = process.env.PLATFORM || "linux/amd64";
let DEFAULT_CONTAINER_FILE = "Containerfile";
if (process.argv.includes("--dev")) {
    DEFAULT_CONTAINER_FILE = "Containerfile.dev";
}

function isCommandAvailable(command: string): boolean {
    try {
        execSync(`${command} --version`, { stdio: "ignore" });
        return true;
    } catch {
        return false;
    }
}
function getContainerCmd(): string {
    const fromEnv = process.env.CONTAINER_COMMAND || "";
    if (["docker", "podman"].includes(fromEnv)) {
        return fromEnv;
    }
    if (isCommandAvailable("podman")) {
        return "podman";
    }
    return "docker";
}

function runCommand(command: string[]): void {
    console.log(`Running command: \n${command.join(" ")}\n`);
    execSync(command.join(" "), {
        stdio: "inherit",
        cwd: ROOT_DIR,
        env: process.env,
    });
}

function buildImage(
    containerFile: string,
    imageName: string,
    imageTag: string,
    imagePlatform: string,
    containerCommand: string,
    noCache: boolean,
    buildArgs: string[],
): void {
    const cmd = [
        containerCommand,
        "build",
        "--platform",
        imagePlatform,
        "--tag",
        `${imageName}:${imageTag}`,
        "-f",
        containerFile,
    ];
    if (noCache) {
        cmd.push("--no-cache");
    }
    buildArgs.forEach(arg => {
        cmd.push("--build-arg", arg);
    });
    if (containerCommand === "docker") {
        cmd.push("--progress=plain");
    }
    cmd.push(".");
    runCommand(cmd);
}

function pushImage(
    imageName: string,
    imageTag: string,
    imagePlatform: string,
    containerCommand: string,
): void {
    console.log("Let's say that we:");
    runCommand([containerCommand, "push", "--platform", imagePlatform, `${imageName}:${imageTag}`]);
    console.log(`Pushed image: ${imageName}:${imageTag}`);
}
function isWindowsPlatform(): boolean {
    return process.platform === "win32";
}

function getPlatformArch(): string {
    let myArch: string = process.arch;
    if (myArch === "x64") {
        myArch = "amd64";
    } else if (["arm64", "aarch64"].includes(myArch)) {
        myArch = "arm64";
    }
    return myArch;
}

function setupQemu(containerCommand: string): void {
    try {
        runCommand([
            containerCommand,
            "run",
            "--rm",
            "--privileged",
            "multiarch/qemu-user-static",
            "reset",
            "-p",
            "yes",
        ]);
    } catch (error) {
        console.warn("Error setting up multi-platform support:", error);
    }
}

function checkOtherPlatform(containerCommand: string, platformArg: string): boolean {
    const isWindows = isWindowsPlatform();
    let isOtherPlatform = isWindows;

    if (!isWindows) {
        const myArch = getPlatformArch();
        if (platformArg !== `linux/${myArch}`) {
            isOtherPlatform = true;
        }
    }

    if (isOtherPlatform) {
        setupQemu(containerCommand);
    }

    return isOtherPlatform;
}

const program = new Command();
program
    .description("Build container image.")
    .option("--image-name <name>", "Name of the image to build.", DEFAULT_IMAGE)
    .option("--image-tag <tag>", "Tag of the image to build.", DEFAULT_TAG)
    .option("--platform <platform>", "Set platform if the image is multi-platform.", DEFAULT_PLATFORM)
    .option("--container-command <command>", "The container command to use.", getContainerCmd())
    .option("--build-args <args...>", "Build arguments.", (value, previous) => previous.concat([value]), [])
    .option("--no-cache", "Do not use cache when building the image.", false)
    .option("--push", "Push the image.", false)
    .option("--container-file <file>", "The container file to use.", DEFAULT_CONTAINER_FILE)
    .option("--dev", "Use the development container file.", false);

function main(): void {
    const options = program.parse(process.argv).opts();

    const { imageName, imageTag, platform, containerCommand, buildArgs, noCache, push, containerFile } =
        options;

    const allowError = checkOtherPlatform(containerCommand, platform);
    try {
        buildImage(containerFile, imageName, imageTag, platform, containerCommand, noCache, buildArgs);
        if (push) {
            pushImage(imageName, imageTag, platform, containerCommand);
        }
    } catch (error) {
        if (allowError) {
            console.error("Error:", error);
        } else {
            throw error;
        }
    }
}

if (require.main === module) {
    main();
}
