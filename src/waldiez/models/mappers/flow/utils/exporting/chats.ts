/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezEdge } from "@waldiez/models/Chat";
import { chatMapper } from "@waldiez/models/mappers/chat";

export const exportChat = (edge: WaldiezEdge, edges: WaldiezEdge[], index: number) => {
    const chat = chatMapper.exportChat(edge, index);
    const chatEdge = edges.find(e => e.id === edge.id);
    if (chatEdge) {
        Object.keys(chatEdge).forEach(key => {
            if (!["id", "data", "type", "source", "target"].includes(key)) {
                delete chat[key];
            }
        });
    }
    return chat;
};
