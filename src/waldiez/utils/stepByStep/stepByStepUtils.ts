/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

export class WaldiezStepByStepUtils {
    /**
     * Extract participants (sender/recipient) from an event
     */
    // eslint-disable-next-line complexity, max-statements
    static extractEventParticipants(event: Record<string, unknown>): {
        sender?: string;
        recipient?: string;
        eventType?: string;
    } {
        let sender: string | undefined;
        let recipient: string | undefined;
        let eventType: string | undefined;

        // Direct sender/recipient properties
        if (typeof event.sender === "string") {
            sender = event.sender;
        }
        if (typeof event.recipient === "string") {
            recipient = event.recipient;
        }
        if (typeof event.type === "string") {
            eventType = event.type;
        }

        // Check nested event object
        if (event.event && typeof event.event === "object") {
            const nestedEvent = event.event as Record<string, unknown>;
            if (typeof nestedEvent.sender === "string") {
                sender = nestedEvent.sender;
            }
            if (typeof nestedEvent.recipient === "string") {
                recipient = nestedEvent.recipient;
            }
            if (typeof nestedEvent.type === "string") {
                eventType = nestedEvent.type;
            }
        }

        // Check data object
        if (event.data && typeof event.data === "object") {
            const dataEvent = event.data as Record<string, unknown>;
            if (typeof dataEvent.sender === "string") {
                sender = dataEvent.sender;
            }
            if (typeof dataEvent.recipient === "string") {
                recipient = dataEvent.recipient;
            }
            if (typeof dataEvent.type === "string") {
                eventType = eventType || dataEvent.type;
            }
        }

        // Check content object
        if (event.content && typeof event.content === "object") {
            const contentEvent = event.content as Record<string, unknown>;
            if (typeof contentEvent.sender === "string") {
                sender = contentEvent.sender;
            }
            if (typeof contentEvent.recipient === "string") {
                recipient = contentEvent.recipient;
            }
            if (typeof contentEvent.type === "string") {
                eventType = eventType || contentEvent.type;
            }
            // group_chat_run_chat: { content: { speaker : "_Group_Tool_Executor"}}
            if (typeof contentEvent.speaker === "string") {
                sender = contentEvent.speaker;
            }
        }

        // Extract from message content if available
        if (event.message && typeof event.message === "object") {
            const messageEvent = event.message as Record<string, unknown>;
            if (typeof messageEvent.sender === "string") {
                sender = messageEvent.sender;
            }
            if (typeof messageEvent.recipient === "string") {
                recipient = messageEvent.recipient;
            }
        }

        return {
            sender: typeof sender === "string" ? sender : undefined,
            recipient: typeof recipient === "string" ? recipient : undefined,
            eventType: typeof eventType === "string" ? eventType : undefined,
        };
    }

    /**
     * Format event content for display (truncate if too long)
     */
    static formatEventContent(event: Record<string, unknown>, maxLength: number = 100): string {
        const content = event.content;
        if (typeof content === "string") {
            return content.length > maxLength ? `${content.substring(0, maxLength)}...` : content;
        }
        if (content && typeof content === "object") {
            const jsonStr = JSON.stringify(content);
            return jsonStr.length > maxLength ? `${jsonStr.substring(0, maxLength)}...` : jsonStr;
        }
        return "";
    }
    /**
     * Extract workflow end reason from debug_print content
     */
    static extractWorkflowEndReason(content: string): "completed" | "user_stopped" | "error" | "unknown" {
        const contentLower = content.toLowerCase();
        if (contentLower.includes("workflow finished")) {
            return "completed";
        }
        if (contentLower.includes("stopped by user")) {
            return "user_stopped";
        }
        if (contentLower.includes("execution failed")) {
            return "error";
        }
        return "unknown";
    }
    /**
     * Create a response for debug control commands
     */
    static createControlResponse(
        requestId: string,
        command: string,
    ): {
        type: "debug_input_response";
        request_id: string;
        data: string;
    } {
        return {
            type: "debug_input_response",
            request_id: requestId,
            data: command,
        };
    }
}
