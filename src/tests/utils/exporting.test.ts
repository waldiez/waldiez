/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { BASE_EXTENSION, exportItem, getFilenameForExporting } from "@waldiez/utils";

// Mock JSZip with inline functions
vi.mock("jszip", () => {
    const mockZipFile = vi.fn();
    const mockZipGenerateAsync = vi.fn();
    const MockJSZip = vi.fn(() => ({
        file: mockZipFile,
        generateAsync: mockZipGenerateAsync,
    }));

    // Attach mocks to the constructor so we can access them in tests
    Object.defineProperty(MockJSZip, "mockZipFile", { get: () => mockZipFile, configurable: true });
    Object.defineProperty(MockJSZip, "mockZipGenerateAsync", {
        get: () => mockZipGenerateAsync,
        configurable: true,
    });
    // MockJSZip.mockZipFile = mockZipFile;
    // MockJSZip.mockZipGenerateAsync = mockZipGenerateAsync;

    return {
        default: MockJSZip,
    };
});

describe("exportItem", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should export an item", () => {
        vi.spyOn(URL, "createObjectURL");
        const exporter = () => ({ id: "1" });
        exportItem("test", "model", exporter);
        waitFor(() => expect(URL.createObjectURL).toHaveBeenCalled());
        waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalled());
    });

    it("should not export an item", () => {
        vi.spyOn(URL, "createObjectURL");
        const exporter = () => null;
        exportItem("test", "model", exporter);
        waitFor(() => expect(URL.createObjectURL).not.toHaveBeenCalled());
        waitFor(() => expect(URL.revokeObjectURL).toHaveBeenCalled());
    });

    it("should export as ZIP on macOS", async () => {
        // Mock macOS
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2)",
            configurable: true,
        });

        const JSZip = (await import("jszip")).default;
        const mockJSZip = vi.mocked(JSZip);
        const mockBlob = new Blob(["test"]);

        // Access the attached mock functions
        // @ts-expect-error mocked JSZip does not have a type definition for mockZipFile
        mockJSZip.mockZipGenerateAsync.mockResolvedValue(mockBlob);
        vi.spyOn(URL, "createObjectURL");

        const exporter = () => ({ id: "1" });
        await exportItem("test", "flow", exporter);

        expect(mockJSZip).toHaveBeenCalled();
        // @ts-expect-error mocked JSZip does not have a type definition for mockZipFile
        expect(mockJSZip.mockZipFile).toHaveBeenCalled();
        // @ts-expect-error mocked JSZip does not have a type definition for mockZipGenerateAsync
        expect(mockJSZip.mockZipGenerateAsync).toHaveBeenCalled();
    });

    it("should handle ZIP error", async () => {
        // Mock macOS
        Object.defineProperty(navigator, "userAgent", {
            value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2)",
            configurable: true,
        });

        const JSZip = (await import("jszip")).default;
        const mockJSZip = vi.mocked(JSZip);

        // @ts-expect-error mocked JSZip does not have a type definition for mockZipGenerateAsync
        mockJSZip.mockZipGenerateAsync.mockRejectedValue(new Error("ZIP failed"));
        const onError = vi.fn();

        const exporter = () => ({ id: "1" });
        await exportItem("test", "flow", exporter, onError);

        expect(onError).toHaveBeenCalled();
    });
});

describe("getFilenameForExporting", () => {
    const originalUserAgent = navigator.userAgent;
    let userAgentGetter: PropertyDescriptor | undefined;

    beforeEach(() => {
        vi.stubGlobal("navigator", {
            userAgent: originalUserAgent,
            userAgentData: undefined,
        });
        userAgentGetter = Object.getOwnPropertyDescriptor(window.navigator, "userAgent");
    });

    afterEach(() => {
        // Restore userAgent stub
        if (userAgentGetter) {
            Object.defineProperty(window.navigator, "userAgent", userAgentGetter);
        }
        vi.unstubAllGlobals();
    });

    it("should append .zip on macOS", () => {
        Object.defineProperty(window.navigator, "userAgent", {
            value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15",
            configurable: true,
        });

        // @ts-expect-error stub platform
        navigator.userAgentData = { platform: "macOS" };

        const filename = getFilenameForExporting("example", "flow");
        expect(filename.endsWith(`${BASE_EXTENSION}.zip`)).toBe(true);
    });

    it("should include type-specific extension", () => {
        const filename = getFilenameForExporting("example", "tool");
        expect(filename.includes("Tool")).toBe(true);
    });

    it("should fallback to 'flow' if name is too short", () => {
        const filename = getFilenameForExporting("", "agent");
        expect(filename.startsWith("flow")).toBe(true);
    });

    it("should trim name if too long", () => {
        const longName = "a".repeat(150);
        const filename = getFilenameForExporting(longName, "model");
        expect(filename.length).toBeLessThanOrEqual(100 + `.${BASE_EXTENSION}Model`.length + 4); // + optional .zip
    });
});
