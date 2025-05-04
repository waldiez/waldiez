/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
} from "@waldiez/models/Agent/Common";

/**
 * Waldiez Assistant Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "SOMETIMES")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The model ids of the agent
 * @param skills - The linked skills of the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param isMultimodal - The multimodal flag of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedSkill}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 */
export class WaldiezAgentAssistantData extends WaldiezAgentData {
    isMultimodal: boolean;

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
            isMultimodal: boolean;
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
            isMultimodal: false,
        },
    ) {
        super(props);
        this.isMultimodal = props.isMultimodal;
    }
}
