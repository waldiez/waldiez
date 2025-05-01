/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezNodeAgentType,
} from "@waldiez/models/Agent/Common";
import {
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getIdFromJSON,
    getNameFromJSON,
    getRequirementsFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";
import { getId } from "@waldiez/utils";

const VALID_AGENT_TYPES: WaldiezNodeAgentType[] = [
    "user",
    "assistant",
    "captain",
    "manager",
    "rag_user",
    "reasoning",
    "swarm",
    "swarm_container",
];
export const getAgentId = (data: any, agentId?: string) => {
    let id = `wa-${getId()}`;
    if (!agentId || typeof agentId !== "string") {
        id = getIdFromJSON(data);
    } else {
        id = agentId;
    }
    return id;
};

export const getAgentType = (json: any) => {
    let agentType: WaldiezNodeAgentType = "user";
    let jsonObject = json;
    const inJson = "agentType" in json && typeof json.agentType === "string";
    if (!inJson) {
        const inJsonData =
            "data" in json &&
            typeof json.data === "object" &&
            "agentType" in json.data &&
            typeof json.data.agentType === "string";
        if (!inJsonData) {
            return agentType;
        }
        jsonObject = json.data;
    }
    if (VALID_AGENT_TYPES.includes(jsonObject.agentType)) {
        agentType = jsonObject.agentType as WaldiezNodeAgentType;
    }
    return agentType;
};

export const getFallbackDescription = (agentType: WaldiezNodeAgentType) => {
    let fallbackDescription = "An agent";
    if (agentType === "user") {
        fallbackDescription = "A user agent";
    } else if (agentType === "assistant") {
        fallbackDescription = "An assistant agent";
    } else if (agentType === "manager") {
        fallbackDescription = "A group chat manager";
    } else if (agentType === "rag_user") {
        fallbackDescription = "A RAG user agent";
    } else if (agentType === "swarm") {
        fallbackDescription = "A Swarm agent";
    } else if (agentType === "swarm_container") {
        fallbackDescription = "A Swarm container";
    } else if (agentType === "reasoning") {
        fallbackDescription = "A reasoning agent";
    } else if (agentType === "captain") {
        fallbackDescription = "A captain agent";
    }
    return fallbackDescription;
};
export const getAgentMeta = (data: Record<string, unknown>, agentType: WaldiezNodeAgentType) => {
    const name = getAgentName(data, agentType);
    const fallbackDescription = getFallbackDescription(agentType);
    const description = getDescriptionFromJSON(data, fallbackDescription);
    const tags = getTagsFromJSON(data);
    const requirements = getRequirementsFromJSON(data);
    const createdAt = getCreatedAtFromJSON(data);
    const updatedAt = getUpdatedAtFromJSON(data);
    return { name, description, tags, requirements, createdAt, updatedAt };
};
export const getIsMultimodal = (data: Record<string, unknown>): boolean => {
    if ("isMultimodal" in data && typeof data.isMultimodal === "boolean") {
        return data.isMultimodal;
    }
    if ("is_multimodal" in data && typeof data.is_multimodal === "boolean") {
        return data.is_multimodal;
    }
    return false;
};
export const getSystemMessage = (data: Record<string, unknown>): string | null => {
    if ("systemMessage" in data && typeof data.systemMessage === "string") {
        return data.systemMessage;
    }
    return null;
};
export const getHumanInputMode = (
    data: Record<string, unknown>,
    agentType: WaldiezNodeAgentType,
): WaldiezAgentHumanInputMode => {
    let humanInputMode: WaldiezAgentHumanInputMode = "NEVER";
    if (["user", "rag_user"].includes(agentType)) {
        humanInputMode = "ALWAYS";
    }
    if (
        "humanInputMode" in data &&
        typeof data.humanInputMode === "string" &&
        ["ALWAYS", "NEVER", "TERMINATE"].includes(data.humanInputMode)
    ) {
        humanInputMode = data.humanInputMode as WaldiezAgentHumanInputMode;
    }
    return humanInputMode;
};

export const getCodeExecutionConfig = (data: Record<string, unknown>): WaldiezAgentCodeExecutionConfig => {
    if (
        "codeExecutionConfig" in data &&
        typeof data.codeExecutionConfig === "object" &&
        data.codeExecutionConfig
    ) {
        return data.codeExecutionConfig as Record<string, unknown>;
    }
    return false;
};

export const getAgentDefaultAutoReply = (data: Record<string, unknown>): string | null => {
    if ("agentDefaultAutoReply" in data && typeof data.agentDefaultAutoReply === "string") {
        return data.agentDefaultAutoReply;
    }
    return null;
};

export const getMaximumConsecutiveAutoReply = (data: Record<string, unknown>): number | null => {
    if ("maxConsecutiveAutoReply" in data && typeof data.maxConsecutiveAutoReply === "number") {
        return data.maxConsecutiveAutoReply;
    }
    return null;
};

export const getModelIds = (data: Record<string, unknown>): string[] => {
    let modelIds: string[] = [];
    if ("modelIds" in data && Array.isArray(data.modelIds)) {
        modelIds = data.modelIds.filter(m => typeof m === "string") as string[];
    }
    return modelIds;
};

export const getSkills = (data: Record<string, unknown>): WaldiezAgentLinkedSkill[] => {
    let skills: WaldiezAgentLinkedSkill[] = [];
    if ("skills" in data && Array.isArray(data.skills)) {
        skills = data.skills.filter(
            linkedSkill =>
                typeof linkedSkill === "object" &&
                linkedSkill &&
                "id" in linkedSkill &&
                "executorId" in linkedSkill &&
                typeof linkedSkill.id === "string" &&
                typeof linkedSkill.executorId === "string",
        ) as WaldiezAgentLinkedSkill[];
    }
    return skills;
};

export const getAgentName = (data: Record<string, unknown>, agentType: WaldiezNodeAgentType) => {
    let fallbackName = "Agent";
    if (agentType === "user") {
        fallbackName = "User";
    } else if (agentType === "assistant") {
        fallbackName = "Assistant";
    } else if (agentType === "manager") {
        fallbackName = "Manager";
    } else if (agentType === "rag_user") {
        fallbackName = "RAG User";
    } else if (agentType === "swarm") {
        fallbackName = "Swarm Agent";
    } else if (agentType === "swarm_container") {
        fallbackName = "Swarm Container";
    } else if (agentType === "reasoning") {
        fallbackName = "Reasoning Agent";
    } else if (agentType === "captain") {
        fallbackName = "Captain";
    }
    return getNameFromJSON(data, fallbackName)!;
};
export const getParentId = (
    data: Record<string, unknown>,
    agentType: WaldiezNodeAgentType,
): string | null => {
    if (agentType === "manager" || agentType === "swarm_container") {
        return null;
    }
    if ("parentId" in data && typeof data.parentId === "string") {
        return data.parentId;
    }
    return null;
};
export const getNestedChats = (data: Record<string, unknown>): WaldiezAgentNestedChat[] => {
    // old version: [{ triggeredBy: [{id: string, isReply: boolean}], messages: [{ id: string, isReply: boolean }] }]
    // new version: [{ triggeredBy: string[], messages: [{ id: string, isReply: boolean }] }]
    // in the old version, the id is the id of the chat (not the agent :( )
    // in the new version, the id is the id of the agent (that can trigger the nested chat)
    const chats: WaldiezAgentNestedChat[] = [];
    if ("nestedChats" in data && Array.isArray(data.nestedChats)) {
        for (const chat of data.nestedChats) {
            let triggeredBy: string[] = [];
            if ("triggeredBy" in chat && Array.isArray(chat.triggeredBy)) {
                triggeredBy = chat.triggeredBy.filter((t: any) => typeof t === "string") as string[];
            }
            let messages: { id: string; isReply: boolean }[] = [];
            if ("messages" in chat && Array.isArray(chat.messages)) {
                messages = chat.messages.filter(
                    (message: any) =>
                        typeof message === "object" &&
                        "id" in message &&
                        typeof message.id === "string" &&
                        "isReply" in message &&
                        typeof message.isReply === "boolean",
                ) as { id: string; isReply: boolean }[];
            }
            chats.push({ triggeredBy, messages });
        }
    }
    return chats;
};
