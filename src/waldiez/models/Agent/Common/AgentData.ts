/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
} from "@waldiez/models/Agent/Common";

/**
 * Waldiez Agent data
 * @param systemMessage - System message
 * @param humanInputMode - Human input mode
 * @param codeExecutionConfig - Code execution configuration
 * @param agentDefaultAutoReply - Default auto reply
 * @param maxConsecutiveAutoReply - Maximum consecutive auto reply
 * @param termination - Termination message check
 * @param modelIds - Model ids
 * @param skills - Linked skills
 * @param parentId - Parent id
 * @param nestedChats - Nested chats
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentLinkedSkill}
 * @see {@link WaldiezAgentNestedChat}
 */
export class WaldiezAgentData {
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
    codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
    agentDefaultAutoReply: string | null;
    maxConsecutiveAutoReply: number | null;
    termination: WaldiezAgentTerminationMessageCheck;
    // links
    modelIds: string[];
    skills: WaldiezAgentLinkedSkill[];
    parentId?: string;
    nestedChats: WaldiezAgentNestedChat[];
    constructor(
        props: {
            humanInputMode: WaldiezAgentHumanInputMode;
            systemMessage: string | null;
            codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
            agentDefaultAutoReply: string | null;
            maxConsecutiveAutoReply: number | null;
            termination: WaldiezAgentTerminationMessageCheck;
            modelIds: string[];
            skills: WaldiezAgentLinkedSkill[];
            parentId?: string;
            nestedChats: WaldiezAgentNestedChat[];
        } = {
            humanInputMode: "NEVER",
            systemMessage: null,
            codeExecutionConfig: false,
            agentDefaultAutoReply: null,
            maxConsecutiveAutoReply: null,
            termination: {
                type: "none",
                keywords: [],
                criterion: null,
                methodContent: null,
            },
            modelIds: [],
            skills: [],
            parentId: undefined,
            nestedChats: [],
        },
    ) {
        this.systemMessage = props.systemMessage;
        this.humanInputMode = props.humanInputMode;
        this.codeExecutionConfig = props.codeExecutionConfig;
        this.agentDefaultAutoReply = props.agentDefaultAutoReply;
        this.maxConsecutiveAutoReply = props.maxConsecutiveAutoReply;
        this.termination = props.termination;
        this.modelIds = props.modelIds;
        this.skills = props.skills;
        this.parentId = props.parentId;
        this.nestedChats = props.nestedChats;
    }
}
