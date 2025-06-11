/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import { WaldiezChatMessage } from "@waldiez/types";
import { MessageValidator } from "@waldiez/utils/chat/base";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import {
    MessageHandler,
    MessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";
import { MessageUtils } from "@waldiez/utils/chat/utils";

// Individual message handlers
/**
 * Input request handler processes input request messages.
 * It validates the message structure and normalizes the prompt.
 * If valid, it creates a WaldiezChatMessage object with the request ID and normalized prompt.
 */
export class InputRequestHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "input_request";
    }

    /**
     * Handles the input request message.
     * Validates the message data, normalizes the prompt, and constructs a WaldiezChatMessage object.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidInputRequest(data)) {
            return undefined;
        }
        const normalizedPrompt = MessageUtils.normalizePrompt(data.prompt);
        const chatMessage: WaldiezChatMessage = {
            id: data.request_id,
            timestamp: MessageUtils.generateTimestamp(data),
            request_id: context.requestId || data.request_id,
            type: "input_request",
            content: [
                {
                    type: "text",
                    text: normalizedPrompt,
                },
            ],
            prompt: normalizedPrompt,
            password: MessageUtils.isPasswordPrompt(data),
        };

        return {
            message: chatMessage,
            requestId: data.request_id,
        };
    }
}

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

    /**
     * Handles the print message.
     * Validates the message data, checks for workflow end markers, and extracts participants if present.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing participants or indicating workflow end, or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidPrintMessage(data)) {
            console.warn("Invalid print message data:", data);
            return undefined;
        }

        const dataContent = data.content.data;

        // Check for workflow end
        if (typeof dataContent === "string" && dataContent.includes(MESSAGE_CONSTANTS.WORKFLOW_END_MARKER)) {
            return { isWorkflowEnd: true };
        }
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
        console.debug("Extracting participants from data content:", dataContent);
        try {
            const parsedData = typeof dataContent === "string" ? JSON.parse(dataContent) : dataContent;

            if (MessageValidator.isValidParticipantsData(parsedData)) {
                console.debug("Valid participants data found:", parsedData);
                if (typeof parsedData === "string") {
                    console.debug("Parsing participants data from string:", parsedData);
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

/**
 * Text message handler processes text and tool call messages.
 * It validates the message structure, normalizes the content, and replaces image URLs if provided.
 * If valid, it constructs a WaldiezChatMessage object with the normalized content and metadata.
 */
export class TextMessageHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return (
            type === "text" ||
            type === "tool_call" ||
            type === "termination_and_human_reply_no_input" ||
            type === "using_auto_reply"
        );
    }

    /**
     * Handles the text message.
     * Validates the message data, normalizes the content, and replaces image URLs if provided.
     * @param data - The raw message data to process.
     * @param context - The processing context containing request ID and optional image URL.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any, context: MessageProcessingContext): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidTextMessage(data)) {
            return undefined;
        }

        let content = MessageUtils.normalizeContent(data.content.content, context.imageUrl);

        if (context.imageUrl) {
            content = MessageUtils.replaceImageUrls(content, context.imageUrl);
        }

        const message: WaldiezChatMessage = {
            id: MessageUtils.generateMessageId(data),
            timestamp: MessageUtils.generateTimestamp(data),
            type: data.type,
            content,
            sender: data.content.sender,
            recipient: data.content.recipient,
        };

        return {
            message,
            requestId: null,
        };
    }
}

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

/**
 * Code execution reply handler processes code execution reply messages.
 * It validates the message structure and constructs a WaldiezChatMessage object with the code execution reply content.
 * If valid, it returns the processed message.
 */
export class CodeExecutionReplyHandler implements MessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return type === "generate_code_execution_reply";
    }

    /**
     * Handles the code execution reply message.
     * Validates the message data and constructs a WaldiezChatMessage object with the code execution reply content.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!MessageValidator.isValidCodeExecutionReply(data)) {
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
