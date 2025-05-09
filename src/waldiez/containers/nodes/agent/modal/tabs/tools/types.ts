/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgent, WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models";

export type WaldiezAgentToolsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    tools: WaldiezNodeTool[];
    agents: WaldiezNodeAgent[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
