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
    WaldiezAgentUpdateSystemMessage,
    WaldiezNodeAgentType,
} from "@waldiez/models/Agent/Common";
import { getTermination } from "@waldiez/models/mappers/agent/utils/termination";
import {
    getAfterWork,
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getHandoffAvailability,
    getHandoffCondition,
    getIdFromJSON,
    getNameFromJSON,
    getRequirementsFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";

const ValidAgentTypes: WaldiezNodeAgentType[] = [
    "user_proxy",
    "assistant",
    "captain",
    "rag_user_proxy",
    "reasoning",
    "group_manager",
    "doc_agent",
];

/**
 * Generates a unique agent ID based on the provided data or a fallback ID.
 * If an agentId is provided and is a valid string, it will be used as the ID.
 * Otherwise, it will attempt to extract the ID from the data JSON.
 * If no valid ID can be found, a new ID will be generated.
 * @param data - The data object from which to extract the ID.
 * @param agentId - An optional agent ID to use if valid.
 * @returns A string representing the agent ID.
 */
export const getAgentId = (data: any, agentId?: string) => {
    let id: string;
    // noinspection SuspiciousTypeOfGuard
    if (!agentId || typeof agentId !== "string") {
        id = getIdFromJSON(data);
    } else {
        id = agentId;
    }
    return id;
};

/**
 * Retrieves the agent type from the provided JSON object.
 * If the agent type is not specified or is invalid, it defaults to "user_proxy".
 * @param json - The JSON object containing the agent data.
 * @returns The agent type as a WaldiezNodeAgentType.
 */
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
/**
 * Retrieves the agent name from the provided JSON object.
 * If the name is not specified, it falls back to a default name based on the agent type.
 * @param data - The JSON object containing the agent data.
 * @param agentType - The type of the agent.
 * @returns The agent name as a string.
 */
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
    } else if (agentType === "group_manager") {
        fallbackName = "Group Manager";
    }
    return getNameFromJSON(data, fallbackName)!;
};

/**
 * Retrieves the agent description from the provided JSON object.
 * If the description is not specified, it falls back to a default description based on the agent type.
 * @param agentType - The type of the agent.
 * @returns The agent description as a string.
 */
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

/**
 * Retrieves the agent metadata from the provided JSON object.
 * This includes the agent's name, description, tags, requirements, creation date, and update date.
 * @param data - The JSON object containing the agent data.
 * @param agentType - The type of the agent.
 * @returns An object containing the agent metadata.
 */
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

/**
 * Checks if the agent is multimodal based on the provided data.
 * It looks for the `isMultimodal` or `is_multimodal` property in the data object.
 * @param data - The data object containing agent information.
 * @returns A boolean indicating whether the agent is multimodal.
 */
export const getIsMultimodal = (data: Record<string, unknown>): boolean => {
    if ("isMultimodal" in data && typeof data.isMultimodal === "boolean") {
        return data.isMultimodal;
    }
    if ("is_multimodal" in data && typeof data.is_multimodal === "boolean") {
        return data.is_multimodal;
    }
    return false;
};

/**
 * Retrieves the system message from the provided data object.
 * If the system message is not specified or is not a string, it returns null.
 * @param data - The data object containing agent information.
 * @returns The system message as a string or null if not found.
 */
export const getSystemMessage = (data: Record<string, unknown>): string | null => {
    if ("systemMessage" in data && typeof data.systemMessage === "string") {
        return data.systemMessage;
    }
    return null;
};

/**
 * Retrieves the human input mode for the agent based on the provided data and agent type.
 * It defaults to "NEVER" unless the agent type is "user_proxy" or "rag_user_proxy", in which case it defaults to "ALWAYS".
 * If a valid human input mode is specified in the data, it will override the default.
 * @param data - The data object containing agent information.
 * @param agentType - The type of the agent.
 * @returns The human input mode as a WaldiezAgentHumanInputMode.
 */
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

/**
 * Retrieves the code execution configuration from the provided data object.
 * If the configuration is not specified or is not an object, it returns false.
 * @param data - The data object containing agent information.
 * @returns The code execution configuration as a WaldiezAgentCodeExecutionConfig or false if not found.
 */
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

/**
 * Retrieves the agent's default auto-reply message from the provided data object.
 * If the auto-reply message is not specified or is not a string, it returns null.
 * @param data - The data object containing agent information.
 * @returns The default auto-reply message as a string or null if not found.
 */
export const getAgentDefaultAutoReply = (data: Record<string, unknown>): string | null => {
    if ("agentDefaultAutoReply" in data && typeof data.agentDefaultAutoReply === "string") {
        return data.agentDefaultAutoReply;
    }
    return null;
};

/**
 * Retrieves the maximum number of consecutive auto-replies allowed for the agent.
 * If the value is not specified or is not a number, it returns null.
 * @param data - The data object containing agent information.
 * @returns The maximum consecutive auto-reply count as a number or null if not found.
 */
export const getMaximumConsecutiveAutoReply = (data: Record<string, unknown>): number | null => {
    if ("maxConsecutiveAutoReply" in data && typeof data.maxConsecutiveAutoReply === "number") {
        return data.maxConsecutiveAutoReply;
    }
    return null;
};

/**
 * Retrieves model IDs from the provided data object.
 * It checks for the `modelIds` property and ensures it is an array of strings.
 * @param data - The data object containing agent information.
 * @returns An array of model IDs as strings. If no valid model IDs are found, it returns an empty array.
 */
export const getModelIds = (data: Record<string, unknown>): string[] => {
    const modelIds: string[] = [];
    if ("modelIds" in data && Array.isArray(data.modelIds)) {
        for (const modelId of data.modelIds) {
            // noinspection SuspiciousTypeOfGuard
            if (typeof modelId === "string") {
                modelIds.push(modelId);
            }
        }
    }
    return modelIds;
};

/**
 * Retrieves tools from the provided data object.
 * It checks for the `tools` property and ensures it is an array of objects with valid `id` and `executorId` properties.
 * @param data - The data object containing agent information.
 * @returns An array of WaldiezAgentLinkedTool objects. If no valid tools are found, it returns an empty array.
 */
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

/**
 * Retrieves the parent ID from the provided data object.
 * If the `parentId` property is present and is a string, it returns that value.
 * Otherwise, it returns undefined.
 * @param data - The data object containing agent information.
 * @param _agentType - The type of the agent (not used in this function).
 * @returns The parent ID as a string or undefined if not found.
 */
export const getParentId = (
    data: Record<string, unknown>,
    _agentType: WaldiezNodeAgentType,
): string | undefined => {
    if ("parentId" in data && typeof data.parentId === "string") {
        return data.parentId;
    }
    return undefined;
};

/**
 * Retrieves the nested chat messages from the provided chat object.
 * It checks for the `messages` property and ensures it is an array of objects with valid `id` and `isReply` properties.
 * @param chat - The chat object containing messages.
 * @returns An array of objects with `id` and `isReply` properties. If no valid messages are found, it returns an empty array.
 */
const getNestedChatMessages = (chat: any): { id: string; isReply: boolean }[] => {
    let messages: { id: string; isReply: boolean }[] = [];
    if ("messages" in chat && Array.isArray(chat.messages)) {
        messages = chat.messages.filter(
            (message: any) =>
                typeof message === "object" &&
                message &&
                "id" in message &&
                typeof message.id === "string" &&
                "isReply" in message &&
                typeof message.isReply === "boolean",
        ) as { id: string; isReply: boolean }[];
    }
    return messages;
};

/**
 * Retrieves nested chats from the provided data object.
 * It checks for the `nestedChats` property and ensures it is an array of objects with valid properties.
 * If no nested chats are found, it returns a default chat configuration.
 * @param data - The data object containing agent information.
 * @returns An array of WaldiezAgentNestedChat objects. If no valid nested chats are found, it returns a default chat configuration.
 */
export const getNestedChats = (data: Record<string, unknown>): WaldiezAgentNestedChat[] => {
    const chats: WaldiezAgentNestedChat[] = [];
    const defaultPrompt = "";
    const defaultCondition: WaldiezAgentNestedChat["condition"] = {
        conditionType: "string_llm",
        prompt: defaultPrompt,
    };
    if ("nestedChats" in data && Array.isArray(data.nestedChats)) {
        for (const chat of data.nestedChats) {
            let triggeredBy: string[] = [];
            if ("triggeredBy" in chat && Array.isArray(chat.triggeredBy)) {
                triggeredBy = chat.triggeredBy.filter((t: any) => typeof t === "string") as string[];
            }
            const messages = getNestedChatMessages(chat);
            const condition = getHandoffCondition(chat, defaultPrompt);
            const available = getHandoffAvailability(chat);
            chats.push({
                triggeredBy,
                messages,
                condition,
                available,
            });
        }
    }
    if (chats.length === 0) {
        chats.push({
            triggeredBy: [],
            messages: [],
            condition: defaultCondition,
            available: {
                type: "none",
                value: "",
            },
        });
    }
    return chats;
};

/**
 * Retrieves the context variables from the provided data object.
 * It checks for the `contextVariables` property and ensures it is an object.
 * @param data - The data object containing agent information.
 * @returns A record of context variables as key-value pairs. If no valid context variables are found, it returns an empty object.
 */
export const getContextVariables = (data: Record<string, unknown>): Record<string, any> => {
    if ("contextVariables" in data && typeof data.contextVariables === "object") {
        return data.contextVariables as Record<string, any>;
    }
    return {};
};

/**
 * Retrieves the agent state updates before a reply from the provided data object.
 * It checks for the `updateAgentStateBeforeReply` property and ensures it is an array of valid update messages.
 * @param data - The data object containing agent information.
 * @returns An array of WaldiezAgentUpdateSystemMessage objects. If no valid updates are found, it returns an empty array.
 */
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

/**
 * Retrieves the handoff IDs from the provided data object.
 * It checks for the `handoffs` property and ensures it is an array of strings.
 * @param data - The data object containing agent information.
 * @returns An array of handoff IDs as strings. If no valid handoff IDs are found, it returns an empty array.
 */
export const getHandoffIds = (data: Record<string, unknown>): string[] => {
    if ("handoffs" in data && Array.isArray(data.handoffs)) {
        return data.handoffs.filter((handoff: any) => typeof handoff === "string") as string[];
    }
    return [];
};

/**
 * Extracts common agent data from the provided JSON object based on the agent type.
 * @param data - The JSON object containing agent data.
 * @param agentType - The type of the agent.
 * @returns An instance of WaldiezAgentData containing the common agent data.
 */
export const getCommonAgentData = (
    data: Record<string, unknown>,
    agentType: WaldiezNodeAgentType,
): WaldiezAgentData => {
    const systemMessage = getSystemMessage(data);
    const humanInputMode = getHumanInputMode(data, agentType);
    const codeExecutionConfig = getCodeExecutionConfig(data);
    const agentDefaultAutoReply = getAgentDefaultAutoReply(data);
    const maxConsecutiveAutoReply = getMaximumConsecutiveAutoReply(data);
    const termination = getTermination(data);
    const modelIds = getModelIds(data);
    const tools = getTools(data);
    const parentId = getParentId(data, agentType);
    const nestedChats = getNestedChats(data);
    const contextVariables = getContextVariables(data);
    const updateAgentStateBeforeReply = getUpdateAgentStateBeforeReply(data);
    const afterWork = getAfterWork(data);
    const handoffs = getHandoffIds(data);
    return new WaldiezAgentData({
        systemMessage,
        humanInputMode,
        codeExecutionConfig,
        agentDefaultAutoReply,
        maxConsecutiveAutoReply,
        termination,
        modelIds,
        tools,
        parentId,
        nestedChats,
        contextVariables,
        updateAgentStateBeforeReply,
        afterWork,
        handoffs,
    });
};
