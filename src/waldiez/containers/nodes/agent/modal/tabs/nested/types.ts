/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezAgentConnections, WaldiezNodeAgentData } from "@waldiez/models/types";

export type WaldiezAgentNestedChatsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    agentConnections: WaldiezAgentConnections;
};
