/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type reasonConfigMethod = "beam_search" | "mcts" | "lats" | "dfs";
export type reasonConfigAnswerApproach = "pool" | "best";
export type WaldiezReasoningAgentReasonConfig = {
    method: reasonConfigMethod;
    maxDepth: number;
    forestSize: number;
    ratingScale: number;
    beamSize: number;
    answerApproach: reasonConfigAnswerApproach;
    nsim: number;
    explorationConstant: number;
};

export type WaldiezNodeAgentReasoningData = WaldiezAgentCommonData & {
    label: string;
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;
};

export type WaldiezNodeAgentReasoning = Node<WaldiezNodeAgentReasoningData, "agent">;
