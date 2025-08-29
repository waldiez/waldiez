/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Position } from "@xyflow/react";

import type { WaldiezChatLlmSummaryMethod, WaldiezMessageType } from "@waldiez/models/types";

export const createdAt = new Date().toISOString();
export const updatedAt = new Date().toISOString();
export const flowId = "wf-0";
export const edgeId = "we-1";

export const edgeData = {
    label: "Edge label",
    description: "Edge description",
    order: 0,
    position: 1,
    clearHistory: false,
    summary: {
        method: "lastMsg" as WaldiezChatLlmSummaryMethod,
        prompt: "",
        args: {},
    },
    maxTurns: 2,
    message: {
        type: "string" as WaldiezMessageType,
        content: "Edge message",
        context: {},
    },
    nestedChat: {
        message: {
            type: "none" as WaldiezMessageType,
            content: "",
        },
        reply: {
            type: "none" as WaldiezMessageType,
            content: "",
        },
    },
    prerequisites: [],
    contextVariables: {},
    condition: {
        conditionType: "string_llm",
        prompt: "Handoff to another agent",
    },
    available: {
        type: "none",
        value: "",
    },
};
export const edgeProps = {
    id: edgeId,
    source: "wa-1",
    target: "wa-2",
    sourceX: 0,
    sourceY: 10,
    targetX: 10,
    targetY: 20,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    markerEnd: undefined,
    data: edgeData,
};

export const nodes = [
    {
        id: edgeProps.source,
        type: "agent",
        position: {
            x: edgeProps.sourceX,
            y: edgeProps.sourceY,
        },
        data: {
            label: "Edge source",
            agentType: "user_proxy",
            nestedChats: [],
            tools: [],
            modelIds: [],
        },
    },
    {
        id: edgeProps.target,
        type: "agent",
        position: {
            x: edgeProps.targetX,
            y: edgeProps.targetY,
        },
        data: {
            label: "Edge target",
            agentType: "assistant",
            nestedChats: [],
            tools: [],
            modelIds: [],
        },
    },
];
