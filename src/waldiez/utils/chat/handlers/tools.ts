/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { WaldiezChatMessage } from "@waldiez/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

/**
 * Tool call handler processes tool call messages.
 * It validates the message structure and extracts tool function names.
 * If valid, it constructs a WaldiezChatMessage object with the tool call content.
 */
export class WaldiezChatToolCallHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "tool_call";
    }

    static isValidToolCall(data: any): boolean {
        if (!data || typeof data !== "object") {
            return false;
        }
        if (data.type !== "tool_call") {
            return false;
        }
        return !(!data.content || typeof data.content !== "object");
    }
    static extractToolFunctionNames(data: any): string[] {
        if (data.content.tool_calls && Array.isArray(data.content.tool_calls)) {
            return data.content.tool_calls
                .filter((call: any) => call.function && typeof call.function.name === "string")
                .map((call: any) => call.function.name);
        }
        return [];
    }
    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatToolCallHandler.isValidToolCall(data)) {
            return undefined;
        }
        let text = "Tool call";
        const toolCalls = WaldiezChatToolCallHandler.extractToolFunctionNames(data);
        if (toolCalls.length > 0) {
            text += `: ${toolCalls.join(", ")}`;
        }
        const message: WaldiezChatMessage = {
            id: data.content.uuid ?? nanoid(),
            timestamp: new Date().toISOString(),
            type: "tool_call",
            content: [
                {
                    type: "text",
                    text,
                },
            ],
            sender: data.content.sender,
            recipient: data.content.recipient,
        };
        return { message };
    }
}

/**
 * Tool response handler processes tool response messages.
 * It validates the message structure and extracts tool responses.
 * If valid, it constructs a WaldiezChatMessage object with the tool response content.
 */
export class WaldiezChatToolResponseHandler implements WaldiezChatMessageHandler {
    canHandle(type: string): boolean {
        return type === "tool_response";
    }
    static isValidToolResponse(data: any): boolean {
        if (!data || typeof data !== "object") {
            return false;
        }
        if (data.type !== "tool_response") {
            return false;
        }
        if (!data.content || typeof data.content !== "object") {
            return false;
        }
        return Array.isArray(data.content.tool_responses);
    }

    handle(data: any): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatToolResponseHandler.isValidToolResponse(data)) {
            return undefined;
        }

        const toolResponses = data.content.tool_responses.map((response: any) => ({
            tool_call_id: response.tool_call_id,
            role: response.role,
            content: response.content,
        }));

        const message: WaldiezChatMessage = {
            id: data.content.uuid ?? nanoid(),
            timestamp: new Date().toISOString(),
            type: "tool_response",
            content: data.content.content,
            sender: data.content.sender,
            recipient: data.content.recipient,
            tool_responses: toolResponses,
        };

        return { message };
    }
}
