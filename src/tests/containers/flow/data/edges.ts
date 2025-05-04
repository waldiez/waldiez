/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge } from "@xyflow/react";

import { WaldiezChatLlmSummaryMethod, WaldiezMessageType } from "@waldiez/models";

import { createdAt, edgesCount, updatedAt } from "./common";

const edges: Edge[] = [];
for (let i = 0; i < edgesCount; i++) {
    let chatType = "chat";
    if (i % 3 === 1) {
        chatType = "nested";
    }
    edges.push({
        id: `edge-${i}`,
        source: `agent-${i}`,
        target: `agent-${i + 1}`,
        type: chatType,
        data: {
            label: `Edge ${i}`,
            position: i,
            order: i,
            clearHistory: false,
            summary: {
                method: "last_msg" as WaldiezChatLlmSummaryMethod,
                prompt: "Summarize the conversation",
                args: {
                    "summary-arg-key": "summary-arg-value",
                },
            },
            maxTurns: 2,
            message: {
                type: "string" as WaldiezMessageType,
                content: "Chat Message",
                context: {
                    "context-key": "context-value",
                },
                use_carryover: false,
            },
            nestedChat: {
                message: {
                    type: "string" as WaldiezMessageType,
                    content: "Nested Chat Message",
                    context: {
                        "nested-message-context-key": "nested-message-context-value",
                    },
                },
                reply: {
                    type: "method" as WaldiezMessageType,
                    content: 'def custom_method(context):\n    return "Nested Chat Reply"',
                    context: {
                        "nested-reply-context-key": "nested-reply-context-value",
                    },
                },
            },
            maxRounds: 10,
            afterWork: {
                recipientType: "option",
                recipient: "TERMINATE",
            },
            flowAfterWork: null,
            createdAt,
            updatedAt,
        },
    });
}
export { edges };
