/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import JSZip from "jszip";

export const BASE_EXTENSION = ".waldiez";

const isMac = () => {
    if ("userAgentData" in navigator) {
        if (typeof navigator.userAgentData === "object") {
            const userAgentData = navigator.userAgentData;
            if (userAgentData && "platform" in userAgentData && typeof userAgentData.platform === "string") {
                return userAgentData.platform.toLowerCase().includes("mac");
            }
        }
    }
    // fallback
    return navigator.userAgent.includes("Macintosh") || navigator.userAgent.includes("Mac OS X");
};

const getItemExtension = (itemType: "model" | "skill" | "agent" | "flow") => {
    let extension = BASE_EXTENSION;
    if (itemType !== "flow") {
        // .{BASE_EXTENSION}Model, .{BASE_EXTENSION}Skill, .{BASE_EXTENSION}Agent
        extension += itemType.charAt(0).toUpperCase() + itemType.slice(1);
    }
    if (isMac()) {
        // we might get a Gatekeeper warning on macOS if we use a custom extension
        extension += ".zip";
    }
    return extension;
};

const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

export const getFilenameForExporting = (baseName: string, itemType: "model" | "skill" | "agent" | "flow") => {
    const extension = getItemExtension(itemType);
    let filename = baseName || "flow";
    if (filename.length < 3) {
        filename = "flow";
    }
    if (filename.length > 100) {
        filename = filename.slice(0, 100);
    }
    return `${filename}${extension}`;
};

const downloadZip = async (filename: string, contents: string, onError: () => void) => {
    try {
        const internalName = filename.replace(/\.zip$/, "");
        const zip = new JSZip();
        zip.file(internalName, contents);
        const blob = await zip.generateAsync({ type: "blob" });
        downloadFile(blob, filename);
    } catch {
        onError();
    }
};

export const exportItem = async (
    name: string,
    itemType: "model" | "skill" | "agent" | "flow",
    exporter: () => { [key: string]: unknown } | null,
    onNoItem: () => void = () => {
        console.error("No item to export");
    },
) => {
    const item = exporter();
    if (item) {
        const itemString = JSON.stringify(item, null, 2);
        const filename = getFilenameForExporting(name, itemType);
        if (filename.endsWith(".zip")) {
            await downloadZip(filename, itemString, onNoItem);
        } else {
            const blob = new Blob([itemString], { type: "application/json; charset=utf-8" });
            downloadFile(blob, filename);
        }
    } else {
        onNoItem();
    }
};
