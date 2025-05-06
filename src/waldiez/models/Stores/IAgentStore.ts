/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { XYPosition } from "@xyflow/react";

import { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData, WaldiezNodeAgentType } from "@waldiez/models";

export interface IWaldiezAgentStore {
    getAgents: () => WaldiezNodeAgent[];
    getAgentById: (id: string) => WaldiezNodeAgent | null;
    addAgent: (
        agentType: WaldiezNodeAgentType,
        position: { x: number; y: number },
        parentId: string | undefined,
    ) => WaldiezNodeAgent;
    cloneAgent: (id: string) => WaldiezNodeAgent | null;
    updateAgentData: (id: string, data: Partial<WaldiezNodeAgentData>) => void;
    deleteAgent: (id: string) => void;
    importAgent: (
        agent: { [key: string]: unknown },
        agentId: string,
        skipLinks: boolean,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeAgent;
    exportAgent: (agentId: string, hideSecrets: boolean) => { [key: string]: unknown };
    getAgentConnections: (
        nodeId: string,
        options?: {
            sourcesOnly?: boolean;
            targetsOnly?: boolean;
        },
    ) => {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    getGroupMembers: (groupId: string) => WaldiezNodeAgent[];
    addGroupMember: (groupId: string, agentId: string, position?: XYPosition) => void;
    removeGroupMember: (groupId: string, memberId: string) => void;
    setAgentGroup: (agentId: string, groupId: string, position?: XYPosition) => void;
}
