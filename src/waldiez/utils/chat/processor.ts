/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import stripAnsi from "strip-ansi";

import {
    CodeExecutionReplyHandler,
    GroupChatRunHandler,
    InputRequestHandler,
    PrintMessageHandler,
    SpeakerSelectionHandler,
    TerminationHandler,
    TextMessageHandler,
} from "@waldiez/utils/chat/handlers";
import {
    IBaseMessageData,
    IMessageHandler,
    IMessageProcessingContext,
    IProcessResult,
} from "@waldiez/utils/chat/types";

/**
 * Chat message processor for Waldiez
 */
export class WaldiezChatMessageProcessor {
    private readonly handlers: IMessageHandler[];

    constructor() {
        this.handlers = [
            new InputRequestHandler(),
            new PrintMessageHandler(),
            new TextMessageHandler(),
            new TerminationHandler(),
            new GroupChatRunHandler(),
            new SpeakerSelectionHandler(),
            new CodeExecutionReplyHandler(),
        ];
    }

    /**
     * Process a raw message and return the result
     * @param rawMessage - The raw message to process
     * @param requestId - Optional request ID
     * @param imageUrl - Optional image URL to replace placeholders
     * @returns The result of processing or undefined
     */
    public process(
        rawMessage: string,
        requestId?: string | null,
        imageUrl?: string,
    ): IProcessResult | undefined {
        // Remove ANSI escape sequences
        const message = stripAnsi(rawMessage);

        // Parse JSON data
        const data = this.parseMessage(message);
        if (!data) {
            return undefined;
        }

        // Find appropriate handler
        const handler = this.findHandler(data.type);
        if (!handler) {
            return undefined;
        }

        // Process message with context
        const context: IMessageProcessingContext = { requestId, imageUrl };
        return handler.handle(data, context);
    }

    private parseMessage(message: string): IBaseMessageData | null {
        try {
            return JSON.parse(message);
        } catch {
            // Ignore JSON parse error (we might spam with pre-start prints)
            return null;
        }
    }

    private findHandler(type: string): IMessageHandler | undefined {
        return this.handlers.find(handler => handler.canHandle(type));
    }
}
