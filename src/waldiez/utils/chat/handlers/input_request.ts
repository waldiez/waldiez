/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatInputRequestData, WaldiezChatMessage } from "@waldiez/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import { MessageUtils } from "@waldiez/utils/chat/utils";

/**
 * Input request handler processes input request messages.
 * It validates the message structure and normalizes the prompt.
 * If valid, it creates a WaldiezChatMessage object with the request ID and normalized prompt.
 */
export class WaldiezChatInputRequestHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "input_request";
    }

    /**
     * Validates if the provided data is a valid input request message.
     * @param data - The data to validate.
     * @returns True if the data is a valid input request, false otherwise.
     */
    static isValidInputRequest(data: any): data is WaldiezChatInputRequestData {
        if (!data || typeof data !== "object") {
            return false;
        }
        if (data.type !== "input_request") {
            return false;
        }
        if (typeof data.request_id !== "string" || data.request_id.trim() === "") {
            return false;
        }
        return typeof data.prompt === "string";
    }

    /**
     * Handles the input request message.
     * Validates the message data, normalizes the prompt, and constructs a WaldiezChatMessage object.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(
        data: any,
        context: WaldiezChatMessageProcessingContext,
    ): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatInputRequestHandler.isValidInputRequest(data)) {
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
export class WaldiezChatUsingAutoReplyHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "using_auto_reply";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        /* c8 ignore next 3 */
        if (!data || typeof data !== "object" || data.type !== "using_auto_reply") {
            return undefined;
        }
        const message: WaldiezChatMessage = {
            /* c8 ignore next */
            id: data.content?.uuid || nanoid(),
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: "Using auto reply",
                },
            ],
            /* c8 ignore next */
            sender: data.content?.sender,
            /* c8 ignore next */
            recipient: data.content?.recipient,
        };
        return { message };
    }
}
