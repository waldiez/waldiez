/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeTool, WaldiezNodeToolData } from "@waldiez/models";

export interface IWaldiezToolStore {
    getTools: () => WaldiezNodeTool[];
    getToolById: (id: string) => WaldiezNodeTool | null;
    addTool: () => WaldiezNodeTool;
    cloneTool: (id: string) => WaldiezNodeTool | null;
    updateToolData: (id: string, data: Partial<WaldiezNodeToolData>) => void;
    deleteTool: (id: string) => void;
    importTool: (
        tool: { [key: string]: unknown },
        toolId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeTool;
    exportTool: (toolId: string, hideSecrets: boolean) => { [key: string]: unknown };
}
