/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Edge, Node } from "@xyflow/react";

import type { CSSProperties } from "react";

import {
    ValidChatTypes,
    WaldiezChat,
    WaldiezChatData,
    type WaldiezEdge,
    type WaldiezEdgeData,
    type WaldiezEdgeType,
} from "@waldiez/models/Chat";
import { messageMapper } from "@waldiez/models/mappers/chat/messageMapper";
import { summaryMapper } from "@waldiez/models/mappers/chat/summaryMapper";
import {
    checkChatData,
    getChatClearHistory,
    getChatDescription,
    getChatMaxTurns,
    getChatName,
    getChatOrder,
    getChatPosition,
    getChatPrerequisites,
    getChatRest,
    getChatSilent,
    getChatSourceType,
    getChatTargetType,
    getNestedChat,
    getRealSource,
    getRealTarget,
    updateEdge,
} from "@waldiez/models/mappers/chat/utils";
import {
    getAfterWork,
    getDescriptionFromJSON,
    getHandoffAvailability,
    getHandoffCondition,
    getNameFromJSON,
} from "@waldiez/models/mappers/common";

/* eslint-disable max-statements */

/** Imports and exports for chatMapper
 * This module provides functions to import and export chat data,
 * as well as convert chat data to and from edge format.
 * It includes methods to import a chat from JSON, export a chat to JSON,
 * and convert a WaldiezChat instance to a WaldiezEdge instance.
 * @see {@link WaldiezChat}
 * @see {@link WaldiezEdge}
 * @see {@link WaldiezChatData}
 */
export const chatMapper = {
    /**
     * Imports a chat from JSON.
     * If the JSON is invalid or missing, it creates a new chat with default values.
     * @param json - The JSON representation of the chat.
     * @param edges - The edges in the graph.
     * @param nodes - The nodes in the graph.
     * @param index - The index of the chat in the graph.
     * @returns An object containing the imported chat and its edge.
     */
    importChat: (
        json: unknown,
        edges: Edge[],
        nodes: Node[],
        index: number,
    ): { chat: WaldiezChat; edge: Edge } => {
        if (!json || typeof json !== "object") {
            throw new Error("Invalid edge data");
        }
        const jsonObject = json as Record<string, unknown>;
        let result = null;
        try {
            result = checkChatData(jsonObject, edges, nodes);
        } catch (error: any) {
            throw new Error(error.message);
        }
        const { edge, sourceNode, targetNode } = result;
        const id = jsonObject.id as string;
        const type = getChatTypeFromJSON(edge);
        const data = getChatData(jsonObject.data as any, index);
        const rest = getChatRest({ ...jsonObject, ...edge });

        const updatedEdge = updateEdge(edge as WaldiezEdge, data, jsonObject, sourceNode, targetNode, rest);
        Object.entries(updatedEdge).forEach(([key, value]) => {
            if (key !== "data" && key !== "source" && key !== "target" && key !== "id" && key !== "type") {
                rest[key] = value;
            }
        });
        const chat = new WaldiezChat({ id, data, type, source: sourceNode.id, target: targetNode.id, rest });
        return { chat, edge: updatedEdge };
    },

    /**
     * Exports a chat to JSON.
     * @param edge - The edge representing the chat.
     * @param index - The index of the chat in the graph.
     * @returns An object containing the exported chat data.
     */
    exportChat: (edge: WaldiezEdge, index: number) => {
        const edgeData = edge.data as WaldiezEdge["data"];
        const edgeType = edge.type || getChatTypeFromJSON(edge);
        const data = { ...edgeData } as WaldiezEdgeData;
        const chatData = {
            sourceType: getChatSourceType(data),
            targetType: getChatTargetType(data),
            name: getChatName(data),
            order: getChatOrder(data),
            description: getChatDescription(data),
            position: getChatPosition(data, index),
            clearHistory: getChatClearHistory(data),
            maxTurns: getChatMaxTurns(data),
            message: messageMapper.exportMessage(data.message),
            summary: summaryMapper.exportSummary(data.summary),
            nestedChat: getNestedChat(data),
            prerequisites: getChatPrerequisites(data),
            condition: getHandoffCondition(data),
            available: getHandoffAvailability(data),
            afterWork: getAfterWork(data),
            silent: getChatSilent(data),
            realSource: data.realSource,
            realTarget: data.realTarget,
        };
        const rest = { ...edge } as any;
        if (rest.type === "hidden") {
            rest.hidden = true;
        }
        delete rest.data;
        delete rest.type;
        delete rest.source;
        delete rest.target;
        delete rest.id;
        const chat = new WaldiezChat({
            id: edge.id,
            data: chatData,
            type: edgeType,
            source: edge.source,
            target: edge.target,
            rest,
        }) as any;
        const toExport = { ...chat, ...chat.rest };
        delete toExport.rest;
        return toExport;
    },

    /**
     * Converts a WaldiezChat instance to a WaldiezEdge instance.
     * @param chat - The WaldiezChat instance to convert.
     * @returns A WaldiezEdge instance representing the chat.
     */
    asEdge: (chat: WaldiezChat): WaldiezEdge => {
        const data = {
            label: chat.data.name,
            sourceType: chat.data.sourceType,
            targetType: chat.data.targetType,
            description: chat.data.description,
            position: chat.data.position,
            order: chat.data.order,
            clearHistory: chat.data.clearHistory,
            message: chat.data.message,
            nestedChat: chat.data.nestedChat,
            prerequisites: chat.data.prerequisites,
            summary: chat.data.summary,
            maxTurns: chat.data.maxTurns,
            condition: chat.data.condition,
            available: chat.data.available,
            afterWork: chat.data.afterWork,
            realSource: chat.data.realSource,
            realTarget: chat.data.realTarget,
            silent: chat.data.silent,
        };
        const style: CSSProperties = chat.rest?.style || {};
        style.strokeWidth = 1;
        return {
            id: chat.id,
            source: chat.source,
            target: chat.target,
            type: chat.type,
            data,
            hidden: chat.rest?.hidden === true || chat.type === "hidden",
            ...chat.rest,
            style,
        };
    },
};

const getChatTypeFromJSON = (json: { [key: string]: any }): WaldiezEdgeType => {
    const defaultType = "chat";
    if (
        "data" in json &&
        typeof json.data === "object" &&
        "type" in json.data &&
        typeof json.data.type === "string" &&
        ValidChatTypes.includes(json.data.type.toLocaleLowerCase())
    ) {
        return json.data.type as WaldiezEdgeType;
    }
    if ("type" in json && typeof json.type === "string") {
        if (ValidChatTypes.includes(json.type.toLocaleLowerCase())) {
            return json.type as WaldiezEdgeType;
        }
    }
    return defaultType;
};

/**
 * Creates a WaldiezChatData instance from JSON data.
 * @param json - The JSON object containing chat data.
 * @param index - The index of the chat in the graph.
 * @returns A WaldiezChatData instance with the extracted data.
 */
const getChatData = (json: { [key: string]: any }, index: number): WaldiezChatData => {
    if (!json || typeof json !== "object") {
        throw new Error("Invalid chat data");
    }
    const name = getNameFromJSON(json, "New connection")!;
    const description = getDescriptionFromJSON(json, "New connection");
    const sourceType = getChatSourceType(json);
    const targetType = getChatTargetType(json);
    const clearHistory = getChatClearHistory(json);
    const maxTurns = getChatMaxTurns(json);
    const position = getChatPosition(json, index);
    const order = getChatOrder(json);
    const message = messageMapper.importMessage(json);
    const summary = summaryMapper.importSummary(json);
    const nestedChat = getNestedChat(json);
    const prerequisites = getChatPrerequisites(json);
    const realSource = getRealSource(json);
    const realTarget = getRealTarget(json);
    const condition = getHandoffCondition(json);
    const available = getHandoffAvailability(json);
    const afterWork = getAfterWork(json);
    const silent = getChatSilent(json);
    return new WaldiezChatData({
        sourceType,
        targetType,
        name,
        description,
        clearHistory,
        maxTurns,
        position,
        order,
        message,
        summary,
        nestedChat,
        prerequisites,
        condition,
        available,
        realSource,
        realTarget,
        afterWork,
        silent,
    });
};
