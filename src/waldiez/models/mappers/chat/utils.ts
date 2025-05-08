/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { Edge, MarkerType, Node } from "@xyflow/react";

import {
    ValidAgentTypes,
    ValidChatTypes,
    ValidConditionTypes,
    WaldiezHandoffCondition,
    WaldiezNodeAgentType,
} from "@waldiez/models";
import { WaldiezChatData, WaldiezEdge, WaldiezEdgeType, WaldiezNestedChat } from "@waldiez/models/Chat";
import { messageMapper } from "@waldiez/models/mappers/chat/messageMapper";
import { AGENT_COLORS } from "@waldiez/theme";

export const getChatClearHistory = (data: { [key: string]: any }) => {
    let clearHistory = true;
    if ("clearHistory" in data && typeof data.clearHistory === "boolean") {
        clearHistory = data.clearHistory;
    }
    return clearHistory;
};

export const getChatName = (data: { [key: string]: any }) => {
    let name = "Chat";
    if ("label" in data && data.label) {
        if (typeof data.label === "string") {
            name = data.label;
        }
    }
    return name;
};

export const getChatDescription = (data: { [key: string]: any }) => {
    let description = "Chat Description";
    if ("description" in data && data.description) {
        if (typeof data.description === "string") {
            description = data.description;
        }
    }
    return description;
};

export const getChatPosition = (data: { [key: string]: any }, fallback: number) => {
    let chatPosition = fallback;
    if ("position" in data && typeof data.position === "number") {
        chatPosition = Math.floor(data.position);
    }
    return chatPosition;
};

export const getChatMaxTurns = (data: { [key: string]: any }) => {
    let maxTurns = null;
    if ("maxTurns" in data && typeof data.maxTurns === "number") {
        maxTurns = Math.floor(data.maxTurns);
    }
    return maxTurns;
};

export const getNestedChat = (data: { [key: string]: any }): WaldiezNestedChat => {
    const nestedChat = {
        message: null,
        reply: null,
    } as WaldiezNestedChat;
    if ("nestedChat" in data && data.nestedChat) {
        if ("message" in data.nestedChat && data.nestedChat.message) {
            nestedChat.message = messageMapper.importMessage({
                message: data.nestedChat.message,
            });
        }
        if ("reply" in data.nestedChat && data.nestedChat.reply) {
            nestedChat.reply = messageMapper.importMessage({
                message: data.nestedChat.reply,
            });
        }
    }
    return nestedChat;
};

export const getChatPrerequisites = (data: { [key: string]: any }): string[] => {
    const prerequisites: string[] = [];
    if ("prerequisites" in data && Array.isArray(data.prerequisites)) {
        data.prerequisites.forEach(prerequisite => {
            if (typeof prerequisite === "string") {
                prerequisites.push(prerequisite);
            }
        });
    }
    return prerequisites;
};

export const getChatOrder = (data: { [key: string]: any }) => {
    let order = -1;
    if ("order" in data && typeof data.order === "number") {
        const orderValue = Math.floor(data.order);
        order = orderValue >= 0 ? orderValue : -1;
    }
    return order;
};

export const getRealSource = (data: { [key: string]: any }) => {
    let realSource = null;
    if ("realSource" in data && typeof data.realSource === "string") {
        realSource = data.realSource;
    }
    return realSource;
};

export const getRealTarget = (data: { [key: string]: any }) => {
    let realTarget = null;
    if ("realTarget" in data && typeof data.realTarget === "string") {
        realTarget = data.realTarget;
    }
    return realTarget;
};

/*
export type WaldiezStringLLMCondition = {
    condition_type: "string_llm";
    prompt: string;
    data?: Record<string, any>;
};
export type WaldiezContextStrLLMCondition = {
    condition_type: "context_str_llm";
    context_str: string;
    data?: Record<string, any>;
};
export type WaldiezLLMCondition = WaldiezStringLLMCondition | WaldiezContextStrLLMCondition;
export type WaldiezStringContextCondition = {
    condition_type: "string_context";
    variable_name: string;
};
export type WaldiezExpressionContextCondition = {
    condition_type: "expression_context";
    expression: string;
    data?: Record<string, any>;
};
export type WaldiezContextCondition = WaldiezStringContextCondition | WaldiezExpressionContextCondition;
export type WaldiezHandoffCondition = WaldiezLLMCondition | WaldiezContextCondition;
export type ConditionCategory = "llm" | "context";
export const ValidConditionCategories: ConditionCategory[] = ["llm", "context"];
export type ConditionType = "string_llm" | "context_str_llm" | "string_context" | "expression_context";
export const ValidConditionTypes: ConditionType[] = [
    "string_llm",
    "context_str_llm",
    "string_context",
    "expression_context",
];

*/

const getStringLLMCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition | null = null;
    if ("condition_type" in data && data.condition_type === "string_llm") {
        if ("prompt" in data && typeof data.prompt === "string") {
            condition = {
                condition_type: "string_llm",
                prompt: data.prompt,
            };
        }
    }
    return condition;
};
const getContextStrLLMCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition | null = null;
    if ("condition_type" in data && data.condition_type === "context_str_llm") {
        if ("context_str" in data && typeof data.context_str === "string") {
            condition = {
                condition_type: "context_str_llm",
                context_str: data.context_str,
            };
        }
    }
    return condition;
};
const getStringContextCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition | null = null;
    if ("condition_type" in data && data.condition_type === "string_context") {
        if ("variable_name" in data && typeof data.variable_name === "string") {
            condition = {
                condition_type: "string_context",
                variable_name: data.variable_name,
            };
        }
    }
    return condition;
};
const getExpressionContextCondition = (data: { [key: string]: any }) => {
    let condition: WaldiezHandoffCondition | null = null;
    if ("condition_type" in data && data.condition_type === "expression_context") {
        if ("expression" in data && typeof data.expression === "string") {
            condition = {
                condition_type: "expression_context",
                expression: data.expression,
            };
        }
    }
    return condition;
};

export const getChatHandoffCondition = (data: { [key: string]: any }) => {
    let handoffCondition: WaldiezHandoffCondition | null = null;
    if ("handoffCondition" in data && data.handoffCondition) {
        if (typeof data.handoffCondition === "object") {
            if (
                "condition_type" in data.handoffCondition &&
                data.handoffCondition.condition_type &&
                ValidConditionTypes.includes(data.handoffCondition.condition_type)
            ) {
                const conditionType = data.handoffCondition.condition_type;
                switch (conditionType) {
                    case "string_llm":
                        handoffCondition = getStringLLMCondition(data.handoffCondition);
                        break;
                    case "context_str_llm":
                        handoffCondition = getContextStrLLMCondition(data.handoffCondition);
                        break;
                    case "string_context":
                        handoffCondition = getStringContextCondition(data.handoffCondition);
                        break;
                    case "expression_context":
                        handoffCondition = getExpressionContextCondition(data.handoffCondition);
                        break;
                    default:
                        break;
                }
            }
        }
    }
    return handoffCondition;
};

export const getChatType = (
    edge: WaldiezEdge,
    json: { [key: string]: any },
    _sourceNode: Node,
    _targetNode: Node,
) => {
    let edgeType: WaldiezEdgeType = "chat";
    if (json.type && ValidChatTypes.includes(json.type)) {
        edgeType = json.type;
    }
    let chatType = edge?.type ?? edgeType;
    if (!ValidChatTypes.includes(chatType)) {
        chatType = "chat";
    }
    return chatType as WaldiezEdgeType;
};

export const updateEdge = (
    edge: WaldiezEdge,
    chatData: WaldiezChatData,
    json: { [key: string]: any },
    sourceNode: Node,
    targetNode: Node,
    rest: { [key: string]: any },
) => {
    const sourceAgentType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const chatType = getChatType(edge, json, sourceNode, targetNode);
    const color = AGENT_COLORS[sourceAgentType];
    edge.type = chatType;
    if (edge.type !== "hidden") {
        edge.animated = isChatAnimated(chatType, sourceNode, targetNode);
    }
    updateChatCommonStyle(edge, chatType, color);
    const sourceLabel = sourceNode.data.label;
    const targetLabel = targetNode.data.label;
    if (sourceLabel && targetLabel) {
        chatData.name = `${sourceLabel} => ${targetLabel}`;
    }
    edge.data = {
        ...chatData,
        label: chatData.name,
        order: chatType === "nested" ? -1 : chatData.order,
    };
    delete (edge.data as any).name;
    chatData.order = chatType === "nested" ? -1 : chatData.order;
    setEdgeSourceHandle(edge, rest);
    setEdgeTargetHandle(edge, rest);
    return { ...edge, ...rest };
};

const updateChatCommonStyle = (edge: WaldiezEdge, edgeType: WaldiezEdgeType, color: string) => {
    if (edge.type === "hidden") {
        return;
    }
    edge.markerEnd =
        edgeType !== "nested"
            ? {
                  type: MarkerType.ArrowClosed,
                  color,
                  width: 10,
                  height: 10,
              }
            : undefined;
    edge.style = {
        stroke: color,
        strokeWidth: 3,
    };
};

const isChatAnimated = (chatType: WaldiezEdgeType, _sourceNode: Node, _targetNode: Node) => {
    if (chatType === "nested") {
        return true;
    }
    return false;
};

const setEdgeSourceHandle = (edge: WaldiezEdge, rest: { [key: string]: any }) => {
    let sourceHandle: string | null = null;
    if ("sourceHandle" in rest && typeof rest.sourceHandle === "string") {
        // sourceHandle = rest.sourceHandle;
        // format: id={`agent-handle-{top|left|right|bottom}-{source|target}-${agentId}`}
        // so let's check for "{top|left|right|bottom}" and "source|target" in the handle id
        if (rest.sourceHandle.includes("-source") || rest.sourceHandle.includes("-target")) {
            const isSource = rest.sourceHandle.includes("-source");
            const position = ["top", "left", "right", "bottom"].find(pos => rest.sourceHandle.includes(pos));
            if (position) {
                sourceHandle = `agent-handle-${position}-${isSource ? "source" : "target"}-${isSource ? edge.source : edge.target}`;
            }
        }
    }
    rest.sourceHandle = sourceHandle;
    edge.sourceHandle = sourceHandle;
};

const setEdgeTargetHandle = (edge: WaldiezEdge, rest: { [key: string]: any }) => {
    let targetHandle: string | null = null;
    if ("targetHandle" in rest && typeof rest.targetHandle === "string") {
        // targetHandle = rest.targetHandle;
        // format: id={`agent-handle-{top|left|right|bottom}-{source|target}-${agentId}`}
        // so let's check for "{top|left|right|bottom}" and "source|target" in the handle id
        if (rest.targetHandle.includes("-source") || rest.targetHandle.includes("-target")) {
            const isSource = rest.targetHandle.includes("source");
            const position = ["top", "left", "right", "bottom"].find(pos => rest.targetHandle.includes(pos));
            if (position) {
                targetHandle = `agent-handle-${position}-${isSource ? "source" : "target"}-${isSource ? edge.source : edge.target}`;
            }
        }
    }
    rest.targetHandle = targetHandle;
    edge.targetHandle = targetHandle;
};

export const getChatRest = (json: { [key: string]: any }) => {
    const rest = { ...json };
    delete rest.id;
    delete rest.data;
    delete rest.type;
    delete rest.source;
    delete rest.target;
    return rest;
};

export const checkChatData = (json: { [key: string]: any }, edges: Edge[], nodes: Node[]) => {
    const isValid =
        "id" in json &&
        typeof json.id === "string" &&
        "data" in json &&
        typeof json.data === "object" &&
        json.data !== null &&
        "source" in json.data &&
        typeof json.data.source === "string" &&
        "target" in json.data &&
        typeof json.data.target === "string";
    if (!isValid) {
        throw new Error("Invalid edge data");
    }
    const edge = edges.find(e => e.id === json.id);
    if (!edge) {
        throw new Error(`Edge not found: ${json.id}`);
    }
    const sourceNode = nodes.find(n => n.id === json.data.source);
    if (!sourceNode || sourceNode.type !== "agent") {
        throw new Error(`Source node not found: ${json.data.source}`);
    }
    if (edge.source !== json.data.source) {
        throw new Error(`Source node does not match edge source: ${json.data.source}`);
    }
    const targetNode = nodes.find(n => n.id === json.data.target);
    if (!targetNode || targetNode.type !== "agent") {
        throw new Error(`Target node not found: ${json.data.target}`);
    }
    if (edge.target !== json.data.target) {
        throw new Error(`Target node does not match edge target: ${json.data.target}`);
    }
    return { edge, sourceNode, targetNode };
};

export const getChatSourceType = (json: { [key: string]: any }) => {
    let sourceType = "user_proxy";
    if ("sourceType" in json && typeof json.sourceType === "string") {
        sourceType = json.sourceType;
    }
    if (ValidAgentTypes.includes(sourceType)) {
        return sourceType as WaldiezNodeAgentType;
    }
    return "assistant" as WaldiezNodeAgentType;
};

export const getChatTargetType = (json: { [key: string]: any }) => {
    let targetType = "assistant";
    if ("targetType" in json && typeof json.targetType === "string") {
        targetType = json.targetType;
    }
    if (ValidAgentTypes.includes(targetType)) {
        return targetType as WaldiezNodeAgentType;
    }
    return "user_proxy" as WaldiezNodeAgentType;
};
