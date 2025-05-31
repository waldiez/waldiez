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
} from "@waldiez/models/Agent/Common/types";
import { WaldiezTransitionTarget } from "@waldiez/models/common/Handoff";

/**
 * Waldiez Agent data
 * @param systemMessage - System message
 * @param humanInputMode - Human input mode
 * @param codeExecutionConfig - Code execution configuration
 * @param agentDefaultAutoReply - Default auto reply
 * @param maxConsecutiveAutoReply - Maximum consecutive auto reply
 * @param termination - Termination message check
 * @param modelIds - The agent's model ids
 * @param tools - Tools available to the agent
 * @param parentId - Parent id
 * @param nestedChats - Nested chats
 * @param contextVariables - Context variables
 * @param updateAgentStateBeforeReply - Update agent state before reply
 * @param afterWork - Handoff transition after work
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export class WaldiezAgentData {
    systemMessage: string | null;
    humanInputMode: WaldiezAgentHumanInputMode;
    codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
    agentDefaultAutoReply: string | null;
    maxConsecutiveAutoReply: number | null;
    termination: WaldiezAgentTerminationMessageCheck;
    modelIds: string[];
    tools: WaldiezAgentLinkedTool[];
    parentId?: string | null;
    nestedChats: WaldiezAgentNestedChat[];
    contextVariables: Record<string, any>;
    updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
    afterWork: WaldiezTransitionTarget | null;
    handoffs: string[]; // handoff / edge ids
    constructor(
        props: {
            humanInputMode: WaldiezAgentHumanInputMode;
            systemMessage: string | null;
            codeExecutionConfig: WaldiezAgentCodeExecutionConfig;
            agentDefaultAutoReply: string | null;
            maxConsecutiveAutoReply: number | null;
            termination: WaldiezAgentTerminationMessageCheck;
            modelIds: string[];
            tools: WaldiezAgentLinkedTool[];
            parentId?: string | null;
            nestedChats: WaldiezAgentNestedChat[];
            contextVariables: Record<string, any>;
            updateAgentStateBeforeReply: WaldiezAgentUpdateSystemMessage[];
            afterWork: WaldiezTransitionTarget | null;
            handoffs?: string[]; // handoff / edge ids
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
            tools: [],
            parentId: undefined,
            nestedChats: [
                {
                    messages: [],
                    triggeredBy: [],
                    condition: {
                        conditionType: "string_llm",
                        prompt: "Start a nested chat",
                    },
                    available: {
                        type: "none",
                        value: "",
                    },
                },
            ],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            afterWork: null,
            handoffs: [],
        },
    ) {
        this.systemMessage = props.systemMessage;
        this.humanInputMode = props.humanInputMode;
        this.codeExecutionConfig = props.codeExecutionConfig;
        this.agentDefaultAutoReply = props.agentDefaultAutoReply;
        this.maxConsecutiveAutoReply = props.maxConsecutiveAutoReply;
        this.termination = props.termination;
        this.modelIds = props.modelIds;
        this.tools = props.tools;
        this.parentId = props.parentId;
        this.nestedChats = props.nestedChats;
        this.contextVariables = props.contextVariables;
        this.updateAgentStateBeforeReply = props.updateAgentStateBeforeReply;
        this.afterWork = props.afterWork || null;
        this.handoffs = props.handoffs || [];
    }
}
