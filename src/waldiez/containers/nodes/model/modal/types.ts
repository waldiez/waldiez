/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ReactNode } from "react";

import type { WaldiezNodeModelData } from "@waldiez/models";

export type WaldiezNodeModelModalProps = {
    flowId: string;
    modelId: string;
    data: WaldiezNodeModelData;
    isOpen: boolean;
    isDirty: boolean;
    importExportView: ReactNode;
    onLogoChange: (newLogo: string) => void;
    onClose: () => void;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
    onSave: () => void;
    onSaveAndClose: () => void;
    onCancel: () => void;
};
