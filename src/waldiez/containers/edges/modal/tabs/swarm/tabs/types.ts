/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdgeData, WaldiezNodeAgent } from "@waldiez/types";

export type WaldiezEdgeSwarmTriggerTabProps = {
    flowId: string;
    activeTabIndex: number;
    edgeId: string;
    data: WaldiezEdgeData;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
export type WaldiezEdgeSwarmHandoffTabProps = {
    flowId: string;
    targetAgent: WaldiezNodeAgent;
    activeTabIndex: number;
    edgeId: string;
    data: WaldiezEdgeData;
    darkMode: boolean;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
