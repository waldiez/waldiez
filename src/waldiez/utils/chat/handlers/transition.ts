/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { nanoid } from "nanoid";

import type { TransitionEvent, WaldiezChatMessage, WaldiezEvent } from "@waldiez/types";
import type {
    WaldiezChatMessageHandler,
    WaldiezChatMessageProcessingResult,
} from "@waldiez/utils/chat/types";

const isRecord = (v: unknown): v is Record<string, unknown> =>
    typeof v === "object" && v !== null && !Array.isArray(v);

const asString = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);

const getParticipants = (ev: WaldiezEvent) => {
    // Some events may nest sender/recipient in content; keep this defensive.
    const content = isRecord(ev.content) ? ev.content : undefined;
    const sender = asString(ev.sender) ?? (content ? asString(content.sender) : undefined);
    const recipient = asString(ev.recipient) ?? (content ? asString(content.recipient) : undefined);
    return { sender, recipient };
};

const getEventDisplay = (eventType: string) => {
    if (["on_condition_l_l_m_transition", "on_condition_llm_transition"].includes(eventType)) {
        return "LLMTransition Handoff";
    }
    if (eventType === "on_context_condition_transition") {
        return "ContextCondition Handoff";
    }
    if (eventType === "after_works_transition") {
        return "AfterWork Handoff";
    }
    if (eventType === "reply_result_transition") {
        return "ReplyResult";
    }
    return eventType;
};

const TRANSITION_EVENT_TYPES = new Set<string>([
    "on_context_condition_transition",
    "after_works_transition",
    "on_condition_llm_transition",
    "on_condition_l_l_m_transition",
    "reply_result_transition",
]);

export class WaldiezChatTransitionEventHandler implements WaldiezChatMessageHandler {
    /**
     * Determines if this handler can process the given message type.
     * @param type - The type of the message to check.
     * @returns True if this handler can process the message type, false otherwise.
     */
    canHandle(type: string): boolean {
        return TRANSITION_EVENT_TYPES.has(type);
    }

    /**
     * Validates if the provided data is a valid transition event.
     * @param data - The passed data to check
     * @returns True if this message is an expected Transition event
     */
    static isValidTransitionEvent(data: unknown): data is TransitionEvent {
        if (!isRecord(data)) {
            return false;
        }

        const type = asString(data.type);
        if (!type || !TRANSITION_EVENT_TYPES.has(type)) {
            return false;
        }

        // We accept multiple shapes, but require at least a source_agent somewhere.
        const content = isRecord(data.content) ? data.content : undefined;

        const source = (content ? asString(content.source_agent) : undefined) ?? asString(data.source_agent);

        // target is optional (we can infer from recipient), but if provided must be string
        const target =
            (content ? asString(content.transition_target) : undefined) ?? asString(data.transition_target);

        if (!source) {
            return false;
        }
        if (data.id !== undefined && typeof data.id !== "string") {
            return false;
        }
        if (target !== undefined && typeof target !== "string") {
            return false;
        }

        return true;
    }

    /**
     * Handles the transition event.
     * Validates the message data and emits a system-ish chat message with sender/recipient.
     * @param data - The raw message data to process.
     * @returns A WaldiezChatMessageProcessingResult containing the processed message or undefined if invalid.
     */
    handle(data: unknown): WaldiezChatMessageProcessingResult | undefined {
        if (!WaldiezChatTransitionEventHandler.isValidTransitionEvent(data)) {
            return undefined;
        }

        const d = data as unknown as Record<string, unknown>;
        const content = isRecord(d.content) ? d.content : undefined;

        const source = (content ? asString(content.source_agent) : undefined) ?? asString(d.source_agent);

        let target =
            (content ? asString(content.transition_target) : undefined) ?? asString(d.transition_target);

        if (!target) {
            const { recipient } = getParticipants(data as unknown as WaldiezEvent);
            target = recipient;
        }

        const message: WaldiezChatMessage = {
            id: (asString(d.id) ?? nanoid()) as string,
            timestamp: new Date().toISOString(),
            type: (asString(d.type) ?? "transition") as any,
            content: [
                {
                    type: "text",
                    text: getEventDisplay(asString(d.type) ?? "transition"),
                },
            ],
            sender: source,
            recipient: target,
        };

        return { message };
    }
}
