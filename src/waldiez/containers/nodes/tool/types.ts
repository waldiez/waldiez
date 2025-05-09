/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeToolData } from "@waldiez/models";

export type WaldiezNodeToolViewProps = {
    toolId: string;
    flowId: string;
    data: WaldiezNodeToolData;
    isModalOpen: boolean;
    darkMode: boolean;
    isDirty: boolean;
    onOpen: () => void;
    onClose: () => void;
    onCancel: () => void;
    onSave: () => void;
    onDelete: () => void;
    onClone: () => void;
    onDataChange: (data: Partial<WaldiezNodeToolData>) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => Promise<void>;
};
