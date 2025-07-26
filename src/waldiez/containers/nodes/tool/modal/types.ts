/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React from "react";

import { WaldiezNodeToolData } from "@waldiez/models";

export type WaldiezNodeToolModalProps = {
    toolId: string;
    flowId: string;
    data: WaldiezNodeToolData;
    isModalOpen: boolean;
    isDirty: boolean;
    darkMode: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSave: () => void;
    onSaveAndClose: () => void;
    onDataChange: (data: Partial<WaldiezNodeToolData>) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => Promise<void>;
};
