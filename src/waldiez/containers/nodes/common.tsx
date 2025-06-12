/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { FaFileExport, FaFileImport } from "react-icons/fa";

/**
 * Function to get the import/export view for a given item type
 * @param flowId - The ID of the flow
 * @param itemId - The ID of the item
 * @param itemType - The type of the item (model, tool, or agent)
 * @param onImport - Callback function to handle import action
 * @param onExport - Callback function to handle export action
 * @returns A React node representing the import/export view
 */
export const getImportExportView: (
    flowId: string,
    itemId: string,
    itemType: "model" | "tool" | "agent",
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void,
    onExport: () => Promise<void>,
) => React.ReactNode = (flowId, itemId, itemType, onImport, onExport) => {
    const itemTypeLower = itemType.toLowerCase();
    const itemTypeCapitalized = itemType.charAt(0).toUpperCase() + itemType.slice(1);
    return (
        <div className="modal-header-import-export">
            <input
                title={`Import ${itemTypeCapitalized}`}
                id={`file-upload-${itemTypeLower}-${flowId}-${itemId}`}
                data-testid={`file-upload-${itemTypeLower}-${flowId}-${itemId}`}
                type="file"
                accept={`.waldiez${itemTypeCapitalized}`}
                onChange={onImport}
                className="hidden"
            />
            <label
                htmlFor={`file-upload-${itemTypeLower}-${flowId}-${itemId}`}
                className="modal-header-import-button file-label"
                title={`Import ${itemTypeCapitalized}`}
            >
                <FaFileImport />
            </label>
            <div
                role="button"
                className="modal-header-export-button"
                onClick={onExport}
                title={`Export ${itemTypeCapitalized}`}
                data-testid={`export-${itemTypeLower}-${flowId}-${itemId}`}
            >
                <FaFileExport />
            </div>
        </div>
    );
};
