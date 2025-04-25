/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeSkillData } from "@waldiez/models";

export type WaldiezNodeSkillViewProps = {
    skillId: string;
    flowId: string;
    data: WaldiezNodeSkillData;
    isModalOpen: boolean;
    darkMode: boolean;
    isDirty: boolean;
    onOpen: () => void;
    onClose: () => void;
    onCancel: () => void;
    onSave: () => void;
    onDelete: () => void;
    onClone: () => void;
    onDataChange: (data: Partial<WaldiezNodeSkillData>) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => Promise<void>;
};
