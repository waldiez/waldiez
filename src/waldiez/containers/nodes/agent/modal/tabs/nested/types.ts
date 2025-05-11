/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentNestedChatsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    agentConnections: {
        sources: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        targets: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
};
