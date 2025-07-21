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
 * Input request handler processes input request messages.
 * It validates the message structure and normalizes the prompt.
 * If valid, it creates a WaldiezChatMessage object with the request ID and normalized prompt.
 */
export class InputRequestHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "input_request";
    }

    /**
     * Handles the input request message.
     * Validates the message data, normalizes the prompt, and constructs a WaldiezChatMessage object.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidInputRequest(data)) {
            return undefined;
        }
        const normalizedPrompt = MessageUtils.normalizePrompt(data.prompt);
        const chatMessage: WaldiezChatMessage = {
            id: data.request_id,
            timestamp: MessageUtils.generateTimestamp(data),
            request_id: context.requestId || data.request_id,
            type: "input_request",
            content: [
                {
                    type: "text",
                    text: normalizedPrompt,
                },
            ],
            prompt: normalizedPrompt,
            password: MessageUtils.isPasswordPrompt(data),
        };

        return {
            message: chatMessage,
            requestId: data.request_id,
        };
    }
}

/**
 * Using auto reply handler processes messages indicating the use of an auto reply.
 * It constructs a WaldiezChatMessage object with a predefined message.
 */
export class UsingAutoReplyHandler implements MessageHandler {
    canHandle(type: string): boolean {
        return type === "using_auto_reply";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || data.type !== "using_auto_reply") {
            return undefined;
        }
        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: "Using auto reply",
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };
        return { message };
    }
}
