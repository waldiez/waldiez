/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingContext,
    WaldiezChatMessageProcessingResult,
    WaldiezChatParticipantsData,
} from "@waldiez/utils/chat/types";

export class WaldiezChatParticipantsHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "participants";
    }

    /**
     * Validates if the provided data is a valid participants data.
     * @param data - The data to validate.
     * @returns True if the data is a valid participants data, false otherwise.
     */
    static isValidParticipantsData(data: any): data is WaldiezChatParticipantsData {
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
                return WaldiezChatParticipantsHandler.isValidParticipantsData(parsedData);
                /* c8 ignore next 3 -- @preserve */
            } catch {
                return false;
            }
        }
        return false;
    }

    /**
     * Extracts participants from the data content.
     * If valid participants data is found, it returns a WaldiezChatMessageProcessingResult with participants.
     * If the data is a string, it attempts to parse it as JSON.
     * @param dataContent - The content from which to extract participants.
     * @returns A WaldiezChatMessageProcessingResult with participants or undefined if not found or invalid.
     */
    static extractParticipants(dataContent: string | object): WaldiezChatMessageProcessingResult | undefined {
        try {
            const parsedData = typeof dataContent === "string" ? JSON.parse(dataContent) : dataContent;

            if (WaldiezChatParticipantsHandler.isValidParticipantsData(parsedData)) {
                if (typeof parsedData === "string") {
                    try {
                        const innerDumped = JSON.parse(parsedData);
                        return this.extractParticipants(innerDumped);
                        /* c8 ignore next 3 -- @preserve */
                    } catch (_) {
                        return undefined;
                    }
                }
                const allParticipants = parsedData.participants
                    .map((p: any) => ({
                        name: p.name,
                        id: p.id || p.name,
                        isUser: p.humanInputMode?.toUpperCase() === "ALWAYS",
                    }))
                    .filter(Boolean);
                return {
                    isWorkflowEnd: false,
                    participants: allParticipants,
                };
            }
        } catch (error) {
            console.error("Failed to parse participants data:", error);
        }

        return undefined;
    }

    handle(
        data: any,
        _context: WaldiezChatMessageProcessingContext,
    ): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatParticipantsHandler.isValidParticipantsData(data)) {
            if (data.data && WaldiezChatParticipantsHandler.isValidParticipantsData(data.data)) {
                return WaldiezChatParticipantsHandler.extractParticipants(data.data);
            }
            return undefined;
        }
        return WaldiezChatParticipantsHandler.extractParticipants(data);
    }
}
