/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezAgent,
    WaldiezAgentAssistantData,
    WaldiezAgentCaptainData,
    WaldiezAgentData,
    WaldiezAgentGroupManagerData,
    WaldiezAgentRagUserData,
    WaldiezAgentReasoningData,
    WaldiezNodeAgent,
    WaldiezNodeAgentGroupManager,
    WaldiezNodeAgentRagUser,
    WaldiezNodeAgentType,
} from "@waldiez/models/Agent";
import {
    getAdminName,
    getAgent,
    getAgentDefaultAutoReply,
    getAgentId,
    getAgentMeta,
    getAgentType,
    getCaptainAgentLib,
    getCaptainMaxRound,
    getCaptainMaxTurns,
    getCaptainToolLib,
    getCodeExecutionConfig,
    getContextVariables,
    getEnableClearHistory,
    getGroupChatMaxRound,
    getGroupName,
    getHandoffIds,
    getHumanInputMode,
    getInitialAgentId,
    getIsMultimodal,
    getMaximumConsecutiveAutoReply,
    getModelIds,
    getNestedChats,
    getParentId,
    getReasonConfig,
    getRetrieveConfig,
    getSendIntroductions,
    getSpeakers,
    getSystemMessage,
    getTermination,
    getTools,
    getUpdateAgentStateBeforeReply,
    getVerbose,
} from "@waldiez/models/mappers/agent/utils";
import { getAfterWork, getNodePositionFromJSON, getRestFromJSON } from "@waldiez/models/mappers/common";

/**
 * Agent Mapper
 * This module provides functions to import and export agents,
 * as well as to convert agents to and from node format.
 * It handles the conversion of agent data to a format suitable for storage or transmission,
 * and ensures that all necessary fields are included.
 */
export const agentMapper = {
    /**
     * Imports an agent from a JSON object or similar structure.
     * @param thing - The agent data to import, can be a JSON object or similar structure.
     * @param agentId - Optional agent ID to use if not present in the data.
     * @returns A WaldiezAgent instance representing the imported agent.
     * @throws Error if the input is invalid or missing required fields.
     */
    importAgent: (thing: unknown, agentId?: string): WaldiezAgent => {
        if (!thing || typeof thing !== "object") {
            throw new Error("Invalid agent data");
        }
        const json = thing as Record<string, unknown>;
        const id = getAgentId(json, agentId);
        const agentType = getAgentType(json);
        const { name, description, tags, requirements, createdAt, updatedAt } = getAgentMeta(json, agentType);
        const jsonData = (json.data || json) as Record<string, unknown>;
        const data = getAgentDataToImport(jsonData, agentType);
        const toExclude = getKeysToExclude(agentType);
        const rest = getRestFromJSON(json, toExclude);
        return getAgent(
            agentType,
            id,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data,
            rest,
        );
    },

    /**
     * Exports an agent to a format suitable for storage or transmission.
     * @param agentNode - The agent node to export.
     * @param skipLinks - Optional flag to skip links in the exported data.
     * @returns An object representing the exported agent.
     */
    exportAgent: (agentNode: WaldiezNodeAgent, skipLinks?: boolean) => {
        const agentCopy: any = skipLinks ? removeLinks(agentNode) : { ...agentNode };
        const data = { ...agentCopy.data };
        const name = agentCopy.data.label;
        delete agentCopy.data;
        const agentType = data.agentType as WaldiezNodeAgentType;
        const agentData: any = {
            systemMessage: data.systemMessage,
            humanInputMode: data.humanInputMode,
            codeExecutionConfig: data.codeExecutionConfig,
            agentDefaultAutoReply: data.agentDefaultAutoReply,
            maxConsecutiveAutoReply: data.maxConsecutiveAutoReply,
            termination: data.termination,
            modelIds: data.modelIds,
            tools: data.tools,
            parentId: data.parentId,
            nestedChats: data.nestedChats,
            handoffs: data.handoffs,
            contextVariables: data.contextVariables,
            updateAgentStateBeforeReply: data.updateAgentStateBeforeReply,
            afterWork: data.afterWork,
        };
        updateAgentDataToExport(agentType, agentData, data);
        ensureOneNestedChatExists(agentData);
        for (const key of [
            "description",
            "name",
            "tags",
            "requirements",
            "createdAt",
            "updatedAt",
            "agentType",
            "parentId",
        ]) {
            delete agentCopy[key];
        }
        return {
            type: "agent",
            agentType,
            name,
            description: data.description,
            tags: data.tags,
            requirements: data.requirements,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            data: agentData,
            ...agentCopy,
        };
    },

    /**
     * Converts a WaldiezAgent instance to a WaldiezNodeAgent format.
     * @param agent - The WaldiezAgent instance to convert.
     * @param position - Optional position for the node.
     * @param skipLinks - Optional flag to skip links in the converted node.
     * @returns A WaldiezNodeAgent instance representing the agent.
     */
    asNode: (
        agent: WaldiezAgent,
        position?: { x: number; y: number },
        skipLinks?: boolean,
    ): WaldiezNodeAgent => {
        const nodePosition = getNodePositionFromJSON(agent, position);
        const nodeData = {
            ...agent.data,
            agentType: agent.agentType,
            label: agent.name,
            description: agent.description,
            tags: agent.tags,
            requirements: agent.requirements,
            createdAt: agent.createdAt,
            updatedAt: agent.updatedAt,
        } as any;
        delete nodeData.name;
        const agentNode: WaldiezNodeAgent = {
            id: agent.id,
            type: "agent",
            data: nodeData,
            ...agent.rest,
            parentId: agent.data.parentId !== null ? agent.data.parentId : undefined,
            position: nodePosition,
        };
        if (skipLinks === true) {
            return removeLinks(agentNode);
        }
        return agentNode;
    },
};

/**
 * Ensures that at least one nested chat exists in the agent data.
 * If no nested chats are present, it initializes a default nested chat.
 * @param data - The agent data to check and modify if necessary.
 */
const ensureOneNestedChatExists = (data: any) => {
    if (!data.nestedChats || data.nestedChats.length === 0) {
        data.nestedChats = [
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
        ];
    }
};

/**
 * Extracts common agent data from the provided JSON object based on the agent type.
 * @param data - The JSON object containing agent data.
 * @param agentType - The type of the agent.
 * @returns An instance of WaldiezAgentData containing the common agent data.
 */
const getCommonAgentData = (
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

/**
 * Returns a list of keys to exclude from the agent data based on the agent type.
 * @param agentType - The type of the agent.
 * @returns An array of keys to exclude from the agent data.
 */
const getKeysToExclude = (agentType: WaldiezNodeAgentType) => {
    const toExclude = ["id", "name", "description", "tags", "requirements", "createdAt", "updatedAt", "data"];
    if (agentType === "rag_user_proxy") {
        toExclude.push("retrieveConfig");
    }
    if (agentType === "assistant") {
        toExclude.push("isMultimodal");
    }
    if (agentType === "reasoning") {
        toExclude.push("verbose", "reasonConfig");
    }
    if (agentType === "captain") {
        toExclude.push("agentLib", "toolLib", "maxRound", "maxTurns");
    }
    if (agentType === "group_manager") {
        toExclude.push(
            "initialAgentId",
            "maxRound",
            "adminName",
            "speakers",
            "enableClearHistory",
            "sendIntroductions",
            "groupName",
        );
    }
    return toExclude;
};

/**
 * Converts JSON data to a WaldiezAgentData instance based on the agent type.
 * This function handles the specific data structure for each agent type.
 * @param jsonData - The JSON object containing agent data.
 * @param agentType - The type of the agent.
 * @returns An instance of WaldiezAgentData or its subclasses.
 */
const getAgentDataToImport = (
    jsonData: Record<string, unknown>,
    agentType: WaldiezNodeAgentType,
): WaldiezAgentData => {
    const data = getCommonAgentData(jsonData, agentType);
    if (agentType === "rag_user_proxy") {
        return new WaldiezAgentRagUserData({
            ...data,
            retrieveConfig: getRetrieveConfig(jsonData),
        });
    }
    if (agentType === "assistant") {
        return new WaldiezAgentAssistantData({
            ...data,
            isMultimodal: getIsMultimodal(jsonData),
        });
    }
    if (agentType === "reasoning") {
        return new WaldiezAgentReasoningData({
            ...data,
            verbose: getVerbose(jsonData),
            reasonConfig: getReasonConfig(jsonData),
        });
    }
    if (agentType === "captain") {
        return new WaldiezAgentCaptainData({
            ...data,
            agentLib: getCaptainAgentLib(jsonData),
            toolLib: getCaptainToolLib(jsonData),
            maxRound: getCaptainMaxRound(jsonData),
            maxTurns: getCaptainMaxTurns(jsonData),
        });
    }
    if (agentType === "group_manager") {
        return new WaldiezAgentGroupManagerData({
            ...data,
            initialAgentId: getInitialAgentId(jsonData),
            maxRound: getGroupChatMaxRound(jsonData),
            adminName: getAdminName(jsonData),
            speakers: getSpeakers(jsonData),
            enableClearHistory: getEnableClearHistory(jsonData),
            sendIntroductions: getSendIntroductions(jsonData),
            groupName: getGroupName(jsonData),
        });
    }
    return data;
};

/**
 * Removes links from the agent data, clearing model IDs, tools, nested chats, handoffs,
 * and code execution functions. This is useful for preparing agents for export or
 * when links are not needed.
 * @param agent - The agent to process.
 * @returns A new agent object with links removed.
 */
const removeLinks: (agent: WaldiezNodeAgent) => WaldiezNodeAgent = agent => {
    const agentCopy = { ...agent };
    agentCopy.data.modelIds = [];
    agentCopy.data.tools = [];
    agentCopy.data.nestedChats = [];
    agentCopy.data.handoffs = [];
    if (agentCopy.data.codeExecutionConfig) {
        agentCopy.data.codeExecutionConfig.functions = [];
    }
    if (agent.data.agentType === "rag_user_proxy") {
        (agentCopy as WaldiezNodeAgentRagUser).data.retrieveConfig = {
            ...(agentCopy as WaldiezNodeAgentRagUser).data.retrieveConfig,
            model: null,
            docsPath: [],
        };
    }
    if (agent.data.agentType === "group_manager") {
        (agentCopy as WaldiezNodeAgentGroupManager).data.speakers = {
            ...(agentCopy as WaldiezNodeAgentGroupManager).data.speakers,
            allowRepeat: [],
            allowedOrDisallowedTransitions: {},
            order: [],
        };
        (agentCopy as WaldiezNodeAgentGroupManager).data.initialAgentId = undefined;
    }
    return agentCopy;
};

/**
 * Updates the agent data to be exported based on the agent type.
 * This function modifies the agent data object to include specific properties
 * required for each agent type, such as retrieveConfig for rag_user_proxy,
 * reasonConfig for reasoning agents, and so on.
 * @param agentType - The type of the agent.
 * @param agentData - The agent data object to update.
 * @param data - The original data object containing all properties.
 */
const updateAgentDataToExport = (agentType: WaldiezNodeAgentType, agentData: any, data: any) => {
    if (agentType === "rag_user_proxy") {
        updateRagAgent(agentData, data);
    }
    if (agentType === "reasoning") {
        updateReasoningAgent(agentData, data);
    }
    if (agentType === "captain") {
        updateCaptainAgent(agentData, data);
    }
    if (agentType === "assistant") {
        agentData.isMultimodal = getIsMultimodal(data);
    }
    if (agentType === "group_manager") {
        updateGroupManager(agentData, data);
    }
};

/**
 * Updates the rag user agent data with specific properties required for export.
 * This includes the retrieve configuration and any other rag-specific properties.
 * @param agentData - The rag user agent data to update.
 * @param data - The original data object containing all properties.
 */
const updateRagAgent = (agentData: WaldiezAgentRagUserData, data: any) => {
    agentData.retrieveConfig = getRetrieveConfig(data);
};

/**
 * Updates the reasoning agent data with specific properties required for export.
 * This includes the verbose flag and reasoning configuration.
 * @param agentData - The reasoning agent data to update.
 * @param data - The original data object containing all properties.
 */
const updateReasoningAgent = (agentData: WaldiezAgentReasoningData, data: any) => {
    agentData.verbose = getVerbose(data);
    agentData.reasonConfig = getReasonConfig(data);
};

/**
 * Updates the captain agent data with specific properties required for export.
 * This includes the agent library, tool library, maximum rounds, and maximum turns.
 * @param agentData - The captain agent data to update.
 * @param data - The original data object containing all properties.
 */
const updateCaptainAgent = (agentData: WaldiezAgentCaptainData, data: any) => {
    agentData.agentLib = getCaptainAgentLib(data);
    agentData.toolLib = getCaptainToolLib(data);
    agentData.maxRound = getCaptainMaxRound(data);
    agentData.maxTurns = getCaptainMaxTurns(data);
};

/**
 * Updates the group manager agent data with specific properties required for export.
 * This includes the maximum round, admin name, speakers, clear history option,
 * introductions option, initial agent ID, and group name.
 * @param agentData - The group manager agent data to update.
 * @param data - The original data object containing all properties.
 */
const updateGroupManager = (agentData: WaldiezAgentGroupManagerData, data: any) => {
    agentData.maxRound = getGroupChatMaxRound(data);
    agentData.adminName = getAdminName(data);
    agentData.speakers = getSpeakers(data);
    agentData.enableClearHistory = getEnableClearHistory(data);
    agentData.sendIntroductions = getSendIntroductions(data);
    agentData.initialAgentId = getInitialAgentId(data);
    agentData.groupName = getGroupName(data);
};
