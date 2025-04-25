/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentGroupManagerProps = {
    id: string;
    flowId: string;
    isDarkMode: boolean;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
