/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MessageValidator } from "@waldiez/utils/chat/base";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

/**
 * Print message handler processes print messages.
 * It validates the message structure, checks for workflow end markers, and extracts participants if present.
 * If valid, it returns a WaldiezChatMessageProcessingResult with participants or indicates workflow end.
 */
export class PrintMessageHandler implements MessageHandler {
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
        if (typeof message !== "object" && !message.content && !message.data) {
            return false;
        }
        const dataContent = "data" in message ? message.data : message.content;
        const stringContent = typeof dataContent === "string" ? dataContent : JSON.stringify(dataContent);
        return MESSAGE_CONSTANTS.WORKFLOW_END_MARKERS.some(marker => stringContent.includes(marker));
    }

    /**
     * Handles the print message.
     * Validates the message data, checks for workflow end markers, and extracts participants if present.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing participants or indicating workflow end, or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidPrintMessage(data)) {
            if (this.isEndOfWorkflow(data)) {
                return { isWorkflowEnd: true };
            }
            return undefined;
        }

        if (this.isEndOfWorkflow(data.content)) {
            return { isWorkflowEnd: true };
        }

        const dataContent = data.content.data;

        // Check for participants
        if (typeof dataContent === "string" && dataContent.includes(MESSAGE_CONSTANTS.PARTICIPANTS_KEY)) {
            return this.extractParticipants(dataContent);
        }
        if (typeof dataContent === "object" && dataContent !== null) {
            return this.extractParticipants(dataContent);
        }

        return undefined;
    }

    /**
     * Extracts participants from the data content.
     * If valid participants data is found, it returns a WaldiezChatMessageProcessingResult with participants.
     * If the data is a string, it attempts to parse it as JSON.
     * @param dataContent - The content from which to extract participants.
     * @returns A WaldiezChatMessageProcessingResult with participants or undefined if not found or invalid.
     */
    private extractParticipants(
        dataContent: string | object,
    ): WaldiezChatMessageProcessingResult | undefined {
        try {
            const parsedData = typeof dataContent === "string" ? JSON.parse(dataContent) : dataContent;

            if (MessageValidator.isValidParticipantsData(parsedData)) {
                if (typeof parsedData === "string") {
                    const innerDumped = JSON.parse(parsedData);
                    return this.extractParticipants(innerDumped);
                }
                const allParticipants = parsedData.participants.map((p: any) => p.name).filter(Boolean);
                const userParticipants = parsedData.participants
                    .filter((p: any) => p.humanInputMode?.toUpperCase() === "ALWAYS")
                    .map((p: any) => p.name)
                    .filter(Boolean);
                return {
                    isWorkflowEnd: false,
                    participants: {
                        all: allParticipants,
                        users: userParticipants,
                    },
                };
            }
        } catch (error) {
            console.error("Failed to parse participants data:", error);
        }

        return undefined;
    }
}
