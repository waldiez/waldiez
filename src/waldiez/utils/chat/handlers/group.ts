/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezChatMessage } from "@waldiez/types";
import { MessageValidator } from "@waldiez/utils/chat/base";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";
import { MessageUtils } from "@waldiez/utils/chat/utils";

/**
 * Group chat run handler processes group chat run messages.
 * It validates the message structure and constructs a WaldiezChatMessage object with a system message.
 * If valid, it returns the processed message.
 */
export class GroupChatRunHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "group_chat_run_chat";
    }

    /**
     * Handles the group chat run message.
     * Validates the message data and constructs a WaldiezChatMessage object with a system message.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidGroupChatRun(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "system",
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
export class SpeakerSelectionHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "select_speaker" || type === "select_speaker_invalid_input";
    }

    /**
     * Handles the speaker selection message.
     * Validates the message data and generates a markdown representation of the speaker selection.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidSpeakerSelection(data)) {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid,
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text: MessageUtils.generateSpeakerSelectionMarkdown(data.content.agents),
                },
            ],
        };

        return { message };
    }
}
