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
import { WaldiezSwarmUpdateSystemMessage } from "@waldiez/models/Agent/Swarm/UpdateSystemMessage";
import { WaldiezSwarmHandoff } from "@waldiez/models/Agent/Swarm/types";

/**
 * Waldiez Swarm Agent Data.
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
 * @param isInitial - The flag to check if the agent is initial
 * @param functions - The functions of the agent
 * @param updateAgentStateBeforeReply - The update agent state before reply of the agent
 * @param handoffs - The hand offs of the agent
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedSkill}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezSwarmUpdateSystemMessage}
 * @see {@link WaldiezSwarmHandoff}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 */
export class WaldiezAgentSwarmData extends WaldiezAgentData {
    isInitial: boolean;
    functions: string[];
    updateAgentStateBeforeReply: Array<WaldiezSwarmUpdateSystemMessage>;
    handoffs: WaldiezSwarmHandoff[];
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
            parentId: string | null;
            nestedChats: WaldiezAgentNestedChat[];
            functions: string[];
            updateAgentStateBeforeReply: Array<WaldiezSwarmUpdateSystemMessage>;
            handoffs: WaldiezSwarmHandoff[];
            isInitial: boolean;
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
            parentId: null,
            nestedChats: [],
            functions: [],
            updateAgentStateBeforeReply: [],
            handoffs: [],
            isInitial: false,
        },
    ) {
        super(props);
        this.functions = props.functions;
        this.updateAgentStateBeforeReply = props.updateAgentStateBeforeReply;
        this.handoffs = props.handoffs;
        this.isInitial = props.isInitial;
    }
}
