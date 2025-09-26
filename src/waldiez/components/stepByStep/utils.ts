/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezBreakpoint } from "@waldiez/components/stepByStep/types";

/** get event's key/id
 * @param event - The event.
 * @returns String - The event's key.
 */
export const getEventKey = (event: Record<string, unknown>) => {
    if ("id" in event && typeof event.id === "string") {
        return event.id;
    }
    if ("uuid" in event && typeof event.uuid === "string") {
        return event.uuid;
    }
    const eventType = "type" in event && typeof event.type === "string" ? `${event.type}-` : "";
    const senderString = "sender" in event && typeof event.sender === "string" ? `${event.sender}-` : "";
    const recipientString =
        "recipient" in event && typeof event.recipient === "string" ? `${event.recipient}-` : "";
    let eventId = `${eventType}${senderString}${recipientString}`;
    Object.entries(event).forEach(([key, value]) => {
        if (!["type", "sender", "recipient"].includes(key)) {
            if (typeof value === "string") {
                eventId += value;
            } else if (typeof value === "object" && value) {
                eventId += JSON.stringify(value).slice(0, 50);
            } else {
                eventId += String(value);
            }
        }
    });
    return eventId;
};

export const WaldiezBreakpointToString: (breakpoint: WaldiezBreakpoint) => string = bp => {
    let bp_string = "";
    if (bp.type === "event" && bp.event_type) {
        bp_string += `${bp.type}:${bp.event_type}`;
    } else if (bp.type === "agent" && bp.agent) {
        bp_string += `${bp.type}:${bp.agent}`;
    } else if (bp.type === "agent_event") {
        //
    }
    return bp_string;
};
