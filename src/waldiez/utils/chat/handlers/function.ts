/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatMessage } from "@waldiez/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

/**
 * Executed function handler processes messages indicating a function has been executed.
 * It validates the message structure and constructs a WaldiezChatMessage object with the executed function content.
 */
export class WaldiezChatExecuteFunctionHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "execute_function";
    }
    // type ExecuteFunctionContent = { func_name: string; recipient: string; arguments?: unknown };
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || data.type !== "execute_function") {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid ?? nanoid(),
            timestamp: new Date().toISOString(),
            type: "execute_function",
            content: [
                {
                    type: "text",
                    text: `Execute function: ${data.content.func_name}`,
                },
                {
                    type: "text",
                    text: `Arguments: ${data.content.arguments}`,
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };

        return { message };
    }
}

/**
 * Executed function handler processes messages indicating a function has been executed.
 * It validates the message structure and constructs a WaldiezChatMessage object with the executed function content.
 */
export class WaldiezChatExecutedFunctionHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "executed_function";
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!data || typeof data !== "object" || data.type !== "executed_function") {
            return undefined;
        }

        const message: WaldiezChatMessage = {
            id: data.content.uuid ?? nanoid(),
            timestamp: new Date().toISOString(),
            type: "executed_function",
            content: [
                {
                    type: "text",
                    text: `Executed function: ${data.content.func_name}`,
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };

        return { message };
    }
}
