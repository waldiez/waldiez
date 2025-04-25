/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

export type WaldiezAgentRagUserProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentRagUserData;
    isModalOpen: boolean;
    isDarkMode: boolean;
    uploadsEnabled: boolean;
    filesToUpload: File[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    onFilesToUploadChange: (files: File[]) => void;
};
