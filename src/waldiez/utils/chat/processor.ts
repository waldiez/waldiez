/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import stripAnsi from "strip-ansi";

import {
    CodeExecutionReplyHandler,
    ErrorHandler,
    ExecutedFunctionHandler,
    GroupChatRunHandler,
    InputRequestHandler,
    ParticipantsHandler,
    PrintMessageHandler,
    RunCompletionHandler,
    SpeakerSelectionHandler,
    TerminationAndHumanReplyNoInputHandler,
    TerminationHandler,
    TextMessageHandler,
    TimelineDataHandler,
    ToolCallHandler,
    ToolResponseHandler,
    UsingAutoReplyHandler,
} from "@waldiez/utils/chat/handlers";
import type {
    BaseMessageData,
    MessageHandler,
    MessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

export class WaldiezChatMessageProcessor {
    private static _handlers: MessageHandler[] | null = null;
    private static get handlers(): MessageHandler[] {
        if (!this._handlers) {
            this._handlers = [
                new InputRequestHandler(),
                new ParticipantsHandler(),
                new PrintMessageHandler(),
                new TextMessageHandler(),
                new TerminationHandler(),
                new GroupChatRunHandler(),
                new SpeakerSelectionHandler(),
                new CodeExecutionReplyHandler(),
                new ToolCallHandler(),
                new TerminationAndHumanReplyNoInputHandler(),
                new UsingAutoReplyHandler(),
                new TimelineDataHandler(),
                new RunCompletionHandler(),
                new ToolResponseHandler(),
                new ExecutedFunctionHandler(),
                new ErrorHandler(),
            ];
        }
        return this._handlers;
    }

    /**
     * Process a raw message and return the result
     * @param rawMessage - The raw message to process
     * @param requestId - Optional request ID for the message
     * @param imageUrl - Optional image URL associated with the message
     */
    static process(
        rawMessage: any,
        requestId?: string | null,
        imageUrl?: string,
    ): WaldiezChatMessageProcessingResult | undefined {
        if (!rawMessage) {
            return undefined;
        }
        let message = rawMessage;
        if (typeof rawMessage === "string") {
            message = stripAnsi(rawMessage.replace("\n", "")).trim();
        }
        const data = WaldiezChatMessageProcessor.parseMessage(message);
        if (!data) {
            return WaldiezChatMessageProcessor.findHandler("print", data)?.handle(message, {
                requestId,
                imageUrl,
            });
        }
        const handler = WaldiezChatMessageProcessor.findHandler(data.type, data);
        if (!handler) {
            return undefined;
        }

        const context: MessageProcessingContext = { requestId, imageUrl };
        return handler.handle(data, context);
    }
    /**
     * Parses a raw message string into a BaseMessageData object.
     * Returns null if the message cannot be parsed.
     * @param message - The raw message string to parse
     * @returns BaseMessageData | null
     */
    private static parseMessage(message: any): BaseMessageData | null {
        if (typeof message === "object") {
            return message;
        }
        try {
            return JSON.parse(message);
        } catch {
            return null;
        }
    }

    /**
     * Finds a handler that can process the given message type.
     * @param type - The type of the message to find a handler for
     * @returns MessageHandler | undefined
     */
    private static findHandler(type: string, data: any): MessageHandler | undefined {
        const handler = this.handlers.find(handler => handler.canHandle(type));
        if ((data && data.type === "print") || type === "print") {
            if (TimelineDataHandler.isTimelineMessage(data)) {
                return WaldiezChatMessageProcessor.handlers.find(h => h instanceof TimelineDataHandler);
            }
            if (data && data.participants && ParticipantsHandler.isValidParticipantsData(data)) {
                return WaldiezChatMessageProcessor.handlers.find(h => h instanceof ParticipantsHandler);
            }
            if (
                data &&
                data.data &&
                data.data.participants &&
                ParticipantsHandler.isValidParticipantsData(data.data)
            ) {
                return WaldiezChatMessageProcessor.handlers.find(h => h instanceof ParticipantsHandler);
            }
        }
        if (data && data.participants) {
            if (ParticipantsHandler.isValidParticipantsData(data)) {
                return WaldiezChatMessageProcessor.handlers.find(h => h instanceof ParticipantsHandler);
            }
        }
        return handler;
    }
}
