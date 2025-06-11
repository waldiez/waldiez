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

export class WaldiezChatMessageProcessor {
    private static readonly handlers: IMessageHandler[] = [
        new InputRequestHandler(),
        new PrintMessageHandler(),
        new TextMessageHandler(),
        new TerminationHandler(),
        new GroupChatRunHandler(),
        new SpeakerSelectionHandler(),
        new CodeExecutionReplyHandler(),
    ];

    /**
     * Process a raw message and return the result
     */
    static process(
        rawMessage: string,
        requestId?: string | null,
        imageUrl?: string,
    ): IProcessResult | undefined {
        const message = stripAnsi(rawMessage.replace("\n", "")).trim();

        const data = WaldiezChatMessageProcessor.parseMessage(message);
        if (!data) {
            return undefined;
        }

        const handler = WaldiezChatMessageProcessor.findHandler(data.type);
        if (!handler) {
            return undefined;
        }

        const context: IMessageProcessingContext = { requestId, imageUrl };
        return handler.handle(data, context);
    }

    private static parseMessage(message: string): IBaseMessageData | null {
        try {
            return JSON.parse(message);
        } catch {
            return null;
        }
    }

    private static findHandler(type: string): IMessageHandler | undefined {
        return this.handlers.find(handler => handler.canHandle(type));
    }
}
