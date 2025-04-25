/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type WaldiezCaptainAgentLibEntry = {
    name: string;
    description: string;
    systemMessage: string;
};

export type WaldiezNodeAgentCaptainData = WaldiezAgentCommonData & {
    label: string;
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;
};

export type WaldiezNodeAgentCaptain = Node<WaldiezNodeAgentCaptainData, "agent">;
