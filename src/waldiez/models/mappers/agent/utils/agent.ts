/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgent,
    WaldiezAgentAssistant,
    WaldiezAgentAssistantData,
    WaldiezAgentCaptain,
    WaldiezAgentCaptainData,
    WaldiezAgentData,
    WaldiezAgentDocAgent,
    WaldiezAgentDocAgentData,
    WaldiezAgentGroupManager,
    WaldiezAgentGroupManagerData,
    WaldiezAgentRagUser,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoning,
    WaldiezAgentReasoningData,
    WaldiezAgentUserProxy,
    WaldiezAgentUserProxyData,
    type WaldiezNodeAgentType,
} from "@waldiez/models/Agent";

/**
 * Creates a Waldiez agent based on the provided agent type and data.
 * @param agentType - The type of the agent (e.g., user_proxy, assistant, rag_user_proxy, reasoning, captain, group_manager).
 * @param id - The unique identifier for the agent.
 * @param name - The name of the agent.
 * @param description - A brief description of the agent.
 * @param tags - An array of tags associated with the agent.
 * @param requirements - An array of requirements for the agent.
 * @param createdAt - The creation date of the agent.
 * @param updatedAt - The last update date of the agent.
 * @param data - The specific data associated with the agent type.
 * @param rest - Any additional properties that do not fit into the standard agent structure.
 * @returns An instance of the appropriate Waldiez agent class based on the agent type.
 */
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
    if (agentType === "doc_agent") {
        return new WaldiezAgentDocAgent({
            id,
            agentType,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data: data as WaldiezAgentDocAgentData,
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
