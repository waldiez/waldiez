/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentSwarmData,
    WaldiezNodeSkill,
} from "@waldiez/models";

export type WaldiezAgentSwarmFunctionsProps = {
    id: string;
    data: WaldiezNodeAgentSwarmData;
    skills: WaldiezNodeSkill[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

export type WaldiezAgentSwarmNestedChatsProps = {
    id: string;
    flowId: string;
    darkMode: boolean;
    data: WaldiezNodeAgentSwarmData;
    agents: WaldiezNodeAgent[];
    edges: WaldiezEdge[];
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>, markDirty?: boolean) => void;
};

export type WaldiezAgentSwarmNestedChatConditionProps = {
    flowId: string;
    darkMode: boolean;
    data: WaldiezNodeAgentSwarmData;
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

export type WaldiezAgentSwarmUpdateStateProps = {
    id: string;
    data: WaldiezNodeAgentSwarmData;
    darkMode: boolean;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

export type WaldiezAgentSwarmAfterWorkProps = {
    id: string;
    data: WaldiezNodeAgentSwarmData;
    darkMode: boolean;
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

export type WaldiezAgentSwarmHandoffsProps = {
    id: string;
    data: WaldiezNodeAgentSwarmData;
    agents: WaldiezNodeAgent[];
    edges: WaldiezEdge[];
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
