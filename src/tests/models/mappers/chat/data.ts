/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node } from "@xyflow/react";

import { WaldiezChatLlmSummaryMethod, WaldiezEdgeType, WaldiezMessageType } from "@waldiez/types";

export const chatJson = {
    id: "wc-1",
    data: {
        source: "wa-1",
        target: "wa-2",
        name: "custom_chat",
        description: "custom_description",
        position: 0,
        order: 0,
        clearHistory: false,
        message: {
            type: "none",
            useCarryover: false,
            content: null,
            context: {
                context_key: "context_value",
            },
        },
        nestedChat: {
            message: null,
            reply: null,
        },
        summary: {
            method: "reflectionWithLlm",
            prompt: "summarize the conversation",
            args: {
                summary_role: "user",
            },
        },
        maxTurns: 0,
        maxRounds: 0,
    },
    type: "chat",
};
export const edges: Edge[] = [
    {
        id: "wc-1",
        type: "chat",
        source: "wa-1",
        target: "wa-2",
        data: {
            label: "wa-1 => wa-2",
        },
    },
    {
        id: "wc-2",
        type: "chat",
        source: "wa-2",
        target: "wa-3",
        data: {
            label: "wa-2 => wa-3",
        },
    },
];
export const agents: Node[] = [
    {
        id: "wa-1",
        type: "agent",
        data: {
            label: "wa-1",
            agentType: "user_proxy",
        },
        position: { x: 0, y: 0 },
    },
    {
        id: "wa-2",
        type: "agent",
        data: {
            agentType: "assistant",
            label: "wa-2",
        },
        position: { x: 10, y: 10 },
    },
    {
        id: "wa-3",
        type: "agent",
        data: {
            agentType: "reasoning",
            label: "wa-3",
        },
        position: { x: 20, y: 20 },
    },
    {
        id: "wa-4",
        type: "agent",
        data: {
            agentType: "captain",
            label: "wa-4",
        },
        position: { x: 30, y: 40 },
    },
];
export const updateData = {
    chat: {
        name: "Chat",
        description: "Chat Description",
        source: "wa-1",
        target: "wa-2",
        sourceType: "user_proxy" as const,
        targetType: "assistant" as const,
        position: 0,
        order: 0,
        clearHistory: false,
        message: {
            type: "none" as WaldiezMessageType,
            useCarryover: false,
            content: null,
            context: {},
        },
        nestedChat: {
            message: null,
            reply: null,
        },
        prerequisites: [],
        summary: {
            method: "lastMsg" as WaldiezChatLlmSummaryMethod,
            prompt: "summarize the conversation",
            args: {
                summary_role: "user",
            },
        },
        maxTurns: 0,
        maxRounds: 0,
        realSource: "wa-1",
        realTarget: "wa-2",
    },
    edge: {
        id: "1",
        source: "wa-1",
        target: "wa-2",
        type: "chat" as WaldiezEdgeType,
        data: {
            label: "Chat",
            description: "Chat Description",
            position: 0,
            order: 0,
            clearHistory: false,
            message: {
                type: "none" as WaldiezMessageType,
                useCarryover: false,
                content: null,
                context: {},
            },
            nestedChat: {
                message: null,
                reply: null,
            },
            prerequisites: [],
            summary: {
                method: "lastMsg" as WaldiezChatLlmSummaryMethod,
                prompt: "summarize the conversation",
                args: {
                    summary_role: "user",
                },
            },
            maxTurns: 0,
            maxRounds: 0,
            realSource: "wa-1",
            realTarget: "wa-2",
            sourceType: "user_proxy" as const,
            targetType: "assistant" as const,
        },
    },
    json: {
        label: "Chat",
        description: "Chat Description",
        position: 0,
        order: 0,
        clearHistory: false,
        message: {
            type: "none",
            useCarryover: false,
            content: null,
            context: {},
        },
        nestedChat: {
            message: null,
            reply: null,
        },
        prerequisites: [],
        summary: {
            method: "lastMsg",
            prompt: "summarize the conversation",
            args: {
                summary_role: "user",
            },
        },
        maxTurns: 0,
        maxRounds: 0,
        realSource: "wa-1",
        realTarget: "wa-2",
    },
    expected: {
        id: "1",
        source: "wa-1",
        target: "wa-2",
        type: "chat",
        data: {
            label: "Chat",
            description: "Chat Description",
            position: 0,
            order: 0,
            clearHistory: false,
            message: {
                type: "none",
                useCarryover: false,
                content: null,
                context: {},
            },
            nestedChat: {
                message: null,
                reply: null,
            },
            prerequisites: [],
            summary: {
                method: "lastMsg",
                prompt: "summarize the conversation",
                args: {
                    summary_role: "user",
                },
            },
            maxTurns: 0,
            maxRounds: 0,
            source: "wa-1",
            target: "wa-2",
            sourceType: "user_proxy",
            targetType: "assistant",
            realSource: "wa-1",
            realTarget: "wa-2",
        },
        animated: false,
        markerEnd: {
            type: "arrowclosed",
            color: "#005490",
            width: 10,
            height: 10,
        },
        style: {
            stroke: "#005490",
            strokeWidth: 3,
        },
        sourceHandle: "agent-handle-top-source-wa-1",
        targetHandle: "agent-handle-top-target-wa-2",
    },
};
