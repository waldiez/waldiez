/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import stripAnsi from "strip-ansi";

import {
    WaldiezChatCodeExecutionReplyHandler,
    WaldiezChatErrorHandler,
    WaldiezChatExecuteFunctionHandler,
    WaldiezChatExecutedFunctionHandler,
    WaldiezChatGroupChatResumeHandler,
    WaldiezChatGroupChatRunHandler,
    WaldiezChatInputRequestHandler,
    WaldiezChatParticipantsHandler,
    WaldiezChatPrintMessageHandler,
    WaldiezChatRunCompletionHandler,
    WaldiezChatSpeakerSelectionHandler,
    WaldiezChatTerminationAndHumanReplyNoInputHandler,
    WaldiezChatTerminationHandler,
    WaldiezChatTextMessageHandler,
    WaldiezChatTimelineDataHandler,
    WaldiezChatToolCallHandler,
    WaldiezChatToolResponseHandler,
    WaldiezChatUsingAutoReplyHandler,
} from "@waldiez/utils/chat/handlers";
import type {
    WaldiezChatBaseMessageData,
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

export class WaldiezChatMessageProcessor {
    private static _handlers: WaldiezChatMessageHandler[] | null = null;
    private static get handlers(): WaldiezChatMessageHandler[] {
        if (!this._handlers) {
            this._handlers = [
                new WaldiezChatInputRequestHandler(),
                new WaldiezChatParticipantsHandler(),
                new WaldiezChatPrintMessageHandler(),
                new WaldiezChatTextMessageHandler(),
                new WaldiezChatTerminationHandler(),
                new WaldiezChatGroupChatRunHandler(),
                new WaldiezChatGroupChatResumeHandler(),
                new WaldiezChatSpeakerSelectionHandler(),
                new WaldiezChatCodeExecutionReplyHandler(),
                new WaldiezChatToolCallHandler(),
                new WaldiezChatTerminationAndHumanReplyNoInputHandler(),
                new WaldiezChatUsingAutoReplyHandler(),
                new WaldiezChatRunCompletionHandler(),
                new WaldiezChatToolResponseHandler(),
                new WaldiezChatExecuteFunctionHandler(),
                new WaldiezChatExecutedFunctionHandler(),
                new WaldiezChatTimelineDataHandler(),
                new WaldiezChatErrorHandler(),
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

        const context: WaldiezChatMessageProcessingContext = { requestId, imageUrl };
        return handler.handle(data, context);
    }
    /**
     * Parses a raw message string into a BaseMessageData object.
     * Returns null if the message cannot be parsed.
     * @param message - The raw message string to parse
     * @returns WaldiezChatBaseMessageData | null
     */
    private static parseMessage(message: any): WaldiezChatBaseMessageData | null {
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
     * @returns WaldiezChatMessageHandler | undefined
     */
    static findHandler(type: string, data: any): WaldiezChatMessageHandler | undefined {
        const handler = this.handlers.find(handler => handler.canHandle(type));
        if ((data && data.type === "print") || type === "print") {
            if (WaldiezChatTimelineDataHandler.isTimelineMessage(data)) {
                return WaldiezChatMessageProcessor.handlers.find(
                    h => h instanceof WaldiezChatTimelineDataHandler,
                );
            }
            if (data && data.participants && WaldiezChatParticipantsHandler.isValidParticipantsData(data)) {
                return WaldiezChatMessageProcessor.handlers.find(
                    h => h instanceof WaldiezChatParticipantsHandler,
                );
            }
            if (
                data &&
                data.data &&
                data.data.participants &&
                WaldiezChatParticipantsHandler.isValidParticipantsData(data.data)
            ) {
                return WaldiezChatMessageProcessor.handlers.find(
                    h => h instanceof WaldiezChatParticipantsHandler,
                );
            }
        }
        if (data && data.participants) {
            if (WaldiezChatParticipantsHandler.isValidParticipantsData(data)) {
                return WaldiezChatMessageProcessor.handlers.find(
                    h => h instanceof WaldiezChatParticipantsHandler,
                );
            }
        }
        return handler;
    }
}
