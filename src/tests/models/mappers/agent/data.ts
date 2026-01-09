/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { defaultGroupChatSpeakers, defaultReasonConfig, defaultRetrieveConfig } from "@waldiez/models/Agent";
import { INITIAL_AGENT_SIZE } from "@waldiez/theme/sizes";

const baseTimestamps = () => ({
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});

const baseData = {
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
    contextVariables: {},
    updateAgentStateBeforeReply: [],
    afterWork: null,
    handoffs: [],
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
};

const createAgentJson = ({
    id,
    agentType,
    name,
    description,
    tags = [],
    requirements = [],
    position,
    dataOverrides = {},
    extra = {},
}: {
    id: string;
    agentType: string;
    name: string;
    description: string;
    tags?: string[];
    requirements?: string[];
    position: { x: number; y: number };
    dataOverrides?: Record<string, any>;
    extra?: Record<string, any>;
}) => ({
    id,
    type: "agent",
    agentType,
    name,
    description,
    tags,
    requirements,
    ...baseTimestamps(),
    data: {
        ...baseData,
        humanInputMode: agentType === "user_proxy" || agentType === "rag_user_proxy" ? "ALWAYS" : "NEVER",
        ...dataOverrides,
    },
    position,
    style: {
        width:
            agentType === "user_proxy"
                ? INITIAL_AGENT_SIZE.user.width
                : agentType === "group_manager"
                  ? INITIAL_AGENT_SIZE.group_manager.width
                  : INITIAL_AGENT_SIZE.other.width,
    },
    ...extra,
});

export const userJson = createAgentJson({
    id: "wa-1",
    agentType: "user_proxy",
    name: "user_proxy",
    description: "New user",
    position: { x: 10, y: 11 },
});

export const assistantJson = createAgentJson({
    id: "assistant",
    agentType: "assistant",
    name: "Assistant",
    description: "New assistant",
    tags: ["tag1"],
    requirements: ["requirement1"],
    position: { x: 20, y: 21 },
    dataOverrides: { isMultimodal: false },
});

export const ragUserJson = createAgentJson({
    id: "ragUser",
    agentType: "rag_user_proxy",
    name: "Rag User",
    description: "A rag user agent",
    position: { x: 40, y: 41 },
    dataOverrides: { retrieveConfig: defaultRetrieveConfig },
    extra: { key: "value" },
});

export const captainJson = createAgentJson({
    id: "captain",
    agentType: "captain",
    name: "Captain",
    description: "A captain agent",
    position: { x: 70, y: 71 },
    dataOverrides: {
        agentLib: [],
        toolLib: null,
        maxRound: 10,
        maxTurns: 5,
    },
    extra: { key: "value" },
});

export const groupManagerJson = createAgentJson({
    id: "groupManager",
    agentType: "group_manager",
    name: "Group Manager",
    description: "A group manager agent",
    position: { x: 80, y: 81 },
    dataOverrides: {
        maxRound: 1,
        adminName: "admin",
        speakers: defaultGroupChatSpeakers,
        enableClearHistory: true,
        sendIntroductions: true,
    },
    extra: { key: "value" },
});

export const reasoningJson = createAgentJson({
    id: "reasoning",
    agentType: "reasoning",
    name: "Reasoning",
    description: "A reasoning agent",
    position: { x: 90, y: 91 },
    dataOverrides: {
        verbose: true,
        reasonConfig: defaultReasonConfig,
    },
    extra: { key: "value" },
});

export const docAgentJson = createAgentJson({
    id: "doc_agent",
    agentType: "doc_agent",
    name: "Doc Agent",
    description: "A document agent",
    position: { x: 100, y: 101 },
    dataOverrides: {
        collectionName: "default_collection",
        resetCollection: false,
        parsedDocsPath: null,
        queryEngine: {
            type: "VectorChromaQueryEngine",
            dbPath: null,
            enableQueryCitations: false,
            citationChunkSize: 512,
        },
    },
    extra: { key: "value" },
});
