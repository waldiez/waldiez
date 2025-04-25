/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeSkillData } from "@waldiez/models";

export type WaldiezNodeSkillModalProps = {
    skillId: string;
    flowId: string;
    data: WaldiezNodeSkillData;
    isModalOpen: boolean;
    isDirty: boolean;
    darkMode: boolean;
    onClose: () => void;
    onCancel: () => void;
    onSave: () => void;
    onSaveAndClose: () => void;
    onDataChange: (data: Partial<WaldiezNodeSkillData>) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => Promise<void>;
};
