/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge } from "@xyflow/react";

import { WaldiezAgentType } from "@waldiez/models/Agent/types";
import { WaldiezMessage } from "@waldiez/models/Chat/Message";

export type WaldiezMessageType = "string" | "method" | "rag_message_generator" | "none";

export type WaldiezChatLlmSummaryMethod = "reflectionWithLlm" | "lastMsg" | null;
export type WaldiezChatSummary = {
    method: WaldiezChatLlmSummaryMethod;
    prompt: string;
    args: { [key: string]: any };
};

export type WaldiezNestedChat = {
    message: WaldiezMessage | null;
    reply: WaldiezMessage | null;
};

export type WaldiezChatDataCommon = {
    description: string;
    position: number;
    order: number;
    clearHistory: boolean;
    message: WaldiezMessage;
    summary: WaldiezChatSummary;
    nestedChat: WaldiezNestedChat;
    prerequisites: string[];
    maxTurns: number | null;
    maxRounds: number;
    realSource: string | null;
    realTarget: string | null;
    sourceType: WaldiezAgentType;
    targetType: WaldiezAgentType;
};
export type WaldiezEdgeData = WaldiezChatDataCommon & {
    label: string;
};

export type WaldiezEdgeType = "chat" | "nested" | "group" | "hidden";

export type WaldiezEdge = Edge<WaldiezEdgeData, WaldiezEdgeType>;
