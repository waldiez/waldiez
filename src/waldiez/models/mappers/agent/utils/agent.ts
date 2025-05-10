/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentAssistant,
    WaldiezAgentAssistantData,
    WaldiezAgentCaptain,
    WaldiezAgentCaptainData,
    WaldiezAgentGroupManager,
    WaldiezAgentGroupManagerData,
    WaldiezAgentRagUser,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoning,
    WaldiezAgentReasoningData,
    WaldiezAgentUserProxy,
    WaldiezAgentUserProxyData,
} from "@waldiez/models";
import { WaldiezAgent, WaldiezAgentData, WaldiezNodeAgentType } from "@waldiez/models/Agent/Common";

export const getAgent = (
    agentType: WaldiezNodeAgentType,
    id: string,
    name: string,
    description: string,
    tags: string[],
    requirements: string[],
    createdAt: string,
    updatedAt: string,
    data: WaldiezAgentData,
    rest: { [key: string]: any },
) => {
    if (agentType === "user_proxy") {
        return new WaldiezAgentUserProxy({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentUserProxyData,
            rest,
        });
    }
    if (agentType === "assistant") {
        return new WaldiezAgentAssistant({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentAssistantData,
            rest,
        });
    }
    if (agentType === "rag_user_proxy") {
        return new WaldiezAgentRagUser({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentRagUserData,
            rest,
        });
    }
    if (agentType === "reasoning") {
        return new WaldiezAgentReasoning({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentReasoningData,
            rest,
        });
    }
    if (agentType === "captain") {
        return new WaldiezAgentCaptain({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentCaptainData,
            rest,
        });
    }
    if (agentType === "group_manager") {
        return new WaldiezAgentGroupManager({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentGroupManagerData,
            rest,
        });
    }
    return new WaldiezAgent({
        id,
        agentType,
        name,
        description,
        tags,
        requirements,
        createdAt,
        updatedAt,
        data,
        rest,
    });
};
