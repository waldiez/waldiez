/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/**
 * Custom hook for handling file drag and drop functionality
 */
import { useCallback } from "react";

import { DropZoneProps } from "@waldiez/components/dropZone/types";
import { showSnackbar } from "@waldiez/components/snackbar";

export const useDropZone = (props: DropZoneProps) => {
    const { flowId, onUpload, allowedFileExtensions, multiple = false } = props;

    // Memoize file validation function
    const isValidFile = useCallback(
        (file: File): boolean => {
            const extension = file.name.split(".").pop()?.toLowerCase();

            // Check file extension
            if (!extension || !allowedFileExtensions.some(ext => ext.toLowerCase() === `.${extension}`)) {
                showSnackbar({
                    flowId,
                    message: "Invalid file extension. Please upload a valid file.",
                    level: "error",
                });
                return false;
            }

            // Check file size (10MB limit)
            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_FILE_SIZE) {
                showSnackbar({
                    flowId,
                    message: "File size limit exceeded. Maximum file size is 10MB.",
                    level: "error",
                });
                return false;
            }

            return true;
        },
        [flowId, allowedFileExtensions],
    );

    // Memoize file upload handler
    const handleUpload = useCallback(
        (files: File[]) => {
            const validFiles = files.filter(isValidFile);

            if (validFiles.length) {
                onUpload(validFiles);
            }
        },
        [isValidFile, onUpload],
    );

    // Memoize file filtering function
    const filterValidFiles = useCallback(
        (fileList: FileList): File[] => {
            return Array.from(fileList).filter(file =>
                allowedFileExtensions.some(ext => file.name.toLowerCase().endsWith(ext.toLowerCase())),
            );
        },
        [allowedFileExtensions],
    );

    // Handler for drag over event
    const onFileDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.add("drag-over");
    }, []);

    // Handler for drag leave event
    const onFileDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        event.currentTarget.classList.remove("drag-over");
    }, []);

    // Handler for file drop event
    const onFileDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            event.stopPropagation();
            event.currentTarget.classList.remove("drag-over");

            if (event.dataTransfer.files.length > 0) {
                const validFiles = filterValidFiles(event.dataTransfer.files);

                if (validFiles.length) {
                    handleUpload(validFiles);
                }
            }
        },
        [filterValidFiles, handleUpload],
    );

    // Handler to open file upload dialog
    const onOpenUploadDialog = useCallback(() => {
        const input = document.createElement("input");
        input.type = "file";
        input.multiple = multiple;
        input.style.display = "none";
        input.setAttribute("data-testid", "drop-zone-file-input");
        input.accept = allowedFileExtensions.join(",");

        input.onchange = event => {
            if (event.target instanceof HTMLInputElement && event.target.files && event.target.files.length) {
                const validFiles = filterValidFiles(event.target.files);

                if (validFiles.length) {
                    handleUpload(validFiles);
                }
            }
            input.remove();
        };

        document.body.appendChild(input);
        input.click();
    }, [multiple, allowedFileExtensions, filterValidFiles, handleUpload]);

    // Return memoized handlers
    return {
        onFileDragOver,
        onFileDragLeave,
        onFileDrop,
        onOpenUploadDialog,
    };
};
