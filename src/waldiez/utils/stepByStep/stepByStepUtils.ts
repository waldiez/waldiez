/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

export class WaldiezStepByStepUtils {
    /**
     * Extract participants (sender/recipient) from an event
     */
    static extractEventParticipants(event: Record<string, unknown>): {
        sender?: string;
        recipient?: string;
    } {
        return {
            sender: typeof event.sender === "string" ? event.sender : undefined,
            recipient: typeof event.recipient === "string" ? event.recipient : undefined,
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
     * Check if an event is a workflow input request (different from debug control request)
     */
    static isWorkflowInputRequest(event: Record<string, unknown>): boolean {
        return event.type === "input_request";
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
     * Check if the workflow has started
     */
    static isWorkflowStart(content: string): boolean {
        return content.includes("<Waldiez step-by-step> - Starting workflow...");
    }

    /**
     * Check if a message is a step-by-step debug message
     * Works with both parsed content and raw messages
     */
    static isStepByStepMessage(content: any): boolean {
        if (!content || typeof content !== "object") {
            return false;
        }

        // Check if it's a debug message type
        return typeof content.type === "string";
    }

    /**
     * Quick check if content can be processed by step-by-step processor
     * Use this in your handleGenericMessage to route to step-by-step processor
     */
    static canProcess(content: any): boolean {
        return this.isStepByStepMessage(content);
    }

    /**
     * Extract event type from nested content structure
     */
    static extractEventType(event: Record<string, unknown>): string {
        if (typeof event.type === "string") {
            return event.type;
        }

        // Handle nested content structure
        if (event.content && typeof event.content === "object") {
            const content = event.content as Record<string, unknown>;
            if (typeof content.type === "string") {
                return content.type;
            }
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
