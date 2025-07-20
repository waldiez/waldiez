/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModelData } from "@waldiez/models";

export type WaldiezNodeModelModalProps = {
    flowId: string;
    modelId: string;
    data: WaldiezNodeModelData;
    isOpen: boolean;
    isDirty: boolean;
    importExportView: React.ReactNode;
    onLogoChange: (newLogo: string) => void;
    onClose: () => void;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
    onSave: () => void;
    onTest: () => void;
    onSaveAndClose: () => void;
    onCancel: () => void;
};
