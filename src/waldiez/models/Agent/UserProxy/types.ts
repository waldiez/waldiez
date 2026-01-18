/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentUserProxy } from "@waldiez/models/Agent/UserProxy/UserProxy";
export type { WaldiezAgentUserProxyData } from "@waldiez/models/Agent/UserProxy/UserProxyData";

/**
 * WaldiezNodeAgentUserProxyData
 * The data for the user proxy agent node.
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
 * @see {@link WaldiezAgentCommonData}
 */
export type WaldiezNodeAgentUserProxyData = WaldiezAgentCommonData & {
    label: string;
};

/**
 * WaldiezNodeAgentUserProxy
 * The react-flow node component for a user proxy agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentUserProxyData}
 */
export type WaldiezNodeAgentUserProxy = Node<WaldiezNodeAgentUserProxyData, "agent">;
