/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import { WaldiezChatMessage } from "@waldiez/types";
import { MessageValidator } from "@waldiez/utils/chat/base";
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

/**
 * Termination handler processes termination messages.
 * It validates the message structure and extracts the termination reason.
 * If valid, it constructs a WaldiezChatMessage object with the termination reason.
 */
export class TerminationHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "termination";
    }

    /**
     * Handles the termination message.
     * Validates the message data and extracts the termination reason.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidTerminationMessage(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: data.content.termination_reason,
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
export class TerminationAndHumanReplyNoInputHandler implements MessageHandler {
    canHandle(type: string): boolean {
        return type === "termination_and_human_reply_no_input";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || data.type !== "termination_and_human_reply_no_input") {
            return undefined;
        }
        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: "Termination and human reply without input",
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };
        return { message };
    }
}
