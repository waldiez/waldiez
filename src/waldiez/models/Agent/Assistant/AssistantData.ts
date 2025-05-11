/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHandoff,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
    WaldiezAgentUpdateSystemMessage,
} from "@waldiez/models/Agent/Common";

/**
 * Waldiez Assistant Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelId - The agent's model id
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param handoffs - The handoffs of the agent
 * @param isMultimodal - The multimodal flag of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentHandoff}
 * @see {@link WaldiezAgentUpdateSystemMessage}
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
            modelId: string | null;
            tools: WaldiezAgentLinkedTool[];
            parentId?: string;
            nestedChats: WaldiezAgentNestedChat[];
            contextVariables: Record<string, any>;
            updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
            handoffs: WaldiezAgentHandoff[];
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
            modelId: null,
            tools: [],
            parentId: undefined,
            nestedChats: [],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            handoffs: [],
            isMultimodal: false,
        },
    ) {
        super(props);
        this.isMultimodal = props.isMultimodal;
    }
}
