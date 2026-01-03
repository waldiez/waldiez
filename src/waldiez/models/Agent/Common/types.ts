/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type {
    WaldiezHandoffAvailability,
    WaldiezHandoffCondition,
    WaldiezTransitionTarget,
} from "@waldiez/models/common/Handoff";

export type { WaldiezAgent } from "@waldiez/models/Agent/Common/Agent";
export type { WaldiezAgentData } from "@waldiez/models/Agent/Common/AgentData";

/**
 * Human input mode.
 * @param ALWAYS - Always ask for human input
 * @param NEVER - Never ask for human input
 * @param TERMINATE - Ask for human input only when the turn is terminated (no more actions)
 */
export type WaldiezAgentHumanInputMode = "ALWAYS" | "NEVER" | "TERMINATE";
/**
 * Code execution configuration.
 * @param workDir - The working directory
 * @param useDocker - Either boolean (to enable/disable) or string (to specify the images)
 * @param timeout - The timeout
 * @param lastNMessages - The last N messages
 * @param functions - The functions (tool ids) to use
 */
export type WaldiezAgentCodeExecutionConfigDict = {
    workDir?: string;
    useDocker?: string | string[] | boolean | null;
    timeout?: number;
    lastNMessages?: number | "auto";
    functions?: string[];
};
/**
 * Code execution configuration.
 * either a {@link WaldiezAgentCodeExecutionConfigDict} or false (to disable)
 */
export type WaldiezAgentCodeExecutionConfig = WaldiezAgentCodeExecutionConfigDict | false;

/**
 * System message type.
 * @param string - String
 * @param callable - Callable
 */
export type WaldiezAgentUpdateSystemMessageType = "string" | "callable";

/**
 * System message for agent update.
 * @param type - The type of the system message {@link WaldiezAgentUpdateSystemMessageType}
 * @param content - The content of the system message
 */
export type WaldiezAgentUpdateSystemMessage = {
    type: WaldiezAgentUpdateSystemMessageType;
    content: string;
};

/**
 * Termination type.
 * @param none - No termination
 * @param keyword - Termination by keyword
 * @param method - Termination by method
 */
export type WaldiezAgentTypeTerminationTypeOption = "none" | "keyword" | "method";
/**
 * Termination criterion (if the termination type is "keyword").
 * @param found - Termination when the message contains the keyword
 * @param ending - Termination when the message ends with the keyword
 * @param starting - Termination when the message starts with the keyword
 * @param exact - Termination when the message is exactly the keyword
 */
export type WaldiezAgentTerminationCriterionOption = "found" | "ending" | "starting" | "exact";
/**
 * Waldiez agent nested chat.
 * @param triggeredBy - The agent ids that trigger the nested chat
 * @param messages - The messages to include in the chat queue
 * @param condition - The condition for the nested chat (if used as handoff)
 * @param available - The availability of the nested chat (if used as handoff)
 * @see {@link WaldiezHandoffCondition}
 * @see {@link WaldiezHandoffAvailability}
 */
export type WaldiezAgentNestedChat = {
    triggeredBy: string[];
    messages: { id: string; isReply: boolean }[];
    condition: WaldiezHandoffCondition;
    available: WaldiezHandoffAvailability;
};
/**
 * Waldiez agent termination message check.
 * @param type - The termination type option {@link WaldiezAgentTypeTerminationTypeOption}
 * @param keywords - The keywords (if the termination type is "keyword")
 * @param criterion - The criterion (if the termination type is "keyword") {@link WaldiezAgentTerminationCriterionOption}
 * @param methodContent - The method content (if the termination type is "method")
 */
export type WaldiezAgentTerminationMessageCheck = {
    type: WaldiezAgentTypeTerminationTypeOption;
    keywords: string[];
    criterion: WaldiezAgentTerminationCriterionOption | null;
    methodContent: string | null;
};
/**
 * Waldiez agent linked tools.
 * @param id - The tools id
 * @param executorId - The executor (agent) id
 */
export type WaldiezAgentLinkedTool = {
    id: string;
    executorId: string;
};
/**
 * Waldiez agent common (for all agent types) data.
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
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
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
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 */
export type WaldiezAgentCommonData = {
    name: string;
    description: string;
    parentId: string | undefined | null;
    agentType: WaldiezNodeAgentType;
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
    codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
    agentDefaultAutoReply: string | null;
    maxConsecutiveAutoReply: number | null;
    termination: WaldiezAgentTerminationMessageCheck;
    nestedChats: WaldiezAgentNestedChat[];
    contextVariables?: { [key: string]: unknown };
    updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
    handoffs: string[]; // handoff / edge ids
    afterWork: WaldiezTransitionTarget | null;
    // links
    modelIds: string[];
    tools: WaldiezAgentLinkedTool[];
    // meta
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
};

/**
 * Waldiez agent type.
 * @param user_proxy - User proxy
 * @param assistant - Assistant
 * @param rag_user_proxy - RAG user proxy
 * @param reasoning - Reasoning
 * @param captain - Captain
 * @param group_manager - Group manager
 */
export type WaldiezAgentType =
    | "user_proxy"
    | "assistant"
    | "rag_user_proxy"
    | "reasoning"
    | "captain"
    | "group_manager"
    | "doc_agent";

/**
 * Waldiez node agent type (alias for WaldiezAgentType).
 * @param user_proxy - User proxy
 * @param assistant - Assistant
 * @param rag_user_proxy - RAG user proxy (deprecated, use "doc_agent")
 * @param reasoning - Reasoning
 * @param captain - Captain
 * @param group_manager - Group manager
 * @param doc_agent - Document agent
 */
export type WaldiezNodeAgentType = WaldiezAgentType;
