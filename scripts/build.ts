/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { execSync } from "child_process";
import { existsSync, renameSync, rmSync, unlinkSync, writeFileSync } from "fs";
import { platform } from "os";

const isCI = process.env.CI === "true";
const isLinux = platform() === "linux";
const forceLocal = process.argv.includes("--local");

// Detect if docker or podman is available
function getContainerRuntime(): "docker" | "podman" | null {
    const runtimes = ["docker", "podman"];

    for (const runtime of runtimes) {
        try {
            execSync(`${runtime} ps`, { stdio: "pipe" });
            return runtime as "docker" | "podman";
        } catch {
            continue;
        }
    }

    return null;
}

// Build locally
function buildLocal() {
    console.log("🔨 Building locally with vite...");
    execSync("bun run build:lib:local", { stdio: "inherit" });
    console.log("✅ Build complete!");
}

// Manage .dockerignore
function setupDockerignore(): () => void {
    const dockerignorePath = "./.dockerignore";
    const dockerignoreBackupPath = "./.dockerignore.backup";
    let hadExisting = false;

    // Backup existing .dockerignore if it exists
    if (existsSync(dockerignorePath)) {
        console.log("📋 Backing up existing .dockerignore...");
        renameSync(dockerignorePath, dockerignoreBackupPath);
        hadExisting = true;
    }

    // Create optimized .dockerignore for build
    const dockerignoreContent = `
# ignore everything
**/*
# but not these files...
!package.json
!bun.lock
!src
!vite*
!tsconfig*
!public/icons/
`.trim();

    writeFileSync(dockerignorePath, dockerignoreContent);
    console.log("📝 Created temporary .dockerignore");

    // Return cleanup function
    return () => {
        try {
            unlinkSync(dockerignorePath);
            console.log("🗑️  Removed temporary .dockerignore");
        } catch {}

        if (hadExisting) {
            try {
                renameSync(dockerignoreBackupPath, dockerignorePath);
                console.log("📋 Restored original .dockerignore");
            } catch (error) {
                console.error("⚠️  Failed to restore .dockerignore:", error);
            }
        }
    };
}

// Build in container
function buildInContainer(runtime: "docker" | "podman") {
    console.log(`🐳 Building in ${runtime} container (non-Linux host)...`);

    const image = "oven/bun:latest";
    const targetPlatform = "linux/amd64";
    const workdir = "/app";

    const containerfileContent = `
ARG PLATFORM_TARGET=${targetPlatform}
FROM --platform=\${PLATFORM_TARGET} ${image}
WORKDIR ${workdir}
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY vite.config.* tsconfig*.json ./
COPY vite.plugins/ ./vite.plugins/
COPY src/ ./src/
COPY public/icons/ ./public/icons/
RUN bun run build:lib:local
`.trim();

    const containerfilePath = "./.Containerfile.build";
    const cleanupDockerignore = setupDockerignore();

    try {
        writeFileSync(containerfilePath, containerfileContent);

        // Build image
        console.log("📦 Building container image...");
        const runtimeArg = runtime === "podman" ? runtime : `${runtime} buildx`;
        const buildArgs = `--platform=${targetPlatform}`;
        execSync(`${runtimeArg} build ${buildArgs} -f ${containerfilePath} -t waldiez-react-builder .`, {
            stdio: "inherit",
        });

        // Run container and copy dist
        console.log("🚀 Running build in container...");

        // Remove old dist
        try {
            rmSync("dist", { recursive: true, force: true });
        } catch (error) {
            console.warn(`⚠️  Could not remove old dist folder: ${error}`);
        }

        // Create container, run build, copy dist
        const containerId = execSync(`${runtime} create --platform=${targetPlatform} waldiez-react-builder`, {
            encoding: "utf-8",
        }).trim();

        execSync(`${runtime} cp ${containerId}:${workdir}/dist ./dist`, {
            stdio: "inherit",
        });

        // Fix ownership (Unix-like systems)
        if (platform() !== "win32") {
            try {
                const uid = process.getuid?.() || 1000;
                const gid = process.getgid?.() || 1000;
                execSync(`chown -R ${uid}:${gid} ./dist`, { stdio: "pipe" });
                console.log("🔧 Fixed file ownership");
            } catch {
                console.warn("⚠️  Could not fix ownership (may need sudo)");
            }
        }

        // Cleanup container
        execSync(`${runtime} rm ${containerId}`, { stdio: "pipe" });

        console.log("✅ Build complete!");
    } finally {
        // Cleanup temporary Dockerfile
        try {
            unlinkSync(containerfilePath);
        } catch {}

        // Restore .dockerignore
        cleanupDockerignore();
    }
}

// Main execution
function main() {
    console.log(`Platform: ${platform()}`);
    console.log(`CI: ${isCI}`);

    // If in CI or on Linux, build locally
    if (isCI || isLinux || forceLocal) {
        buildLocal();
        return;
    }
    const runtime = getContainerRuntime();

    if (!runtime) {
        console.warn("⚠️  No (running) container runtime detected. Falling back to local build");
        buildLocal();
        return;
    }

    // On non-Linux, try to use container
    console.log("⚠️  Non-Linux host detected. Attempting containerized build...");

    try {
        buildInContainer(runtime);
    } catch (error) {
        console.error("❌ Container build failed:", error);
        console.error("\n💡 Try running with --local flag to build locally anyway.");
        process.exit(1);
    }
}

main();
