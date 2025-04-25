/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentSwarm,
    WaldiezNodeAgentType,
} from "@waldiez/models";

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
    setAgentGroup: (agentId: string, groupId: string) => void;
    getGroupMembers: (groupId: string) => WaldiezNodeAgent[];
    addGroupMember: (groupId: string, memberId: string) => void;
    removeGroupMember: (groupId: string, memberId: string) => void;
    getSwarmAgents: () => WaldiezNodeAgentSwarm[];
    setSwarmInitialAgent: (agentId: string) => void;
    updateSwarmInitialAgent: (agentId: string) => void;
    getNonSwarmAgents: (
        swarmContainerId: string,
        swarmAgents: WaldiezNodeAgent[],
        edges: { source: string; target: string }[],
    ) => { swarmSources: WaldiezNodeAgent[]; swarmTargets: WaldiezNodeAgent[] };
    ensureSwarmContainer: (flowId: string, position: { x: number; y: number }) => WaldiezNodeAgent;
    getAgentConnections: (
        nodeId: string,
        options?: {
            sourcesOnly?: boolean;
            targetsOnly?: boolean;
            skipManagers?: boolean;
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
}
