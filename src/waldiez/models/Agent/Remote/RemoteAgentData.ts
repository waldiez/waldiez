/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { WaldiezAgentData } from "@waldiez/models/Agent/Common";
import type {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
    WaldiezAgentUpdateSystemMessage,
} from "@waldiez/models/Agent/Common/types";
import type { WaldiezAgentRemoteServer } from "@waldiez/models/Agent/Remote/types";
import { type WaldiezTransitionTarget } from "@waldiez/models/common/Handoff";

/**
 * Waldiez Remote Agent Data.
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
 * @see {@link WaldiezAgentData}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentRemoteServer}
 */
export class WaldiezAgentRemoteData extends WaldiezAgentData {
    server: {
        enabled: boolean;
        config?: WaldiezAgentRemoteServer | null;
    };
    client: {
        url?: string | null;
        name?: string | null;
        silent?: boolean | null;
        maxReconnects?: number | null;
        pollingInterval?: number | null;
        headers?: { [k: string]: unknown };
    };

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
            handoffs: string[]; // handoff / edge ids
            server: {
                enabled: boolean;
                config?: WaldiezAgentRemoteServer | null;
            };
            client: {
                url?: string | null;
                name?: string | null;
                silent?: boolean | null;
                maxReconnects?: number | null;
                pollingInterval?: number | null;
                headers?: { [k: string]: unknown };
            };
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
            server: {
                enabled: false,
                config: null,
            },
            client: {
                url: null,
                silent: null,
                maxReconnects: null,
                pollingInterval: null,
                headers: {},
            },
        },
    ) {
        super(props);
        this.server = props.server;
        this.client = props.client;
    }
}
