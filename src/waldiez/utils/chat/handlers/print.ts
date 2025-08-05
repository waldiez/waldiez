/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import {
    MessageHandler,
    ParticipantsData,
    PrintMessageData,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

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
        /* c8 ignore next 3 */
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
    static isValidPrintMessage(message: any): message is PrintMessageData {
        if (!message || typeof message !== "object") {
            return false;
        }
        /* c8 ignore next 6 */
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
        /* c8 ignore next 3 */
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
     * Validates if the provided data is a valid participants data.
     * @param data - The data to validate.
     * @returns True if the data is a valid participants data, false otherwise.
     */
    static isValidParticipantsData(data: any): data is ParticipantsData {
        // {"id": "861880b3021a494abc79d231c65def35", "type": "print",
        // "timestamp": "2025-06-11T10:43:50.664895", "data":
        // "{\"participants\":[
        //      {\"name\":\"user\",\"humanInputMode\":\"ALWAYS\",\"agentType\":\"user_proxy\"},
        //      {\"name\":\"assistant_1\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"},
        //      {\"name\":\"assistant_2\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"},
        //      {\"name\":\"assistant_3\",\"humanInputMode\":\"NEVER\",\"agentType\":\"assistant\"}
        // ]}"}
        if (
            data &&
            typeof data === "object" &&
            Array.isArray(data.participants) &&
            data.participants.length > 0 &&
            data.participants.every((p: any) => p && typeof p.name === "string")
        ) {
            return true;
        }
        if (data && typeof data === "string") {
            try {
                const parsedData = JSON.parse(data);
                return PrintMessageHandler.isValidParticipantsData(parsedData);
                /* c8 ignore next 3 */
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * Validates if the provided data is a valid timeline message.
     * @param data - The data to validate.
     * @returns True if the data is a valid timeline message, false otherwise.
     */
    static isTimelineMessage(data: any): boolean {
        return Boolean(
            data.type === "timeline" ||
                /* c8 ignore next 9 */
                (data.type === "print" &&
                    "data" in data &&
                    data.data &&
                    typeof data.data === "object" &&
                    "type" in data.data &&
                    data.data.type === "timeline" &&
                    "content" in data.data &&
                    data.data.content &&
                    typeof data.data.content === "object"),
        );
    }

    /**
     * Handles the print message.
     * Validates the message data, checks for workflow end markers, and extracts participants if present.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing participants or indicating workflow end, or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!PrintMessageHandler.isValidPrintMessage(data)) {
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

            if (PrintMessageHandler.isValidParticipantsData(parsedData)) {
                if (typeof parsedData === "string") {
                    try {
                        const innerDumped = JSON.parse(parsedData);
                        return this.extractParticipants(innerDumped);
                        //* c8 ignore next 3 */
                    } catch (_) {
                        return undefined;
                    }
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
