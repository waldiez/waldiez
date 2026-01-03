/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import JSZip from "jszip";

export const BASE_EXTENSION = ".waldiez";

/**
 * Check if the current device is an Apple device (macOS, iOS, or iPadOS).
 *
 * This function uses `navigator.userAgentData` if available,
 * and falls back to checking `navigator.userAgent` for older browsers.
 *
 * @returns True if the device is Apple (macOS or iOS), false otherwise.
 */
const isAppleDevice = (): boolean => {
    // Modern API (Chromium-based browsers)
    if ("userAgentData" in navigator && typeof navigator.userAgentData === "object") {
        const userAgentData = navigator.userAgentData;
        if (userAgentData && "platform" in userAgentData && typeof userAgentData.platform === "string") {
            const platform = userAgentData.platform.toLowerCase();
            /* c8 ignore next -- @preserve */
            return platform.includes("mac") || platform.includes("ios");
        }
    }

    // Fallback: check legacy userAgent
    const ua = navigator.userAgent;
    return /Macintosh|Mac OS X|iPhone|iPad|iPod/i.test(ua);
};

/**
 * Get the appropriate file extension based on the item type.
 *
 * @param itemType - The type of item being exported (model, tool, agent, or flow).
 * @returns The file extension for the specified item type.
 */
const getItemExtension = (itemType: "model" | "tool" | "agent" | "flow") => {
    let extension = BASE_EXTENSION;
    if (itemType !== "flow") {
        // .{BASE_EXTENSION}Model, .{BASE_EXTENSION}Tool, .{BASE_EXTENSION}Agent
        extension += itemType.charAt(0).toUpperCase() + itemType.slice(1);
    }
    if (isAppleDevice()) {
        // we might get a Gatekeeper warning on macOS if we use a custom extension
        extension += ".zip";
    }
    return extension;
};

/**
 * Download a file with the specified blob and filename.
 *
 * @param blob - The Blob object containing the file data.
 * @param filename - The name of the file to be downloaded.
 */
const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
};

/**
 * Get a filename for exporting an item, ensuring it has the correct extension
 * and adheres to length constraints.
 *
 * @param baseName - The base name for the file.
 * @param itemType - The type of item being exported (model, tool, agent, or flow).
 * @returns A formatted filename with the appropriate extension.
 */
export const getFilenameForExporting = (baseName: string, itemType: "model" | "tool" | "agent" | "flow") => {
    const extension = getItemExtension(itemType);
    let filename = baseName || "flow";
    /* c8 ignore next 3 -- @preserve */
    if (filename.length < 3) {
        filename = "flow";
    }
    if (filename.length > 100) {
        filename = filename.slice(0, 100);
    }
    return `${filename}${extension}`;
};

/**
 * Download a ZIP file containing the specified contents.
 *
 * @param filename - The name of the ZIP file to be created.
 * @param contents - The contents to be included in the ZIP file.
 * @param onError - Callback function to handle errors during download.
 */
const downloadZip = async (filename: string, contents: string, onError: () => void) => {
    try {
        const internalName = filename.replace(/\.zip$/, "");
        const zip = new JSZip();
        zip.file(internalName, contents);
        const blob = await zip.generateAsync({ type: "blob" });
        downloadFile(blob, filename);
        console.error("Downloaded????");
    } catch {
        onError();
    }
};

/**
 * Export an item (model, tool, agent, or flow) to a file.
 *
 * @param name - The name of the item to be exported.
 * @param itemType - The type of item being exported (model, tool, agent, or flow).
 * @param exporter - A function that returns the item data to be exported.
 * @param onNoItem - Callback function to handle cases where there is no item to export.
 */
export const exportItem = async (
    name: string,
    itemType: "model" | "tool" | "agent" | "flow",
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
            const blob = new Blob([itemString], {
                type: "application/json; charset=utf-8",
            });
            downloadFile(blob, filename);
        }
    } else {
        onNoItem();
    }
};
