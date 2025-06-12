/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezMessage } from "@waldiez/models/Chat";

const ValidChatMessageTypes = ["string", "method", "rag_message_generator", "none"];

type ChatMessageType = "string" | "method" | "rag_message_generator" | "none";

/**
 * Waldiez Message Mapper
 * This module provides functions to map messages between different formats.
 * It includes functions to import and export messages, as well as utility functions
 * to extract message properties from edge data structures.
 * @see {@link WaldiezMessage}
 */
export const messageMapper = {
    /**
     * Imports a message from edge data.
     * If the data is invalid or missing, it returns a default message.
     * @param data - The edge data containing the message.
     * @returns An object representing the imported message.
     */
    importMessage: (data: { [key: string]: any }) => {
        return getEdgeMessage(data);
    },

    /**
     * Exports a WaldiezMessage to a format suitable for edge data.
     * @param message - The WaldiezMessage to export.
     * @returns An object representing the exported message.
     */
    exportMessage: (message: WaldiezMessage) => {
        return {
            type: message.type,
            content: message.content,
            context: message.context,
            useCarryover: message.useCarryover,
        };
    },
};

/**
 * Utility functions to extract message properties from edge data.
 * @param data - The edge data containing the message.
 * @returns An object representing the message with type, content, context, and carryover usage.
 *          If the data does not contain a valid message, it returns default values.
 */
const getEdgeMessage = (data: { [key: string]: any }) => {
    const message = {
        type: "none",
        useCarryover: false,
        content: null,
        context: {},
    } as {
        type: ChatMessageType;
        useCarryover: boolean;
        content: string | null;
        context: { [key: string]: any };
    };
    if ("message" in data && data.message) {
        message.type = getEdgeMessageType(data.message);
        message.content = getEdgeMessageContent(data.message);
        message.context = getEdgeMessageContext(data.message);
        message.useCarryover = getEdgeMessageUseCarryover(data.message);
    }
    return message;
};

const getEdgeMessageType = (data: { [key: string]: any }) => {
    let type: ChatMessageType = "none";
    if ("type" in data && data.type) {
        if (typeof data.type === "string" && ValidChatMessageTypes.includes(data.type)) {
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
    if ("useCarryover" in data && typeof data.useCarryover === "boolean") {
        useCarryover = data.useCarryover;
    }
    /* deprecated */
    if ("useCarryover" in data && typeof data.useCarryover === "boolean") {
        useCarryover = data.useCarryover;
    }
    return useCarryover;
};
