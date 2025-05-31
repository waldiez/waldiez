/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezAgentType } from "@waldiez/models/Agent/Common/types";
import { WaldiezMessage } from "@waldiez/models/Chat/Message";
import { WaldiezChatSummary, WaldiezNestedChat } from "@waldiez/models/Chat/types";
import {
    WaldiezHandoffAvailability,
    WaldiezHandoffCondition,
    WaldiezTransitionTarget,
} from "@waldiez/models/common";

/**
 * Waldiez Chat Data
 * @param source - The source
 * @param target - The target
 * @param name - The name of the chat
 * @param description - The description of the chat
 * @param clearHistory - Clear history
 * @param maxTurns - The maximum turns
 * @param summary - The summary
 * @param position - The position
 * @param order - The order
 * @param message - The message
 * @param nestedChat - The nested chat
 * @param prerequisites - The prerequisites (chat ids) for async mode
 * @param available - The available for handoff condition
 * @param condition - The handoff condition
 * @param afterWork - The after work transition
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezAgentType}
 * @see {@link WaldiezHandoffCondition}
 * @see {@link WaldiezHandoffAvailability}
 * @see {@link WaldiezTransitionTarget}
 */
export class WaldiezChatData {
    source: string;
    target: string;
    sourceType: WaldiezAgentType;
    targetType: WaldiezAgentType;
    name: string;
    description: string;
    position: number;
    order: number;
    clearHistory: boolean;
    message: WaldiezMessage;
    maxTurns: number | null;
    summary: WaldiezChatSummary;
    nestedChat: {
        message: WaldiezMessage | null;
        reply: WaldiezMessage | null;
    };
    prerequisites: string[] = [];
    realSource: string | null = null;
    realTarget: string | null = null;
    available: WaldiezHandoffAvailability = {
        type: "none",
        value: "",
    };
    condition: WaldiezHandoffCondition = {
        conditionType: "string_llm",
        prompt: "Handoff to another agent",
    };
    afterWork: WaldiezTransitionTarget | null = null;
    silent?: boolean = false;
    constructor(
        props: {
            source: string;
            target: string;
            sourceType: WaldiezAgentType;
            targetType: WaldiezAgentType;
            name: string;
            description: string;
            clearHistory: boolean;
            maxTurns: number | null;
            summary: WaldiezChatSummary;
            position: number;
            order: number;
            message: WaldiezMessage;
            nestedChat: WaldiezNestedChat;
            prerequisites: string[];
            condition: WaldiezHandoffCondition;
            available: WaldiezHandoffAvailability;
            afterWork: WaldiezTransitionTarget | null;
            realSource: string | null;
            realTarget: string | null;
            silent?: boolean;
        } = {
            source: "source",
            target: "target",
            sourceType: "user_proxy",
            targetType: "assistant",
            name: "Chat",
            description: "New connection",
            clearHistory: true,
            maxTurns: null,
            summary: {
                method: "lastMsg",
                prompt: "",
                args: {},
            },
            position: 1,
            order: -1,
            message: {
                type: "none",
                useCarryover: false,
                content: null,
                context: {},
            },
            nestedChat: {
                message: null,
                reply: null,
            },
            prerequisites: [],
            condition: {
                conditionType: "string_llm",
                prompt: "Handoff to another agent",
            },
            available: {
                type: "none",
                value: "",
            },
            afterWork: null,
            realSource: null,
            realTarget: null,
            silent: false,
        },
    ) {
        const {
            source,
            target,
            sourceType,
            targetType,
            name,
            description,
            clearHistory,
            maxTurns,
            summary,
            message,
            position,
            order,
            nestedChat,
            prerequisites,
            condition,
            available,
            afterWork,
            realSource,
            realTarget,
            silent,
        } = props;
        this.source = source;
        this.target = target;
        this.sourceType = sourceType;
        this.targetType = targetType;
        this.name = name;
        this.description = description;
        this.clearHistory = clearHistory;
        this.maxTurns = maxTurns;
        this.summary = summary;
        this.message = message;
        this.position = position;
        this.order = order;
        this.nestedChat = nestedChat;
        this.prerequisites = prerequisites;
        this.condition = condition;
        this.available = available;
        this.afterWork = afterWork;
        this.realSource = realSource;
        this.realTarget = realTarget;
        this.silent = silent;
    }
}
