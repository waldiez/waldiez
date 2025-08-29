/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeTool, WaldiezNodeToolData } from "@waldiez/models/types";

export interface IWaldiezToolStore {
    /**
     * Get the stored tools.
     * @returns An array of tools.
     * @see {@link WaldiezNodeTool}
     */
    getTools: () => WaldiezNodeTool[];
    /**
     * Get a tool by its ID.
     * @param id - The ID of the tool.
     * @returns The tool with the specified ID, or null if not found.
     * @see {@link WaldiezNodeTool}
     */
    getToolById: (id: string) => WaldiezNodeTool | null;
    /**
     * Add a new tool to the store.
     * @returns The newly added tool.
     * @see {@link WaldiezNodeTool}
     */
    addTool: () => WaldiezNodeTool;
    /**
     * Clone an existing tool.
     * @param id - The ID of the tool to clone.
     * @returns The cloned tool, or null if the tool was not found.
     * @see {@link WaldiezNodeTool}
     */
    cloneTool: (id: string) => WaldiezNodeTool | null;
    /**
     * Update the data of a tool.
     * @param id - The ID of the tool to update.
     * @param data - The new data for the tool.
     * @see {@link WaldiezNodeToolData}
     */
    updateToolData: (id: string, data: Partial<WaldiezNodeToolData>) => void;
    /**
     * Delete a tool from the store.
     * @param id - The ID of the tool to delete.
     */
    deleteTool: (id: string) => void;
    /**
     * Import a tool into the store.
     * @param tool - The tool data to import.
     * @param toolId - The ID of the tool.
     * @param position - The position of the tool in the flow.
     * @param save - Whether to save the changes.
     * @returns The imported tool.
     * @see {@link WaldiezNodeTool}
     */
    importTool: (
        tool: { [key: string]: unknown },
        toolId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeTool;
    /**
     * Export a tool from the store.
     * @param toolId - The ID of the tool to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported tool data.
     */
    exportTool: (toolId: string, hideSecrets: boolean) => { [key: string]: unknown };
}
