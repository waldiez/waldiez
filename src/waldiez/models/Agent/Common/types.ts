/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgentHandoff } from "@waldiez/models/Agent/Common/Handoff";

export type * from "@waldiez/models/Agent/Common/Handoff";

/**
 * Human input mode.
 */
export type WaldiezAgentHumanInputMode = "ALWAYS" | "NEVER" | "TERMINATE";
/**
 * Code execution configuration.
 * @param workDir - The working directory
 * @param useDocker - Either boolean (to enable/disable) or string (to specify the images)
 * @param timeout - The timeout
 * @param lastNMessages - The last N messages
 * @param functions - The functions (skill ids) to use
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
 * Termination type.
 * @param none - No termination
 * @param keyword - Termination by keyword
 * @param method - Termination by method
 */
export type WaldiezAgentTypeTerminationTypeOption = "none" | "keyword" | "method";
/**
 * Termination criterion (if the termination type is "keyword").
 * @param found - Termination when found
 * @param ending - Termination when ending
 * @param exact - Termination when exact
 */
export type WaldiezAgentTerminationCriterionOption = "found" | "ending" | "exact";
/**
 * Waldiez agent nested chat.
 * @param triggeredBy - The agent ids that trigger the nested chat
 * @param messages - The messages to include in the chat queue
 */
export type WaldiezAgentNestedChat = {
    triggeredBy: string[];
    messages: { id: string; isReply: boolean }[];
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
 * Waldiez agent linked skill.
 * @param id - The skill id
 * @param executorId - The executor (agent) id
 */
export type WaldiezAgentLinkedSkill = {
    id: string;
    executorId: string;
};
/**
 * Waldiez agent common (for all agent types) data.
 * @param name - The name
 * @param description - The description
 * @param parentId - The parent id
 * @param agentType - The agent type
 * @param systemMessage - The system message
 * @param humanInputMode - The human input mode
 * @param codeExecutionConfig - The code execution configuration
 * @param agentDefaultAutoReply - The agent default auto reply
 * @param maxConsecutiveAutoReply - The max consecutive auto reply
 * @param termination - The termination message check
 * @param nestedChats - The nested chats
 * @param modelIds - The model ids
 * @param skills - The linked skills
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
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
    handoffs?: WaldiezAgentHandoff[];
    // links
    modelIds: string[];
    skills: WaldiezAgentLinkedSkill[];
    // meta
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
};

export type WaldiezAgentType =
    | "user_proxy"
    | "assistant"
    | "rag_user_proxy"
    | "reasoning"
    | "captain"
    | "group_manager";

export type WaldiezNodeAgentType = WaldiezAgentType;
