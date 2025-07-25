/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import { WaldiezChatMessage } from "@waldiez/types";
import { MessageHandler, WaldiezChatMessageProcessingResult } from "@waldiez/utils/chat/types";

/**
 * Error handler processes error messages.
 * It validates the message structure and extracts error details.
 * If valid, it constructs a WaldiezChatMessage object with the error content.
 */
export class ErrorHandler implements MessageHandler {
    canHandle(type: string): boolean {
        return type === "error";
    }

    // examples:
    //
    // {"type": "error", "content": {"uuid": "85cef408-3166-4738-bda9-c22bf921342f",
    // "error": "Error code: 529 - {'type': 'error', 'error':
    //  {'type': 'overloaded_error', 'message': 'Overloaded'}}"}}
    //
    // or:
    //
    // {"type": "error", "content":
    // {"uuid": "b50a258a-0514-4868-b814-7aa04592169c",
    // "error": "1 validation error for RunCompletionEvent\nsummary\n
    // Input should be a valid string [type=string_type, input_value={'content': '```json\\n{\"n...one, 'tool_calls': None},
    //  input_type=dict]\n    For further information visit https://errors.pydantic.dev/2.11/v/string_type"}}
    static isValidError(data: any): boolean {
        return (
            data &&
            typeof data === "object" &&
            data.type === "error" &&
            ((data.content && typeof data.content === "object") ||
                (data.error && typeof data.error === "object"))
        );
    }

    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!ErrorHandler.isValidError(data)) {
            return undefined;
        }
        const errorContent = data.content?.error || data.error;
        if (typeof errorContent !== "string") {
            return undefined;
        }
        const text = `Error: ${errorContent}`;
        const message: WaldiezChatMessage = {
            id: data.content.uuid ?? nanoid(),
            timestamp: new Date().toISOString(),
            type: "system",
            content: [
                {
                    type: "text",
                    text,
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
            error: errorContent, // Include error content in the message
        };
        return { message };
    }
}
