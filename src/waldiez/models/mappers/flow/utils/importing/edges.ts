/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge, Node } from "@xyflow/react";

import { ValidChatTypes, WaldiezChat } from "@waldiez/models";
import { chatMapper } from "@waldiez/models/mappers/chat";
import { getRestFromJSON } from "@waldiez/models/mappers/common";

export const getEdges = (json: Record<string, unknown>) => {
    if (!("edges" in json) || !Array.isArray(json.edges)) {
        return [];
    }
    const edges: Edge[] = [];
    json.edges.forEach((edgeJson: Record<string, unknown>) => {
        if (!("id" in edgeJson) || typeof edgeJson.id !== "string") {
            return;
        }
        if (
            !("type" in edgeJson) ||
            typeof edgeJson.type !== "string" ||
            !ValidChatTypes.includes(edgeJson.type)
        ) {
            return;
        }
        if (!("source" in edgeJson) || typeof edgeJson.source !== "string") {
            return;
        }
        if (!("target" in edgeJson) || typeof edgeJson.target !== "string") {
            return;
        }
        const rest = getRestFromJSON(edgeJson, ["id", "type", "source", "target", "data", "hidden"]);
        edges.push({
            id: edgeJson.id,
            type: edgeJson.type,
            source: edgeJson.source,
            target: edgeJson.target,
            hidden: edgeJson.type === "hidden",
            data: {},
            ...rest,
        });
    });
    return edges;
};
export const getChats = (json: Record<string, unknown>, nodes: Node[], edges: Edge[]) => {
    if (!("chats" in json) || !Array.isArray(json.chats)) {
        return { chats: [], edges };
    }
    const chats: WaldiezChat[] = [];
    const updatedEdges: Edge[] = [];
    json.chats.forEach((chatJson: Record<string, unknown>, index) => {
        try {
            const { chat, edge } = chatMapper.importChat(chatJson, edges, nodes, index);
            chats.push(chat);
            updatedEdges.push(edge);
        } catch (error) {
            console.error(`Error importing chat at index ${index}:`, error);
        }
    });
    return { chats, edges: updatedEdges };
};
