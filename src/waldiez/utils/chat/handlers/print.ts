/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { WaldiezChatParticipantsHandler } from "@waldiez/utils/chat/handlers/participants";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
    WaldiezChatPrintMessageData,
} from "@waldiez/utils/chat/types";

/**
 * Print message handler processes print messages.
 * It validates the message structure, checks for workflow end markers, and extracts participants if present.
 * If valid, it returns a WaldiezChatMessageProcessingResult with participants or indicates workflow end.
 */
export class WaldiezChatPrintMessageHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "print";
    }

    isEndOfWorkflow(message: any): boolean {
        if (typeof message === "string") {
            return MESSAGE_CONSTANTS.WORKFLOW_END_MARKERS.some(marker => message.includes(marker));
        }
        /* c8 ignore next 3 -- @preserve */
        if (typeof message !== "object" && !message.content && !message.data) {
            return false;
        }
        const dataContent = "data" in message ? message.data : message.content;
        const stringContent = typeof dataContent === "string" ? dataContent : JSON.stringify(dataContent);
        if (!stringContent) {
            return false;
        }
        return MESSAGE_CONSTANTS.WORKFLOW_END_MARKERS.some(marker => stringContent.includes(marker));
    }

    /**
     * Validates if the provided data is a valid print message.
     * @param message - The message data to validate.
     * @returns True if the message is a valid print message, false otherwise.
     */
    static isValidPrintMessage(message: any): message is WaldiezChatPrintMessageData {
        if (!message || typeof message !== "object") {
            return false;
        }
        /* c8 ignore next 6 -- @preserve */
        if (typeof message.type !== "string" || message.type !== "print") {
            return false;
        }
        if ("data" in message && (typeof message.data === "string" || typeof message.data === "object")) {
            message.content = { data: message.data };
            return true;
        }
        if (!message.content || typeof message.content !== "object") {
            return false;
        }
        /* c8 ignore next 3 -- @preserve */
        if (!message.content.data) {
            return false;
        }
        return Boolean(
            typeof message.content.data === "string" ||
            Array.isArray(message.content.data) ||
            typeof message.content.data === "object",
        );
    }

    /**
     * Handles the print message.
     * Validates the message data, checks for workflow end markers, and extracts participants if present.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing participants or indicating workflow end, or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatPrintMessageHandler.isValidPrintMessage(data)) {
            if (this.isEndOfWorkflow(data)) {
                return { isWorkflowEnd: true, message: data };
            }
            return undefined;
        }

        if (this.isEndOfWorkflow(data.content)) {
            return { isWorkflowEnd: true };
        }

        const dataContent = data.content.data;

        // Check for participants
        if (typeof dataContent === "string" && dataContent.includes(MESSAGE_CONSTANTS.PARTICIPANTS_KEY)) {
            return WaldiezChatParticipantsHandler.extractParticipants(dataContent);
        }
        if (typeof dataContent === "object" && dataContent !== null) {
            return WaldiezChatParticipantsHandler.extractParticipants(dataContent);
        }

        return undefined;
    }
}
