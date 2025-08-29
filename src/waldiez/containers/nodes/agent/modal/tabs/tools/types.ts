/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeAgent, WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models/types";

export type WaldiezAgentToolsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    tools: WaldiezNodeTool[];
    agents: WaldiezNodeAgent[];
    skipExecutor?: boolean;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
