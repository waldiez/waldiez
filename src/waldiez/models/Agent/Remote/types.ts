/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezAgentCommonData } from "@waldiez/models/Agent/Common";

export type { WaldiezAgentRemote } from "@waldiez/models/Agent/Remote/RemoteAgent";
export type { WaldiezAgentRemoteData } from "@waldiez/models/Agent/Remote/RemoteAgentData";

/**
 * WaldiezRemoteAgentCard
 * Remote agent server card.
 * @param name - A human-readable name for the agent. Uses original agent name if not set.
 * @param description - A human-readable description of the agent, assisting users and other agents in understanding its purpose. Uses original agent description if not set.
 * @param url - The preferred endpoint URL for interacting with the agent. This URL MUST support the transport specified by 'preferredTransport'. Uses original A2aAgentServer url if not set.
 * @param version - The agent's own version number. The format is defined by the provider.
 * @param defaultInputModes - Default set of supported input MIME types for all skills, which can be overridden on a per-skill basis.
 * @param defaultOutputModes - Default set of supported output MIME types for all skills, which can be overridden on a per-skill basis.
 * @param capabilities - A declaration of optional capabilities supported by the agent.
 * @param skills - The set of skills, or distinct capabilities, that the agent can perform.
 */
export type WaldiezAgentRemoteCard = {
    name?: string | null;
    description?: string | null;
    url?: string | null;
    version?: string | null;
    defaultInputModes?: string[];
    defaultOutputModes?: string[];
    capabilities?: {
        streaming: boolean;
        pushNotifications: boolean;
        extensions: {
            uri: string;
            description: string;
            required: boolean;
            params: { [k: string]: unknown };
        }[];
    } | null;
    skills: string[]; // ids only
};

/**
 * WaldiezAgentRemoteServer
 * Remote agent server configuration.
 * @param url - The base URL for the A2A server.
 * @param agentCard - Configuration for the base agent card.
 * @param card_modifier - Function to modify the base agent card (Callable[[AgentCard], AgentCard]).
 * @param extendedAgentCard - Configuration for the extended agent card.
 * @param extendedCardModifier - Function to modify the extended agent card (Callable[[AgentCard, ServerCallContext], AgentCard]).
 */
export type WaldiezAgentRemoteServer = {
    url?: string | null;
    agentCard?: WaldiezAgentRemoteCard | null;
    cardModifier?: string | null;
    extendedAgentCard?: WaldiezAgentRemoteCard | null;
    extendedCardModifier?: string | null;
};

/**
 * WaldiezNodeAgentRemoteData
 * The data for the agent node.
 * @param label - The label of the node.
 * @param name - The name of the agent
 * @param description - The description of the agent
 * @param parentId - The parent id of the agent (if in a group)
 * @param agentType - The agent type
 * @param systemMessage - The system message
 * @param humanInputMode - The human input mode
 * @param codeExecutionConfig - The code execution configuration
 * @param agentDefaultAutoReply - The agent default auto reply
 * @param maxConsecutiveAutoReply - The max consecutive auto reply
 * @param termination - The termination message check
 * @param nestedChats - The nested chats
 * @param contextVariables - The context variables
 * @param updateAgentStateBeforeReply - Optional handler to update the agent state before replying
 * @param afterWork - The handoff transition after work
 * @param handoffs - The handoff / edge ids (used for ordering if needed)
 * @param modelIds - The agent's model ids
 * @param tools - The tools available to the agent
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @see {@link WaldiezNodeAgentType}
 * @see {@link WaldiezAgentHumanInputMode}
 * @see {@link WaldiezAgentCodeExecutionConfig}
 * @see {@link WaldiezAgentTerminationMessageCheck}
 * @see {@link WaldiezAgentNestedChat}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezTransitionTarget}
 * @see {@link WaldiezAgentLinkedTool}
 * @see {@link WaldiezAgentUpdateSystemMessage}
 * @see {@link WaldiezAgentCommonData}
 * @see {@link WaldiezAgentRemoteCard}
 * @see {@link WaldiezAgentRemoteServer}
 */
export type WaldiezNodeAgentRemoteData = WaldiezAgentCommonData & {
    label: string;
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
};

/**
 * WaldiezNodeAgentRemote
 * The react-flow node component for an agent.
 * @param data - The data of the agent node.
 * @param type - The type of the node (should be "agent").
 * @see {@link WaldiezNodeAgentRemoteData}
 */
export type WaldiezNodeAgentRemote = Node<WaldiezNodeAgentRemoteData, "agent">;
