/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentHandoff,
    WaldiezAgentHumanInputMode,
    WaldiezAgentLinkedTool,
    WaldiezAgentNestedChat,
    WaldiezAgentUpdateSystemMessage,
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

const ValidAgentTypes: WaldiezNodeAgentType[] = [
    "user_proxy",
    "assistant",
    "captain",
    "rag_user_proxy",
    "reasoning",
    "group_manager",
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
    let agentType: WaldiezNodeAgentType = "user_proxy";
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
    if (ValidAgentTypes.includes(jsonObject.agentType)) {
        agentType = jsonObject.agentType as WaldiezNodeAgentType;
    }
    return agentType;
};

export const getFallbackDescription = (agentType: WaldiezNodeAgentType) => {
    let fallbackDescription = "An agent";
    if (agentType === "user_proxy") {
        fallbackDescription = "A user agent";
    } else if (agentType === "assistant") {
        fallbackDescription = "An assistant agent";
    } else if (agentType === "rag_user_proxy") {
        fallbackDescription = "A RAG user agent";
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
    if (["user_proxy", "rag_user_proxy"].includes(agentType)) {
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

export const getModelId = (data: Record<string, unknown>): string | null => {
    let modelId: string | null = null;
    if ("modelId" in data && typeof data.modelId === "string") {
        modelId = data.modelId;
    }
    return modelId;
};

export const getTools = (data: Record<string, unknown>): WaldiezAgentLinkedTool[] => {
    let tools: WaldiezAgentLinkedTool[] = [];
    if ("tools" in data && Array.isArray(data.tools)) {
        tools = data.tools.filter(
            tool =>
                typeof tool === "object" &&
                tool &&
                "id" in tool &&
                "executorId" in tool &&
                typeof tool.id === "string" &&
                typeof tool.executorId === "string",
        ) as WaldiezAgentLinkedTool[];
    }
    return tools;
};

export const getAgentName = (data: Record<string, unknown>, agentType: WaldiezNodeAgentType) => {
    let fallbackName = "Agent";
    if (agentType === "user_proxy") {
        fallbackName = "user_proxy";
    } else if (agentType === "assistant") {
        fallbackName = "Assistant";
    } else if (agentType === "rag_user_proxy") {
        fallbackName = "RAG User";
    } else if (agentType === "reasoning") {
        fallbackName = "Reasoning Agent";
    } else if (agentType === "captain") {
        fallbackName = "Captain";
    }
    return getNameFromJSON(data, fallbackName)!;
};
export const getParentId = (
    data: Record<string, unknown>,
    _agentType: WaldiezNodeAgentType,
): string | undefined => {
    if ("parentId" in data && typeof data.parentId === "string") {
        return data.parentId;
    }
    return undefined;
};

const getNestedChatOrder = (chat: Record<string, unknown>): number => {
    if ("order" in chat && typeof chat.order === "number") {
        return chat.order;
    }
    if ("order" in chat && typeof chat.order === "string") {
        try {
            const order = parseInt(chat.order, 10);
            if (!isNaN(order)) {
                return order;
            }
        } catch (_) {
            // Ignore parsing error
        }
    }
    return 0;
};

// eslint-disable-next-line max-statements
export const getNestedChats = (data: Record<string, unknown>): WaldiezAgentNestedChat[] => {
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
            chats.push({ triggeredBy, messages, order: getNestedChatOrder(chat) });
        }
    }
    if (chats.length === 0) {
        chats.push({
            triggeredBy: [],
            messages: [],
            order: 0,
        });
    }
    return chats;
};

export const getContextVariables = (data: Record<string, unknown>): Record<string, any> => {
    if ("contextVariables" in data && typeof data.contextVariables === "object") {
        return data.contextVariables as Record<string, any>;
    }
    return {};
};

export const getHandoffs = (data: Record<string, unknown>): WaldiezAgentHandoff[] => {
    if ("handoffs" in data && Array.isArray(data.handoffs)) {
        return data.handoffs.filter(
            handoff =>
                typeof handoff === "object" &&
                handoff &&
                "llm_conditions" in handoff &&
                Array.isArray(handoff.llm_conditions) &&
                "context_conditions" in handoff &&
                Array.isArray(handoff.context_conditions),
        ) as WaldiezAgentHandoff[];
    }
    return [];
};

export const getUpdateAgentStateBeforeReply = (
    data: Record<string, unknown>,
): WaldiezAgentUpdateSystemMessage[] => {
    if (
        "updateAgentStateBeforeReply" in data &&
        typeof data.updateAgentStateBeforeReply === "object" &&
        data.updateAgentStateBeforeReply
    ) {
        if ("type" in data.updateAgentStateBeforeReply && "content" in data.updateAgentStateBeforeReply) {
            if (
                typeof data.updateAgentStateBeforeReply.type === "string" &&
                typeof data.updateAgentStateBeforeReply.content === "string"
            ) {
                if (data.updateAgentStateBeforeReply.type === "string") {
                    return [
                        {
                            type: "string",
                            content: data.updateAgentStateBeforeReply.content,
                        },
                    ];
                } else if (data.updateAgentStateBeforeReply.type === "callable") {
                    return [
                        {
                            type: "callable",
                            content: data.updateAgentStateBeforeReply.content,
                        },
                    ];
                }
            }
        } else if (Array.isArray(data.updateAgentStateBeforeReply)) {
            return data.updateAgentStateBeforeReply.filter(
                (update: any) =>
                    typeof update === "object" &&
                    update &&
                    "type" in update &&
                    typeof update.type === "string" &&
                    "content" in update &&
                    typeof update.content === "string",
            ) as WaldiezAgentUpdateSystemMessage[];
        }
    }
    return [];
};
