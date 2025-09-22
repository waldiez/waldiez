/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

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
