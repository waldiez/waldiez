/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type {
    WaldiezAgentConnections,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentRagUserData,
    WaldiezNodeModel,
    WaldiezNodeTool,
} from "@waldiez/models/types";

export type WaldiezAgentRagUserTabsProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentRagUserData;
    agents: WaldiezNodeAgent[];
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
