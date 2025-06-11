/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import { WaldiezChatMessage } from "@waldiez/types";
import { MessageValidator } from "@waldiez/utils/chat/base";
import { MESSAGE_CONSTANTS } from "@waldiez/utils/chat/constants";
import { IMessageHandler, IMessageProcessingContext, IProcessResult } from "@waldiez/utils/chat/types";
import { MessageUtils } from "@waldiez/utils/chat/utils";

// Individual message handlers
export class InputRequestHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "input_request";
    }

    handle(data: any, context: IMessageProcessingContext): IProcessResult | undefined {
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

export class PrintMessageHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "print";
    }

    handle(data: any): IProcessResult | undefined {
        if (!MessageValidator.isValidPrintMessage(data)) {
            console.warn("Invalid print message data:", data);
            return undefined;
        }

        const dataContent = data.content.data;

        // Check for workflow end
        if (typeof dataContent === "string" && dataContent.includes(MESSAGE_CONSTANTS.WORKFLOW_END_MARKER)) {
            return { isWorkflowEnd: true, userParticipants: [] };
        }
        // Check for participants
        if (typeof dataContent === "string" && dataContent.includes(MESSAGE_CONSTANTS.PARTICIPANTS_KEY)) {
            console.debug("Extracting participants from print message data:", dataContent);
            return this.extractParticipants(dataContent);
        }
        if (typeof dataContent === "object" && dataContent !== null) {
            console.debug("Extracting participants from print message object data:", dataContent);
            return this.extractParticipants(dataContent);
        }

        return undefined;
    }

    private extractParticipants(dataContent: string | object): IProcessResult | undefined {
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
                return {
                    isWorkflowEnd: false,
                    userParticipants: parsedData.participants.map(p => p.name),
                };
            }
        } catch (error) {
            console.error("Failed to parse participants data:", error);
        }

        return undefined;
    }
}

export class TextMessageHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "text" || type === "tool_call";
    }

    handle(data: any, context: IMessageProcessingContext): IProcessResult | undefined {
        if (!MessageValidator.isValidTextMessage(data)) {
            return undefined;
        }

        let content = MessageUtils.normalizeContent(data.content.content);

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

export class TerminationHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "termination";
    }

    handle(data: any): IProcessResult | undefined {
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

export class GroupChatRunHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "group_chat_run_chat";
    }

    handle(data: any): IProcessResult | undefined {
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

export class SpeakerSelectionHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "select_speaker" || type === "select_speaker_invalid_input";
    }

    handle(data: any): IProcessResult | undefined {
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

export class CodeExecutionReplyHandler implements IMessageHandler {
    canHandle(type: string): boolean {
        return type === "generate_code_execution_reply";
    }

    handle(data: any): IProcessResult | undefined {
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
