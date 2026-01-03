/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
export type DropZoneProps = {
    flowId: string;
    onUpload: (files: File[]) => void;
    allowedFileExtensions: string[];
    multiple?: boolean;
};
