/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DropZone } from "@waldiez/components/dropZone";

const onUpload = vi.fn();
const flowId = "test";

const renderDropZone = (overrides: { [key: string]: any } = {}) => {
    const dropZoneProps = {
        flowId,
        onUpload,
        allowedFileExtensions: [".jpg", ".txt"],
        ...overrides,
    };
    return render(<DropZone {...dropZoneProps} />);
};

describe("DropZone", () => {
    afterEach(() => {
        onUpload.mockClear();
    });

    it("should render successfully", () => {
        const { baseElement } = renderDropZone();
        expect(baseElement).toBeTruthy();
    });

    it("should handle file drop", async () => {
        act(() => {
            renderDropZone();
        });
        const dropZone = screen.getByTestId(`drop-zone-${flowId}`);
        const files = [new File(["file1"], "file1.txt")];
        fireEvent.drop(dropZone, {
            dataTransfer: {
                files,
            },
        });
        await waitFor(() => {
            expect(onUpload).toHaveBeenCalledWith(files);
        });
    });

    it("should handle file drag over and drag leave", () => {
        act(() => {
            renderDropZone();
        });
        const dropZone = screen.getByTestId(`drop-zone-${flowId}`);
        fireEvent.dragOver(dropZone);
        expect(dropZone.classList.contains("drag-over")).toBeTruthy();
        fireEvent.dragLeave(dropZone);
        expect(dropZone.classList.contains("drag-over")).toBeFalsy();
    });

    it("should handle upload with click", async () => {
        act(() => {
            renderDropZone();
        });
        const dropZone = screen.getByTestId(`drop-zone-${flowId}`);
        fireEvent.click(dropZone);
        const input = screen.getByTestId("drop-zone-file-input");
        const file = new File(["file1"], "file1.txt");
        Object.defineProperty(input, "files", {
            value: [file],
        });
        fireEvent.change(input);
        await waitFor(() => {
            expect(onUpload).toHaveBeenCalled();
        });
        // make sure input is not in the document anymore
        expect(screen.queryByTestId("drop-zone-file-input")).toBeNull();
    });

    it("should handle invalid file uploads", async () => {
        act(() => {
            renderDropZone({
                multiple: true,
            });
        });
        const largeFile = new File(["file1"], "large-file.txt");
        Object.defineProperty(largeFile, "size", {
            value: 1024 * 1024 * 10 + 2,
        });
        const pngFile = new File(["file1"], "image-file.png", {
            type: "image/png",
        });
        Object.defineProperty(pngFile, "name", {
            value: "image-file.png",
        });
        const docFile = new File(["file1"], "doc-file.doc", {
            type: "application/msword",
        });
        Object.defineProperty(docFile, "name", {
            value: "doc-file.doc",
        });
        const validImage = new File(["file1"], "valid-file.jpg", {
            type: "image/jpeg",
        });
        const validText = new File(["file1"], "valid-file.txt", {
            type: "text/plain",
        });
        const files = [largeFile, pngFile, docFile, validImage, validText];
        const dropZone = screen.getByTestId(`drop-zone-${flowId}`);
        fireEvent.click(dropZone);
        const input = screen.getByTestId("drop-zone-file-input");
        Object.defineProperty(input, "files", {
            value: files,
        });
        fireEvent.change(input);
        await waitFor(() => {
            expect(onUpload).toHaveBeenCalledWith([validImage, validText]);
        });
    });
});
