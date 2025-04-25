/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModelData } from "@waldiez/models";

export type * from "@waldiez/containers/nodes/model/modal/types";

export type WaldiezNodeModelViewProps = {
    modelId: string;
    data: WaldiezNodeModelData;
    flowId: string;
    logo: string;
    isOpen: boolean;
    isDirty: boolean;
    onOpen: () => void;
    setLogo: (logo: string) => void;
    onImport: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onExport: () => Promise<void>;
    onClose: () => void;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
    onDelete: () => void;
    onClone: () => void;
    onSave: () => void;
    onCancel: () => void;
};
