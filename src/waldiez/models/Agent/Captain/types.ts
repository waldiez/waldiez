/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentCaptain } from "@waldiez/models/Agent/Captain/CaptainAgent";
export type { WaldiezAgentCaptainData } from "@waldiez/models/Agent/Captain/CaptainAgentData";

/**
 * WaldiezCaptainAgentLibEntry
 * Represents an entry in the agent library for the captain agent.
 * @param name - The name of the agent.
 * @param description - The description of the agent.
 * @param systemMessage - The system message for the agent.
 */
export type WaldiezCaptainAgentLibEntry = {
    name: string;
    description: string;
    systemMessage: string;
};

/**
 * WaldiezNodeAgentCaptainData
 * Represents the data for the captain agent node.
 * @param label - The label of the node.
 * @param retrieveConfig - The configuration for the RAG user.
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
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentCommonData}
 */
export type WaldiezNodeAgentCaptainData = WaldiezAgentCommonData & {
    label: string;
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;
};

/**
 * WaldiezNodeAgentCaptain
 * Represents a node in the flow for the captain agent.
 * @param data - The data for the node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentCaptainData}
 */
export type WaldiezNodeAgentCaptain = Node<WaldiezNodeAgentCaptainData, "agent">;
