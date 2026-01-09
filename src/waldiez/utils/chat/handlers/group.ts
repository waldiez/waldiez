/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type {
    WaldiezChatGroupChatRunData,
    WaldiezChatMessage,
    WaldiezChatMessageProcessingContext,
    WaldiezChatSpeakerSelectionData,
} from "@waldiez/types";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import { WaldiezChatMessageUtils } from "@waldiez/utils/chat/utils";

/**
 * Group chat run handler processes group chat run messages.
 * It validates the message structure and constructs a WaldiezChatMessage object with a system message.
 * If valid, it returns the processed message.
 */
export class WaldiezChatGroupChatRunHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "group_chat_run_chat";
    }
    /**
     * Validates if the provided data is a valid group chat run message.
     * @param data - The data to validate.
     * @returns True if the data is a valid group chat run message, false otherwise.
     */
    static isValidGroupChatRun(data: any): data is WaldiezChatGroupChatRunData {
        return Boolean(
            data &&
            typeof data === "object" &&
            data.type === "group_chat_run_chat" &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.uuid === "string" &&
            typeof data.content.speaker === "string",
        );
    }

    /**
     * Handles the group chat run message.
     * Validates the message data and constructs a WaldiezChatMessage object with a system message.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatGroupChatRunHandler.isValidGroupChatRun(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "group_chat_run_chat",
            content: [
                {
                    type: "text",
                    text: MESSAGE_CONSTANTS.SYSTEM_MESSAGES.GROUP_CHAT_RUN,
                },
            ],
            sender: data.content.speaker,
        };

        return { message };
    }
}

/**
 * Speaker selection handler processes speaker selection messages.
 * It validates the message structure and generates a markdown representation of the speaker selection.
 * If valid, it constructs a WaldiezChatMessage object with the speaker selection content.
 */
export class WaldiezChatSpeakerSelectionHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "select_speaker" || type === "select_speaker_invalid_input";
    }

    /**
     * Validates if the provided data is a valid speaker selection message.
     * @param data - The data to validate.
     * @returns True if the data is a valid speaker selection message, false otherwise.
     */
    static isValidSpeakerSelection(data: any): data is WaldiezChatSpeakerSelectionData {
        return Boolean(
            data &&
            typeof data === "object" &&
            (data.type === "select_speaker" || data.type === "select_speaker_invalid_input") &&
            data.content &&
            typeof data.content === "object" &&
            typeof data.content.uuid === "string" &&
            Array.isArray(data.content.agents) &&
            data.content.agents.every((agent: any) => typeof agent === "string"),
        );
    }

    /**
     * Handles the speaker selection message.
     * Validates the message data and generates a markdown representation of the speaker selection.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatSpeakerSelectionHandler.isValidSpeakerSelection(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "select_speaker",
            content: [
                {
                    type: "text",
                    text: WaldiezChatMessageUtils.generateSpeakerSelectionMarkdown(data.content.agents),
                },
            ],
        };

        return { message };
    }
}
/**
 * Group chat run handler processes group chat run messages.
 * It validates the message structure and constructs a WaldiezChatMessage object with a system message.
 * If valid, it returns the processed message.
 */
export class WaldiezChatGroupChatResumeHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "group_chat_resume";
    }
    handle(
        data: any,
        _context: WaldiezChatMessageProcessingContext,
    ): WaldiezChatMessageProcessingResult | undefined {
        return {
            message: {
                type: "group_chat_resume",
                id: data.content?.uuid ?? nanoid(),
                timestamp: new Date().toISOString(),
                content: "Resume chat",
                sender: data.content?.sender,
                recipient: data.content?.recipient,
            },
        };
    }
}
