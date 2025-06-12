/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData, WaldiezNodeModel } from "@waldiez/models";

export type WaldiezAgentRagUserTabsProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentRagUserData;
    models: WaldiezNodeModel[];
    isModalOpen: boolean;
    isDarkMode: boolean;
    uploadsEnabled: boolean;
    filesToUpload: File[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    onFilesToUploadChange: (files: File[]) => void;
};
