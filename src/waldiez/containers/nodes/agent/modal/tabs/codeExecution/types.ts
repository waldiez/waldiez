/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models";

export type WaldiezAgentCodeExecutionProps = {
    id: string;
    data: WaldiezNodeAgentData;
    tools: WaldiezNodeTool[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
