/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { Edge, MarkerType, Node } from "@xyflow/react";

import { ValidAgentTypes, ValidChatTypes, WaldiezNodeAgentType } from "@waldiez/models";
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

export const getChatType = (edge: WaldiezEdge, json: { [key: string]: any }) => {
    let edgeType: WaldiezEdgeType = "chat";
    if ("type" in json && typeof json.type === "string" && json.type && ValidChatTypes.includes(json.type)) {
        edgeType = json.type as WaldiezEdgeType;
    } else if (
        "data" in json &&
        typeof json.data === "object" &&
        json.data !== null &&
        "type" in json.data &&
        typeof json.data.type === "string" &&
        json.data.type &&
        ValidChatTypes.includes(json.data.type)
    ) {
        edgeType = json.data.type as WaldiezEdgeType;
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
    let chatType = getChatType(edge, json);
    if ("type" in rest && typeof rest.type === "string" && ValidChatTypes.includes(rest.type)) {
        edge.type = rest.type as WaldiezEdgeType;
        chatType = edge.type;
    }
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

const findOoutWhyItIsInvalid = (json: { [key: string]: any }) => {
    const why = [];
    if (!("id" in json) || typeof json.id !== "string") {
        why.push("id must be a string");
    }
    if (!("data" in json) || typeof json.data !== "object" || json.data === null) {
        why.push("data must be an object");
    }
    if (!("source" in json.data) || typeof json.data.source !== "string") {
        why.push("data.source must be a string");
    }
    if (!("target" in json.data) || typeof json.data.target !== "string") {
        why.push("data.target must be a string");
    }
    if (why.length > 0) {
        return `Invalid edge data: ${why.join(", ")}`;
    }
    return "Invalid edge data";
};

const validateChatData = (json: { [key: string]: any }) => {
    if (!json || typeof json !== "object") {
        throw new Error("Invalid edge data");
    }
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
        throw new Error(findOoutWhyItIsInvalid(json));
    }
};

const ensureValidEdgeType = (json: { [key: string]: any }) => {
    if ("type" in json && typeof json.type === "string" && ValidChatTypes.includes(json.type)) {
        json.type = json.type as WaldiezEdgeType;
    } else if (
        "data" in json &&
        typeof json.data === "object" &&
        json.data !== null &&
        "type" in json.data &&
        typeof json.data.type === "string" &&
        ValidChatTypes.includes(json.data.type)
    ) {
        json.type = json.data.type as WaldiezEdgeType;
    } else {
        json.type = "chat"; // default type
    }
};

export const checkChatData = (json: { [key: string]: any }, edges: Edge[], nodes: Node[]) => {
    validateChatData(json);
    ensureValidEdgeType(json);
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
