/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatMessage } from "@waldiez/components/chatUI/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

/**
 * Using auto reply handler processes messages indicating the use of an auto reply.
 * It constructs a WaldiezChatMessage object with a predefined message.
 */
export class WaldiezChatUsingAutoReplyHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "using_auto_reply";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        /* c8 ignore next 3 */
        if (!data || typeof data !== "object" || data.type !== "using_auto_reply") {
            return undefined;
        }
        const message: WaldiezChatMessage = {
            /* c8 ignore next */
            id: data.content?.uuid || nanoid(),
            timestamp: new Date().toISOString(),
            type: "using_auto_reply",
            content: [
                {
                    type: "text",
                    text: "Using auto reply",
                },
            ],
            /* c8 ignore next */
            sender: data.content?.sender,
            /* c8 ignore next */
            recipient: data.content?.recipient,
        };
        return { message };
    }
}
