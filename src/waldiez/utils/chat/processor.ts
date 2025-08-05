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
import {
    BaseMessageData,
    MessageHandler,
    MessageProcessingContext,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

export class WaldiezChatMessageProcessor {
    private static readonly handlers: MessageHandler[] = [
        new InputRequestHandler(),
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

    /**
     * Process a raw message and return the result
     * @param rawMessage - The raw message string to process
     * @param requestId - Optional request ID for the message
     * @param imageUrl - Optional image URL associated with the message
     */
    static process(
        rawMessage: string | undefined | null,
        requestId?: string | null,
        imageUrl?: string,
    ): WaldiezChatMessageProcessingResult | undefined {
        if (!rawMessage) {
            return undefined;
        }
        const message = stripAnsi(rawMessage.replace("\n", "")).trim();

        let data = WaldiezChatMessageProcessor.parseMessage(message);
        if (!data) {
            return WaldiezChatMessageProcessor.findHandler("print")?.handle(message, {
                requestId,
                imageUrl,
            });
        }

        let handler = WaldiezChatMessageProcessor.findHandler(data.type);
        if (data.type === "print") {
            if (PrintMessageHandler.isTimelineMessage(data)) {
                data = (data as any)?.data as any;
                handler = WaldiezChatMessageProcessor.handlers.find(h => h instanceof TimelineDataHandler);
            }
        }
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
    private static parseMessage(message: string): BaseMessageData | null {
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
    private static findHandler(type: string): MessageHandler | undefined {
        return this.handlers.find(handler => handler.canHandle(type));
    }
}
