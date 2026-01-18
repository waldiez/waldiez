/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentReasoning } from "@waldiez/models/Agent/Reasoning/ReasoningAgent";

export type { WaldiezAgentReasoningData } from "@waldiez/models/Agent/Reasoning/ReasoningAgentData";

/**
 * reasonConfigMethod
 * The method used for reasoning.
 * It can be "beam_search", "mcts", "lats", or "dfs".
 * @param beam_search - The beam search method.
 * @param mcts - The Monte Carlo Tree Search method.
 * @param lats - The LATS method.
 * @param dfs - The depth-first search method.
 * @see {@link WaldiezReasoningAgentReasonConfig}
 */
export type reasonConfigMethod = "beam_search" | "mcts" | "lats" | "dfs";

/**
 * reasonConfigAnswerApproach
 * The approach used for answering.
 * It can be "pool" or "best".
 * @param pool - The pool approach.
 * @param best - The best approach.
 * @see {@link WaldiezReasoningAgentReasonConfig}
 */
export type reasonConfigAnswerApproach = "pool" | "best";

/**
 * WaldiezReasoningAgentReasonConfig
 * The configuration for the reasoning agent.
 * @param method - The method used for reasoning.
 * @param maxDepth - The maximum depth of the reasoning tree.
 * @param forestSize - The size of the reasoning forest.
 * @param ratingScale - The rating scale for the reasoning.
 * @param beamSize - The size of the beam for beam search.
 * @param answerApproach - The approach used for answering.
 * @param nsim - The number of simulations for MCTS.
 * @param explorationConstant - The exploration constant for MCTS.
 * @see {@link reasonConfigMethod}
 * @see {@link reasonConfigAnswerApproach}
 */
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

/**
 * WaldiezNodeAgentReasoningData
 * The data for the reasoning agent.
 * @param label - The label of the node.
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param parentId - The parent id of the agent (if in a group)
 * @param agentType - The agent type
 * @param systemMessage - The system message
 * @param humanInputMode - The human input mode
 * @param codeExecutionConfig - The code execution configuration
 * @param agentDefaultAutoReply - The agent default auto reply
 * @param maxConsecutiveAutoReply - The max consecutive auto reply
 * @param termination - The termination message check
 * @param nestedChats - The nested chats
 * @param contextVariables - The context variables
 * @param updateAgentStateBeforeReply - Optional handler to update the agent state before replying
 * @param afterWork - The handoff transition after work
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @see {@link WaldiezNodeAgentType}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezReasoningAgentReasonConfig}
 * @see {@link WaldiezAgentCommonData}
 */
export type WaldiezNodeAgentReasoningData = WaldiezAgentCommonData & {
    label: string;
    verbose: boolean;
    reasonConfig: WaldiezReasoningAgentReasonConfig;
};

/**
 * WaldiezNodeAgentReasoning
 * The react-flow node component for a reasoning agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentReasoningData}
 */
export type WaldiezNodeAgentReasoning = Node<WaldiezNodeAgentReasoningData, "agent">;
