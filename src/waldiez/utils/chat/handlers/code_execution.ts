/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatCodeExecutionReplyData, WaldiezChatMessage } from "@waldiez/types";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

/**
 * Code execution reply handler processes code execution reply messages.
 * It validates the message structure and constructs a WaldiezChatMessage object with the code execution reply content.
 * If valid, it returns the processed message.
 */
export class WaldiezChatCodeExecutionReplyHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "generate_code_execution_reply";
    }

    /**
     * Validates if the provided data is a valid code execution reply message.
     * @param data - The data to validate.
     * @returns True if the data is a valid code execution reply message, false otherwise.
     */
    static isValidCodeExecutionReply(data: any): data is WaldiezChatCodeExecutionReplyData {
        /* c8 ignore next 9 */
        if (!data || typeof data !== "object") {
            return false;
        }
        if (data.type !== "generate_code_execution_reply") {
            return false;
        }
        if (!data.content || typeof data.content !== "object") {
            return false;
        }
        return Boolean(
            typeof data.content.uuid === "string" &&
                typeof data.content.sender === "string" &&
                typeof data.content.recipient === "string",
        );
    }
    /**
     * Handles the code execution reply message.
     * Validates the message data and constructs a WaldiezChatMessage object with the code execution reply content.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatCodeExecutionReplyHandler.isValidCodeExecutionReply(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: nanoid(),
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: MESSAGE_CONSTANTS.SYSTEM_MESSAGES.CODE_EXECUTION_REPLY,
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };

        return { message };
    }
}
