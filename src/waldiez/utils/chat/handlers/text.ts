/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TextMessageData, WaldiezChatMessage } from "@waldiez/types";
import {
    MessageHandler,
    MessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import { MessageUtils } from "@waldiez/utils/chat/utils";

/**
 * Text message handler processes text and tool call messages.
 * It validates the message structure, normalizes the content, and replaces image URLs if provided.
 * If valid, it constructs a WaldiezChatMessage object with the normalized content and metadata.
 */
export class TextMessageHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "text";
    }

    /**
     * Validates if the provided data is a valid text message.
     * @param data - The data to validate.
     * @returns True if the data is a valid text message, false otherwise.
     */
    static isValidTextMessage(data: any): data is TextMessageData {
        /* c8 ignore next 9 */
        if (!data || typeof data !== "object") {
            return false;
        }
        if (data.type !== "text") {
            return false;
        }
        if (Array.isArray(data.content)) {
            return data.content.every(isValidContentItem);
        }

        const content = data.content;
        if (
            !content ||
            typeof content !== "object" ||
            typeof content.sender !== "string" ||
            typeof content.recipient !== "string"
        ) {
            return false;
        }

        const inner = content.content;

        if (typeof inner === "string") {
            return true;
        }
        if (Array.isArray(inner)) {
            return inner.every(isValidContentItem);
        }
        return isValidContentItem(inner);
    }

    /**
     * Handles the text message.
     * Validates the message data, normalizes the content, and replaces image URLs if provided.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined {
        if (!TextMessageHandler.isValidTextMessage(data)) {
            return undefined;
        }

        let content = MessageUtils.normalizeContent(data.content.content, context.imageUrl);

        if (context.imageUrl) {
            content = MessageUtils.replaceImageUrls(content, context.imageUrl);
        }

        const message: WaldiezChatMessage = {
            id: MessageUtils.generateMessageId(data),
            timestamp: MessageUtils.generateTimestamp(data),
            type: data.type,
            content,
            sender: data.content.sender,
            recipient: data.content.recipient,
        };

        return {
            message,
            requestId: null,
        };
    }
}

function isValidContentItem(item: any): boolean {
    return (
        typeof item === "string" ||
        (item &&
            typeof item === "object" &&
            typeof item.type === "string" &&
            ((item.type === "text" && typeof item.text === "string") ||
                (item.type === "image_url" && item.image_url && typeof item.image_url.url === "string")))
    );
}
