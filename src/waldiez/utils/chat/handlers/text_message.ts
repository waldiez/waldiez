/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatMessage } from "@waldiez/types";
import { MessageValidator } from "@waldiez/utils/chat/base";
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
     * Handles the text message.
     * Validates the message data, normalizes the content, and replaces image URLs if provided.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidTextMessage(data)) {
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
