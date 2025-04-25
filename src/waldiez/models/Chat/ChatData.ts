/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSwarmAfterWork, WaldiezSwarmOnConditionAvailable } from "@waldiez/models/Agent";
import { WaldiezMessage } from "@waldiez/models/Chat/Message";
import { WaldiezChatSummary, WaldiezNestedChat } from "@waldiez/models/Chat/types";

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
 * @param maxRounds - The maximum rounds
 * @param afterWork - The after work
 * @param flowAfterWork - The flow after work
 * @param contextVariables - The context variables
 * @param available - The available for handoff condition
 * @param realSource - The real source (overrides source)
 * @param realTarget - The real target (overrides target)
 * @see {@link WaldiezMessage}
 * @see {@link WaldiezChatSummary}
 * @see {@link WaldiezNestedChat}
 * @see {@link WaldiezSwarmAfterWork}
 * @see {@link WaldiezSwarmOnConditionAvailable}
 */
export class WaldiezChatData {
    source: string;
    target: string;
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
    maxRounds: number;
    afterWork: WaldiezSwarmAfterWork | null;
    flowAfterWork: WaldiezSwarmAfterWork | null;
    contextVariables: { [key: string]: string } = {};
    available: WaldiezSwarmOnConditionAvailable = {
        type: "none",
        value: null,
    };
    realSource: string | null = null;
    realTarget: string | null = null;
    constructor(
        props: {
            source: string;
            target: string;
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
            maxRounds: number;
            afterWork: WaldiezSwarmAfterWork | null;
            flowAfterWork: WaldiezSwarmAfterWork | null;
            contextVariables: { [key: string]: string };
            available: WaldiezSwarmOnConditionAvailable;
            realSource: string | null;
            realTarget: string | null;
        } = {
            source: "source",
            target: "target",
            name: "Chat",
            description: "New connection",
            clearHistory: true,
            maxTurns: null,
            summary: {
                method: "last_msg",
                prompt: "",
                args: {},
            },
            position: 1,
            order: -1,
            message: {
                type: "none",
                use_carryover: false,
                content: null,
                context: {},
            },
            nestedChat: {
                message: null,
                reply: null,
            },
            prerequisites: [],
            maxRounds: 20,
            afterWork: null,
            flowAfterWork: null,
            contextVariables: {},
            available: {
                type: "none",
                value: null,
            },
            realSource: null,
            realTarget: null,
        },
    ) {
        const {
            source,
            target,
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
            maxRounds,
            afterWork,
            flowAfterWork,
            contextVariables,
            available,
            realSource,
            realTarget,
        } = props;
        this.source = source;
        this.target = target;
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
        this.maxRounds = maxRounds;
        this.afterWork = afterWork;
        this.flowAfterWork = flowAfterWork;
        this.contextVariables = contextVariables;
        this.available = available;
        this.realSource = realSource;
        this.realTarget = realTarget;
    }
}
