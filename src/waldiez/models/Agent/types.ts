/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type {
    WaldiezNodeAgentAssistant,
    WaldiezNodeAgentAssistantData,
} from "@waldiez/models/Agent/Assistant";
import type { WaldiezNodeAgentCaptain, WaldiezNodeAgentCaptainData } from "@waldiez/models/Agent/Captain";
import type { WaldiezNodeAgentDocAgent, WaldiezNodeAgentDocAgentData } from "@waldiez/models/Agent/DocAgent";
import type {
    WaldiezNodeAgentGroupManager,
    WaldiezNodeAgentGroupManagerData,
} from "@waldiez/models/Agent/GroupManager";
import type { WaldiezNodeAgentRagUser, WaldiezNodeAgentRagUserData } from "@waldiez/models/Agent/RagUser";
import type {
    WaldiezNodeAgentReasoning,
    WaldiezNodeAgentReasoningData,
} from "@waldiez/models/Agent/Reasoning";
import type {
    WaldiezNodeAgentUserProxy,
    WaldiezNodeAgentUserProxyData,
} from "@waldiez/models/Agent/UserProxy";

export type * from "@waldiez/models/Agent/Assistant/types";
export type * from "@waldiez/models/Agent/Captain/types";
export type * from "@waldiez/models/Agent/Common/types";
export type * from "@waldiez/models/Agent/DocAgent/types";
export type { defaultGroupChatSpeakers, WaldiezAgentGroupManager } from "@waldiez/models/Agent/GroupManager";
export type * from "@waldiez/models/Agent/GroupManager/types";
export type {
    defaultRetrieveConfig,
    WaldiezAgentRagUserData,
} from "@waldiez/models/Agent/RagUser/RagUserData";
export type * from "@waldiez/models/Agent/RagUser/types";
export type {
    defaultReasonConfig,
    WaldiezAgentReasoningData,
} from "@waldiez/models/Agent/Reasoning/ReasoningAgentData";
export type * from "@waldiez/models/Agent/Reasoning/types";
export type * from "@waldiez/models/Agent/UserProxy/types";

/**
 * WaldiezNodeAgentData
 * It can be one of the following:
 * @param WaldiezNodeAgentAssistantData - The data for the assistant agent.
 * @param WaldiezNodeAgentUserProxyData - The data for the user proxy agent.
 * @param WaldiezNodeAgentRagUserData - The data for the RAG user agent.
 * @param WaldiezNodeAgentReasoningData - The data for the reasoning agent.
 * @param WaldiezNodeAgentCaptainData - The data for the captain agent.
 * @param WaldiezNodeAgentGroupManagerData - The data for the group manager agent.
 * @param WaldiezNodeDocAgentData - The data for the document agent.
 * @see {@link WaldiezNodeAgentAssistantData}
 * @see {@link WaldiezNodeAgentUserProxyData}
 * @see {@link WaldiezNodeAgentRagUserData}
 * @see {@link WaldiezNodeAgentReasoningData}
 * @see {@link WaldiezNodeAgentCaptainData}
 * @see {@link WaldiezNodeAgentGroupManagerData}
 * @see {@link WaldiezNodeAgentDocAgentData}
 */
export type WaldiezNodeAgentData =
    | WaldiezNodeAgentAssistantData
    | WaldiezNodeAgentUserProxyData
    | WaldiezNodeAgentRagUserData
    | WaldiezNodeAgentReasoningData
    | WaldiezNodeAgentCaptainData
    | WaldiezNodeAgentGroupManagerData
    | WaldiezNodeAgentDocAgentData;

/**
 * WaldiezNodeAgent
 * The react-flow node component for an agent.
 * It can be one of the following:
 * @param WaldiezNodeAgentAssistant - A assistant agent node.
 * @param WaldiezNodeAgentUserProxy - A user proxy agent node.
 * @param WaldiezNodeAgentRagUser - A RAG user agent node.
 * @param WaldiezNodeAgentReasoning - A reasoning agent node.
 * @param WaldiezNodeAgentCaptain - A captain agent node.
 * @param WaldiezNodeAgentGroupManager - A group manager agent node.
 * @param WaldiezNodeAgentDocAgent - A document agent node.
 * @see {@link WaldiezNodeAgentAssistant}
 * @see {@link WaldiezNodeAgentUserProxy}
 * @see {@link WaldiezNodeAgentRagUser}
 * @see {@link WaldiezNodeAgentReasoning}
 * @see {@link WaldiezNodeAgentCaptain}
 * @see {@link WaldiezNodeAgentGroupManager}
 * @see {@link WaldiezNodeAgentDocAgent}
 */
export type WaldiezNodeAgent =
    | WaldiezNodeAgentAssistant
    | WaldiezNodeAgentRagUser
    | WaldiezNodeAgentReasoning
    | WaldiezNodeAgentUserProxy
    | WaldiezNodeAgentCaptain
    | WaldiezNodeAgentGroupManager
    | WaldiezNodeAgentDocAgent;
