/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezCaptainAgentLibEntry } from "@waldiez/models/Agent/Captain/types";
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
 * Waldiez Captain Agent Data.
 * @param humanInputMode - The human input mode of the agent ("NEVER" | "ALWAYS" | "TERMINATE")
 * @param systemMessage - The system message of the agent
 * @param codeExecutionConfig - The code execution configuration of the agent
 * @param agentDefaultAutoReply - The default auto reply of the agent
 * @param maxConsecutiveAutoReply - The maximum consecutive auto reply of the agent
 * @param termination - The termination message check of the agent
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param parentId - The parent id of the agent
 * @param nestedChats - The nested chats of the agent
 * @param contextVariables - The context variables of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param handoffs - The handoffs of the agent
 * @param toolLib - The tool library of the agent
 * @param maxRound - The maximum round of the agent
 * @param maxTurns - The maximum turns of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentHandoff}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 */
export class WaldiezAgentCaptainData extends WaldiezAgentData {
    agentLib: WaldiezCaptainAgentLibEntry[];
    toolLib: "default" | null;
    maxRound: number;
    maxTurns: number;

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
            handoffs: WaldiezAgentHandoff[];
            agentLib: WaldiezCaptainAgentLibEntry[];
            toolLib: "default" | null;
            maxRound: number;
            maxTurns: number;
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
                    order: 0,
                },
            ],
            contextVariables: {},
            updateAgentStateBeforeReply: [],
            handoffs: [],
            agentLib: [],
            toolLib: null,
            maxRound: 10,
            maxTurns: 5,
        },
    ) {
        super(props);
        this.agentLib = props.agentLib;
        this.toolLib = props.toolLib;
        this.maxRound = props.maxRound;
        this.maxTurns = props.maxTurns;
    }
}
