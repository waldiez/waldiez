/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezChatMessage } from "@waldiez/components/chatUI/types";

/**
 * Generate a unique key for a message (for deduplication)
 */
export const getMessageKey = (message: WaldiezChatMessage): string => {
    // Use ID if available, otherwise create a composite key
    if (message.id) {
        return message.id;
    }
    if (message.timestamp) {
        return message.timestamp.toString();
    }
    // Fallback: create key from message properties
    const contentStr =
        typeof message.content === "string" ? message.content : JSON.stringify(message.content);

    return `${message.type}-${message.sender}-${message.timestamp}-${contentStr.slice(0, 30)}`;
};
