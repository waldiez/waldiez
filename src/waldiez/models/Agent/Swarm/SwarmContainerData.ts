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
import { WaldiezSwarmAfterWork } from "@waldiez/models/Agent/Swarm/AfterWork";

/**
 * Waldiez Swarm Container Agent Data (extends {@link WaldiezAgentData}).
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
 * @param maxRounds - The maximum rounds  (for the edge)
 * @param initialAgent - The initial agent (if any, for the edge)
 * @param afterWork - The after work (if any, for the edge)
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedSkill}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezSwarmAfterWork}
 */
export class WaldiezAgentSwarmContainerData extends WaldiezAgentData {
    maxRounds: number;
    initialAgent: string | null;
    afterWork: WaldiezSwarmAfterWork | null;
    contextVariables: { [key: string]: string } = {};
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
            maxRounds: number;
            initialAgent: string | null;
            afterWork: WaldiezSwarmAfterWork | null;
            contextVariables: { [key: string]: string };
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
            maxRounds: 20,
            initialAgent: null,
            afterWork: null,
            contextVariables: {},
        },
    ) {
        super(props);
        this.maxRounds = props.maxRounds;
        this.initialAgent = props.initialAgent;
        this.afterWork = props.afterWork;
        this.contextVariables = props.contextVariables;
    }
}
