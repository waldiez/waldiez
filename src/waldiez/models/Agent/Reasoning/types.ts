/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type ReasoningConfigMethod = "beam_search" | "mcts" | "lats" | "dfs";
export type ReasoningConfigAnswerApproach = "pool" | "best";
export type WaldiezReasoningAgentReasonConfig = {
    method: ReasoningConfigMethod;
    maxDepth: number;
    forestSize: number;
    ratingScale: number;
    beamSize: number;
    answerApproach: ReasoningConfigAnswerApproach;
    nsim: number;
    explorationConstant: number;
};

export type WaldiezNodeAgentReasoningData = WaldiezAgentCommonData & {
    label: string;
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;
};

export type WaldiezNodeAgentReasoning = Node<WaldiezNodeAgentReasoningData, "agent">;
