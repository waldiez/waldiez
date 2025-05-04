/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentAssistant, WaldiezNodeAgentAssistantData } from "@waldiez/models/Agent/Assistant";
import { WaldiezNodeAgentCaptain, WaldiezNodeAgentCaptainData } from "@waldiez/models/Agent/Captain";
import { WaldiezNodeAgentRagUser, WaldiezNodeAgentRagUserData } from "@waldiez/models/Agent/RagUser";
import { WaldiezNodeAgentReasoning, WaldiezNodeAgentReasoningData } from "@waldiez/models/Agent/Reasoning";
import { WaldiezNodeAgentUserProxy, WaldiezNodeAgentUserProxyData } from "@waldiez/models/Agent/UserProxy";

export type * from "@waldiez/models/Agent/Assistant/types";
export type * from "@waldiez/models/Agent/Captain/types";
export type * from "@waldiez/models/Agent/Common/types";
export type * from "@waldiez/models/Agent/RagUser/types";
export type * from "@waldiez/models/Agent/Reasoning/types";
export type * from "@waldiez/models/Agent/UserProxy/types";
export type WaldiezNodeAgentData =
    | WaldiezNodeAgentAssistantData
    | WaldiezNodeAgentUserProxyData
    | WaldiezNodeAgentRagUserData
    | WaldiezNodeAgentReasoningData
    | WaldiezNodeAgentCaptainData;

export type WaldiezNodeAgent =
    | WaldiezNodeAgentAssistant
    | WaldiezNodeAgentRagUser
    | WaldiezNodeAgentReasoning
    | WaldiezNodeAgentUserProxy
    | WaldiezNodeAgentCaptain;
