/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezChatMessage } from "@waldiez/components/chatUI/types";
import type {
    WaldiezChatInputRequestData,
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import { WaldiezChatMessageUtils } from "@waldiez/utils/chat/utils";

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
        const normalizedPrompt = WaldiezChatMessageUtils.normalizePrompt(data.prompt);
        const chatMessage: WaldiezChatMessage = {
            id: data.request_id,
            timestamp: WaldiezChatMessageUtils.generateTimestamp(data),
            request_id: context.requestId || data.request_id,
            type: "input_request",
            content: [
                {
                    type: "text",
                    text: normalizedPrompt,
                },
            ],
            prompt: normalizedPrompt,
            password: WaldiezChatMessageUtils.isPasswordPrompt(data),
        };

        return {
            message: chatMessage,
            requestId: data.request_id,
        };
    }
}
