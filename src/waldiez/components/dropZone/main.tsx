/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC } from "react";
import { FaCloudUploadAlt } from "react-icons/fa";

import { useDropZone } from "@waldiez/components/dropZone/hooks";
import type { DropZoneProps } from "@waldiez/components/dropZone/types";

export const DropZone: FC<DropZoneProps> = (props: DropZoneProps) => {
    const { flowId, multiple = false } = props;
    const { onFileDragOver, onFileDragLeave, onOpenUploadDialog, onFileDrop } = useDropZone(props);
    const instruction = multiple
        ? "Drop files here or click to upload"
        : "Drop a file here or click to upload";
    return (
        <div
            className="drop_zone clickable"
            onDrop={onFileDrop}
            onDragOver={onFileDragOver}
            onClick={onOpenUploadDialog}
            onDragLeave={onFileDragLeave}
            data-testid={`drop-zone-${flowId}`}
        >
            <div className="drop_zone_content">
                <div className="drop_zone_icon">
                    <FaCloudUploadAlt />
                </div>
                <div className="drop_zone_text">{instruction}</div>
            </div>
        </div>
    );
};

DropZone.displayName = "DropZone";
