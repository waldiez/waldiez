/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { DropZoneProps } from "@waldiez/components/dropZone/types";
import { showSnackbar } from "@waldiez/utils";

export const useDropZone = (props: DropZoneProps) => {
    const { flowId, onUpload, allowedFileExtensions, multiple = false } = props;
    const onFileDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add("drag-over");
    };
    const onFileDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove("drag-over");
    };
    const onOpenUploadDialog = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = multiple;
        input.style.display = "none";
        input.setAttribute("data-testid", "drop-zone-file-input");
        input.accept = allowedFileExtensions.join(",");
        input.onchange = event => {
            if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length) {
                const validFiles = Array.from(event.target.files).filter(file =>
                    allowedFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)),
                );
                if (validFiles.length) {
                    handleUpload(validFiles);
                }
            }
            input.remove();
        };
        document.body.appendChild(input);
        input.click();
    };
    const onFileDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove("drag-over");
        if (event.dataTransfer.files.length > 0) {
            // only allow accepted file extensions
            const files = Array.from(event.dataTransfer.files).filter(file =>
                allowedFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext)),
            );
            if (files.length) {
                handleUpload(files);
            }
        }
    };
    const isValidFile = (file: File) => {
        const extension = file.name.split(".").pop();
        // already checked in onFileDrop/file input change event
        if (!extension || !allowedFileExtensions.includes(`.${extension}`)) {
            showSnackbar(flowId, "Invalid file extension. Please upload a valid file.", "error");
            return false;
        }
        if (file.size > 10 * 1024 * 1024) {
            showSnackbar(flowId, "File size limit exceeded. Maximum file size is 10MB.", "error");
            return false;
        }
        return true;
    };
    const handleUpload = (files: File[]) => {
        const filesToUpload = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!isValidFile(file)) {
                continue;
            }
            filesToUpload.push(file);
        }
        if (filesToUpload.length) {
            onUpload(filesToUpload);
        }
    };
    return { onFileDragOver, onFileDragLeave, onOpenUploadDialog, onFileDrop };
};
