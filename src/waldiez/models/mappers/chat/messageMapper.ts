/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezMessage } from "@waldiez/models/Chat";

const VALID_CHAT_MESSAGE_TYPES = ["string", "method", "rag_message_generator", "none"];

type ChatMessageType = "string" | "method" | "rag_message_generator" | "none";

export const messageMapper = {
    importMessage: (data: { [key: string]: any }) => {
        return getEdgeMessage(data);
    },
    exportMessage: (message: WaldiezMessage) => {
        return {
            type: message.type,
            content: message.content,
            context: message.context,
            use_carryover: message.use_carryover,
        };
    },
};

const getEdgeMessage = (data: { [key: string]: any }) => {
    const message = {
        type: "none",
        use_carryover: false,
        content: null,
        context: {},
    } as {
        type: ChatMessageType;
        use_carryover: boolean;
        content: string | null;
        context: { [key: string]: any };
    };
    if ("message" in data && data.message) {
        message.type = getEdgeMessageType(data.message);
        message.content = getEdgeMessageContent(data.message);
        message.context = getEdgeMessageContext(data.message);
        message.use_carryover = getEdgeMessageUseCarryover(data.message);
    }
    return message;
};

const getEdgeMessageType = (data: { [key: string]: any }) => {
    let type: ChatMessageType = "none";
    if ("type" in data && data.type) {
        if (typeof data.type === "string" && VALID_CHAT_MESSAGE_TYPES.includes(data.type)) {
            type = data.type as ChatMessageType;
        }
    }
    return type;
};

const getEdgeMessageContent = (data: { [key: string]: any }) => {
    let content: string | null = null;
    if ("content" in data && data.content) {
        if (typeof data.content === "string") {
            content = data.content;
        }
    }
    return content;
};
const getEdgeMessageContext = (data: { [key: string]: any }) => {
    let context = {} as { [key: string]: any };
    if ("context" in data && data.context) {
        if (typeof data.context === "object") {
            context = Object.keys(data.context).reduce(
                (acc, key) => {
                    acc[key.toString()] = data.context[key];
                    return acc;
                },
                {} as { [key: string]: any },
            );
        }
    }
    return context;
};
const getEdgeMessageUseCarryover = (data: { [key: string]: any }) => {
    let useCarryover = false;
    if ("use_carryover" in data && typeof data.use_carryover === "boolean") {
        useCarryover = data.use_carryover;
    }
    /* deprecated */
    if ("useCarryover" in data && typeof data.useCarryover === "boolean") {
        useCarryover = data.useCarryover;
    }
    return useCarryover;
};
