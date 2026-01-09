/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatMessage, WaldiezChatTerminationMessageData } from "@waldiez/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

/**
 * Termination handler processes termination messages.
 * It validates the message structure and extracts the termination reason.
 * If valid, it constructs a WaldiezChatMessage object with the termination reason.
 */
export class WaldiezChatTerminationHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "termination";
    }

    /**
     * Validates if the provided data is a valid termination message.
     * @param data - The data to validate.
     * @returns True if the data is a valid termination message, false otherwise.
     */
    static isValidTerminationMessage(data: any): data is WaldiezChatTerminationMessageData {
        return Boolean(
            (data &&
                typeof data === "object" &&
                data.type === "termination" &&
                data.content &&
                typeof data.content === "object" &&
                typeof data.content.termination_reason === "string") ||
            (data.termination_reason && typeof data.termination_reason === "string"),
        );
    }

    /**
     * Handles the termination message.
     * Validates the message data and extracts the termination reason.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatTerminationHandler.isValidTerminationMessage(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            type: "termination",
            content: [
                {
                    type: "text",
                    text:
                        data.content?.termination_reason ||
                        /* c8 ignore next -- @preserve */ data.termination_reason ||
                        /* c8 ignore next -- @preserve */ "Chat terminated",
                },
            ],
        };

        return { message };
    }
}

/**
 * Termination and human reply without input handler processes termination messages
 * that do not require any user input.
 * It constructs a WaldiezChatMessage object with a predefined message.
 */
export class WaldiezChatTerminationAndHumanReplyNoInputHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "termination_and_human_reply_no_input";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        /* c8 ignore next 3 -- @preserve */
        if (!data || typeof data !== "object" || data.type !== "termination_and_human_reply_no_input") {
            return undefined;
        }
        const message: WaldiezChatMessage = {
            id: data.content?.uuid || nanoid(),
            timestamp: new Date().toISOString(),
            type: "termination",
            content: [
                {
                    type: "text",
                    text: "Chat ended without user input",
                },
            ],
            sender: data.content?.sender,
            recipient: data.content?.recipient,
        };
        return { message };
    }
}
