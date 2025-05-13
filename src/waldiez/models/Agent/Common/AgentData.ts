/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
    WaldiezAgentUpdateSystemMessage,
} from "@waldiez/models/Agent/Common";
import { WaldiezAgentHandoff } from "@waldiez/models/Agent/Common/Handoff";

/**
 * Waldiez Agent data
 * @param systemMessage - System message
 * @param humanInputMode - Human input mode
 * @param codeExecutionConfig - Code execution configuration
 * @param agentDefaultAutoReply - Default auto reply
 * @param maxConsecutiveAutoReply - Maximum consecutive auto reply
 * @param termination - Termination message check
 * @param modelId - The agent's model id
 * @param tools - Tools available to the agent
 * @param parentId - Parent id
 * @param nestedChats - Nested chats
 * @param contextVariables - Context variables
 * @param handoffs - Handoffs
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentHandoff}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 */
export class WaldiezAgentData {
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
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
            nestedChats: [
                {
                    messages: [],
                    triggeredBy: [],
                    order: 0,
                },
            ],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            handoffs: [],
        },
    ) {
        this.systemMessage = props.systemMessage;
        this.humanInputMode = props.humanInputMode;
        this.codeExecutionConfig = props.codeExecutionConfig;
        this.agentDefaultAutoReply = props.agentDefaultAutoReply;
        this.maxConsecutiveAutoReply = props.maxConsecutiveAutoReply;
        this.termination = props.termination;
        this.modelId = props.modelId;
        this.tools = props.tools;
        this.parentId = props.parentId;
        this.nestedChats = props.nestedChats;
        this.contextVariables = props.contextVariables;
        this.updateAgentStateBeforeReply = props.updateAgentStateBeforeReply;
        this.handoffs = props.handoffs;
    }
}
