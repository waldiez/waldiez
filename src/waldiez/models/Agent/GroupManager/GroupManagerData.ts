/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentData,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
    WaldiezAgentUpdateSystemMessage,
} from "@waldiez/models/Agent/Common";
import { WaldiezAgentGroupManagerSpeakers } from "@waldiez/models/Agent/GroupManager/GroupSpeakers";
import { WaldiezTransitionTarget } from "@waldiez/models/common/Handoff";

/**
 * Waldiez Group Manager Agent Data.
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
 * @param afterWork - The handoff transition after work of the agent
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param groupName - The name of the group that the agent manages
 * @param maxRound - The maximum number of rounds for the group chat this agent manages
 * @param adminName - The admin name of the agent
 * @param speakers - The speakers of the agent
 * @param enableClearHistory - The enable clear history of the agent
 * @param sendIntroductions - The send introductions of the agent
 * @param initialAgentId - The id of the initial agent in the group
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentGroupManagerSpeakers}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 */
export class WaldiezAgentGroupManagerData extends WaldiezAgentData {
    maxRound: number;
    adminName: string | null;
    speakers: WaldiezAgentGroupManagerSpeakers;
    enableClearHistory?: boolean;
    sendIntroductions?: boolean;
    groupName?: string;
    initialAgentId?: string;

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
            handoffs: string[]; // handoff/edge ids
            maxRound: number;
            adminName: string | null;
            speakers: WaldiezAgentGroupManagerSpeakers;
            enableClearHistory?: boolean;
            sendIntroductions?: boolean;
            groupName?: string;
            initialAgentId?: string;
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
                        prompt: "",
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
            maxRound: 20,
            adminName: null,
            speakers: {
                selectionMethod: "auto",
                selectionCustomMethod: "",
                maxRetriesForSelecting: null,
                selectionMode: "repeat",
                allowRepeat: true,
                allowedOrDisallowedTransitions: {},
                transitionsType: "allowed",
                order: [],
            },
            enableClearHistory: undefined,
            sendIntroductions: undefined,
            groupName: undefined,
            initialAgentId: undefined,
        },
    ) {
        props.parentId = undefined;
        super(props);
        this.maxRound = props.maxRound;
        this.adminName = props.adminName;
        this.speakers = props.speakers;
        this.enableClearHistory = props.enableClearHistory;
        this.sendIntroductions = props.sendIntroductions;
        this.groupName = props.groupName;
        this.initialAgentId = props.initialAgentId;
    }
}
