/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type Node } from "@xyflow/react";

import {
    type WaldiezAgentCodeExecutionConfig,
    type WaldiezAgentLinkedTool,
    type WaldiezAgentNestedChat,
    type WaldiezAgentTerminationMessageCheck,
    defaultReasonConfig,
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
    userParticipants: ["user_proxy"],
};

let addedNestedChat = false;
const agentNodes: Node[] = edges.map((_, index) => {
    const nodeId = `agent-${index}`;
    let agentType = "user_proxy";
    let includeNested = false;
    if (index % 5 === 1) {
        agentType = "assistant";
    } else if (index % 5 === 2) {
        agentType = "rag_user_proxy";
    } else if (index % 5 === 3) {
        agentType = "captain";
    } else if (index % 5 === 4) {
        agentType = "reasoning";
    }
    if (agentType === "user_proxy" || agentType === "assistant") {
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
            condition: {
                conditionType: "string_llm",
                prompt: "Start a new chat",
            },
            available: {
                type: "none",
                value: "",
            },
        });
        addedNestedChat = true;
    }
    let codeExecutionConfig = false as WaldiezAgentCodeExecutionConfig;
    if (index === edgesCount - 1) {
        codeExecutionConfig = {
            functions: ["tool-0"],
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
            humanInputMode: agentType.includes("user_proxy") ? "ALWAYS" : "NEVER",
            termination: {
                type: "keyword",
                keywords: ["keyword1", "keyword2"],
                criterion: "exact",
                methodContent: null,
            } as WaldiezAgentTerminationMessageCheck,
            nestedChats,
            tools: [{ id: "tool-0", executorId: "agent-2" }] as WaldiezAgentLinkedTool[],
            modelIds: [] as string[],
            createdAt,
            updatedAt,
        },
    } as any;
    if (agentType === "rag_user_proxy") {
        agentData.data.retrieveConfig = defaultRetrieveConfig;
    }
    if (agentType === "reasoning") {
        agentData.data.reasonConfig = defaultReasonConfig;
    }
    if (agentType === "captain") {
        agentData.data.toolLib = "default";
        agentData.data.agentLib = [];
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
    selected: true,
    data: {
        label: "Agent Node",
        agentType: "assistant",
        nestedChats: [],
        tools: [] as WaldiezAgentLinkedTool[],
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

const toolNode1 = {
    id: "tool-0",
    type: "tool",
    position: {
        x: 100,
        y: 100,
    },
    data: {
        label: "Tool Node 0",
        description: "description",
        content: "content",
        secrets: {
            toolSecretKey1: "toolSecretValue1",
            toolSecretKey2: "toolSecretValue2",
        },
        requirements: [] as string[],
        tags: [] as string[],
        createdAt,
        updatedAt,
    },
};
const toolNode2 = {
    id: "tool-1",
    type: "tool",
    position: {
        x: 200,
        y: 200,
    },
    data: {
        label: "Tool Node 1",
        description: "description",
        content: "content",
        secrets: {
            toolSecretKey1: "toolSecretValue1",
            toolSecretKey2: "toolSecretValue2",
        },
        requirements: [] as string[],
        tags: [] as string[],
        createdAt,
        updatedAt,
    },
};
export const toolNodes = [toolNode1, toolNode2];

export const nodes = [...modelNodes, ...toolNodes, ...agentNodes];
