/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import {
    WaldiezAgentCodeExecutionConfig,
    WaldiezAgentLinkedSkill,
    WaldiezAgentNestedChat,
    WaldiezAgentTerminationMessageCheck,
    defaultRetrieveConfig,
} from "@waldiez/models";

import { createdAt, edgesCount, updatedAt } from "./common";
import { edges } from "./edges";

export const userInput = {
    previousMessages: [
        {
            id: "1",
            type: "print",
            data: {
                text: "Message 1",
            },
            timestamp: "2024-01-01T00:00:00Z",
        },
        {
            id: "2",
            type: "print",
            data: {
                text: "Message 2",
            },
            timestamp: "2024-01-01T00:01:00Z",
        },
    ],
    prompt: "User Input Prompt",
    request_id: "request_id",
    userParticipants: new Set(["user"]),
};

let addedNestedChat = false;
const agentNodes: Node[] = edges.map((_, index) => {
    const nodeId = `agent-${index}`;
    let agentType = "user";
    let includeNested = false;
    if (index % 3 === 0) {
        agentType = "assistant";
    } else if (index % 3 === 1) {
        agentType = "rag_user";
    }
    if (agentType === "user" || agentType === "assistant") {
        includeNested = index % 2 === 0;
    }
    const nestedChats = [] as WaldiezAgentNestedChat[];
    if (includeNested && !addedNestedChat) {
        nestedChats.push({
            triggeredBy: ["agent-0"],
            messages: [
                {
                    id: "edge-0",
                    isReply: true,
                },
            ],
        });
        addedNestedChat = true;
    }
    let codeExecutionConfig = false as WaldiezAgentCodeExecutionConfig;
    if (index === edgesCount - 1) {
        codeExecutionConfig = {
            functions: ["skill-0"],
        };
    }
    const agentData = {
        id: nodeId,
        type: "agent",
        position: {
            x: 100 * index,
            y: 100 * index,
        },
        data: {
            label: `Node ${index}`,
            agentType,
            description: `The agent's description ${index}`,
            codeExecutionConfig,
            systemMessage: `System Message ${index}`,
            humanInputMode: agentType.includes("user") ? "ALWAYS" : "NEVER",
            termination: {
                type: "keyword",
                keywords: ["keyword1", "keyword2"],
                criterion: "exact",
                methodContent: null,
            } as WaldiezAgentTerminationMessageCheck,
            nestedChats,
            skills: [{ id: "skill-0", executorId: "agent-2" }] as WaldiezAgentLinkedSkill[],
            modelIds: [] as string[],
            createdAt,
            updatedAt,
        },
    } as any;
    if (agentType === "rag_user") {
        agentData.data.retrieveConfig = defaultRetrieveConfig;
    }
    return agentData;
});
agentNodes.push({
    id: `agent-${edgesCount}`,
    type: "agent",
    position: {
        x: 100 * edgesCount,
        y: 100 * edgesCount,
    },
    data: {
        label: "Agent Node",
        agentType: "manager",
        nestedChats: [] as WaldiezAgentNestedChat[],
        skills: [] as WaldiezAgentLinkedSkill[],
        modelIds: [] as string[],
        codeExecutionConfig: false as WaldiezAgentCodeExecutionConfig,
        termination: {
            type: "none",
            keywords: [],
            criterion: "found",
            methodContent: null,
        } as WaldiezAgentTerminationMessageCheck,
        createdAt,
        updatedAt,
        maxRound: 1,
        adminName: "Node 1",
        enableClearHistory: false,
        sendIntroductions: undefined,
        speakers: {
            selectionMethod: "auto",
            selectionCustomMethod: "",
            maxRetriesForSelecting: null,
            selectionMode: "repeat",
            allowRepeat: false,
            allowedOrDisallowedTransitions: {},
            transitionsType: "allowed",
        },
    },
});
agentNodes.push({
    id: `agent-${edgesCount + 1}`,
    type: "agent",
    position: {
        x: 100 * (edgesCount + 1),
        y: 100 * (edgesCount + 1),
    },
    data: {
        label: "Agent Node",
        agentType: "assistant",
        nestedChats: [] as WaldiezAgentNestedChat[],
        skills: [] as WaldiezAgentLinkedSkill[],
        modelIds: [] as string[],
        codeExecutionConfig: false as WaldiezAgentCodeExecutionConfig,
        termination: {
            type: "none",
            keywords: [],
            criterion: "found",
            methodContent: null,
        } as WaldiezAgentTerminationMessageCheck,
        createdAt,
        updatedAt,
        parentId: `agent-${edgesCount}`,
    },
});
export { agentNodes };

export const modelNode1 = {
    id: "model-0",
    type: "model",
    position: {
        x: 0,
        y: 0,
    },
    data: {
        label: "Model Node 0",
        name: "test model",
        description: "test model description",
        baseUrl: "http://localhost:3000",
        apiType: "other",
        apiKey: "test-api-key",
        apiVersion: "v1",
        temperature: 0.1,
        topP: 0.2,
        maxTokens: 200,
        defaultHeaders: {},
        price: {
            promptPricePer1k: 0.05,
            completionTokenPricePer1k: 0.1,
        },
        tags: ["modelTag"] as string[],
        requirements: ["requirement"] as string[],
        createdAt,
        updatedAt,
    },
};
const modelNode2 = {
    id: "model-1",
    type: "model",
    position: {
        x: 100,
        y: 100,
    },
    data: {
        label: "Model Node 1",
        name: "test model",
        description: "test model description",
        baseUrl: "http://localhost:3000",
        apiType: "other",
        apiKey: "test-api-key",
        apiVersion: "v1",
        temperature: 0.1,
        topP: 0.2,
        maxTokens: 200,
        defaultHeaders: {},
        price: {
            promptPricePer1k: 0.05,
            completionTokenPricePer1k: 0.1,
        },
        tags: [] as string[],
        requirements: [] as string[],
        createdAt,
        updatedAt,
    },
};

export const modelNodes = [modelNode1, modelNode2];

const skillNode1 = {
    id: "skill-0",
    type: "skill",
    position: {
        x: 100,
        y: 100,
    },
    data: {
        label: "Skill Node 0",
        description: "description",
        content: "content",
        secrets: {
            skillSecretKey1: "skillSecretValue1",
            skillSecretKey2: "skillSecretValue2",
        },
        requirements: [] as string[],
        tags: [] as string[],
        createdAt,
        updatedAt,
    },
};
const skillNode2 = {
    id: "skill-1",
    type: "skill",
    position: {
        x: 200,
        y: 200,
    },
    data: {
        label: "Skill Node 1",
        description: "description",
        content: "content",
        secrets: {
            skillSecretKey1: "skillSecretValue1",
            skillSecretKey2: "skillSecretValue2",
        },
        requirements: [] as string[],
        tags: [] as string[],
        createdAt,
        updatedAt,
    },
};
export const skillNodes = [skillNode1, skillNode2];

export const nodes = [...modelNodes, ...skillNodes, ...agentNodes];
