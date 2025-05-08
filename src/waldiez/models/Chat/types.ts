/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Edge } from "@xyflow/react";

import { WaldiezAgentType, WaldiezHandoffCondition } from "@waldiez/models/Agent/types";
import { WaldiezMessage } from "@waldiez/models/Chat/Message";

export type WaldiezMessageType = "string" | "method" | "rag_message_generator" | "none";

export type WaldiezChatLlmSummaryMethod = "reflectionWithLlm" | "lastMsg" | null;

/**
 * Waldiez Chat Summary
 * @param method - The method used to summarize the chat
 * @param prompt - The prompt used to summarize the chat
 * @param args - The arguments used to summarize the chat
 * @see {@link WaldiezChatLlmSummaryMethod}
 * @see {@link WaldiezMessage}
 */
export type WaldiezChatSummary = {
    method: WaldiezChatLlmSummaryMethod;
    prompt: string;
    args: { [key: string]: any };
};

/**
 * Waldiez Nested Chat
 * @param message - The message used in the nested chat
 * @param reply - The reply used in the nested chat
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 */
export type WaldiezNestedChat = {
    message: WaldiezMessage | null;
    reply: WaldiezMessage | null;
};

/**
 * Waldiez Chat Data Common
 * @param description - The description of the chat
 * @param position - The position of the chat
 * @param order - The order of the chat
 * @param clearHistory - Clear history
 * @param message - The message used in the chat
 * @param summary - The summary of the chat
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param maxTurns - The maximum turns
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @param sourceType - The source type
 * @param targetType - The target type
 * @param handoffCondition - The handoff condition
 * @param silent - The silent mode
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezHandoffCondition}
 */
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
    realSource: string | null;
    realTarget: string | null;
    sourceType: WaldiezAgentType;
    targetType: WaldiezAgentType;
    handoffCondition: WaldiezHandoffCondition | null;
    silent?: boolean;
};

/**
 * Waldiez Edge Data
 * @param label - The label of the edge
 * @param description - The description of the chat
 * @param position - The position of the chat
 * @param order - The order of the chat
 * @param clearHistory - Clear history
 * @param message - The message used in the chat
 * @param summary - The summary of the chat
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param maxTurns - The maximum turns
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @param sourceType - The source type
 * @param targetType - The target type
 * @param handoffCondition - The handoff condition
 * @param silent - The silent mode
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezChatDataCommon}
 * @see {@link WaldiezHandoffCondition}
 */
export type WaldiezEdgeData = WaldiezChatDataCommon & {
    label: string;
};

export type WaldiezEdgeType = "chat" | "nested" | "group" | "hidden";
export type WaldiezGroupChatType = "toManager" | "nested" | "handoff" | "fromManager" | "none";
export type WaldiezEdge = Edge<WaldiezEdgeData, WaldiezEdgeType>;
