/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentConnections,
    WaldiezNodeAgentData,
    WaldiezNodeAgentRagUserData,
    WaldiezNodeModel,
    WaldiezNodeTool,
} from "@waldiez/models";

export type WaldiezAgentRagUserTabsProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentRagUserData;
    models: WaldiezNodeModel[];
    tools: WaldiezNodeTool[];
    isModalOpen: boolean;
    isDarkMode: boolean;
    uploadsEnabled: boolean;
    agentConnections: WaldiezAgentConnections;
    showNestedChatsTab?: boolean;
    filesToUpload: File[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    onFilesToUploadChange: (files: File[]) => void;
};
