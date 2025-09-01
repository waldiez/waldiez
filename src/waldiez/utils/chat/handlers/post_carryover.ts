/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

export class WaldiezChatPostCarryoverHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "post_carryover_processing";
    }

    static isValidPostCarryoverMessage(data: any) {
        return Boolean(data && typeof data === "object" && "sender" in data && "recipient" in data);
    }

    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatPostCarryoverHandler.isValidPostCarryoverMessage(data)) {
            return undefined;
        }
        return {
            message: {
                type: "post_carryover_processing",
                id: data.uuid ?? nanoid(),
                timestamp: new Date().toISOString(),
                content: "Using auto reply",
                sender: data.sender,
                recipient: data.recipient,
            },
        };
    }
}
