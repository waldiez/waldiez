/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import { WaldiezEdge, WaldiezNodeAgentData, WaldiezTransitionTarget } from "@waldiez/models";
import { getFriendlyString } from "@waldiez/utils";

/**
 * Hook to manage transition targets for handoffs
 */
export const useHandoffTargets = (
    data: WaldiezNodeAgentData,
    groupEdges: WaldiezEdge[],
    getAgentName: (agentId: string) => string,
) => {
    // Extract data
    const nestedChats = useMemo(() => data.nestedChats || [], [data.nestedChats]);
    const handoffs = useMemo(() => data.handoffs || [], [data.handoffs]);
    const afterWorkHandoff = useMemo(() => handoffs.find(handoff => handoff.after_work), [handoffs]);
    const llmHandoffs = useMemo(
        () => handoffs.filter(h => h.llm_transitions && h.llm_transitions?.length > 0),
        [handoffs],
    );

    // Calculate current ordering
    const currentOrders = useMemo(() => {
        const orders: Record<string, number> = {};

        // Get orders from nested chats
        if (nestedChats.length > 0 && nestedChats[0].order !== undefined) {
            orders["nested-chat"] = nestedChats[0].order;
        }

        // Get orders from handoffs
        llmHandoffs.forEach(handoff => {
            handoff.llm_transitions?.forEach(condition => {
                if (condition.target.target_type === "AgentTarget") {
                    // @ts-expect-error generic target
                    const edge = groupEdges.find(e => e.target === condition.target.target);
                    if (edge && condition.target.order !== undefined) {
                        orders[edge.id] = condition.target.order;
                    }
                } else if (
                    condition.target.target_type === "NestedChatTarget" &&
                    condition.target.order !== undefined
                ) {
                    orders["nested-chat"] = condition.target.order;
                }
            });
        });

        // Assign default orders for any items without an order
        groupEdges.forEach((edge, index) => {
            if (orders[edge.id] === undefined) {
                orders[edge.id] = index;
            }
        });

        if (
            nestedChats.length > 0 &&
            nestedChats[0].messages.length > 0 &&
            orders["nested-chat"] === undefined
        ) {
            orders["nested-chat"] = groupEdges.length;
        }

        return orders;
    }, [nestedChats, llmHandoffs, groupEdges]);

    // Get nested chat display name
    const getNestedChatDisplayName = useCallback(
        (index: number = 0) => {
            if (
                nestedChats.length === 0 ||
                index >= nestedChats.length ||
                nestedChats[index].messages.length === 0
            ) {
                return "Nested Chat";
            }

            const nestedChat = nestedChats[index];
            const targets = nestedChat.messages
                .map(msg => {
                    const edge = groupEdges.find(e => e.id === msg.id);
                    return edge ? getAgentName(edge.target) : "";
                })
                .filter(Boolean);

            if (targets.length === 0) {
                return "Nested Chat";
            }

            return targets.length === 1
                ? `Nested Chat: ${targets[0]}`
                : `Nested Chat: ${targets[0]} +${targets.length - 1} more`;
        },
        [nestedChats, groupEdges, getAgentName],
    );

    // Create transition targets for direct connections
    const directTransitionTargets = useMemo(() => {
        return groupEdges.map(edge => {
            const order = currentOrders[edge.id] !== undefined ? currentOrders[edge.id] : 0;
            return {
                id: edge.id,
                target: {
                    target_type: "AgentTarget",
                    value: edge.target,
                    order,
                } as WaldiezTransitionTarget,
            };
        });
    }, [groupEdges, currentOrders]);

    // Create transition target for nested chat
    const nestedChatTransitionTarget = useMemo(() => {
        if (nestedChats.length === 0 || nestedChats[0].messages.length === 0) {
            return null;
        }
        const order =
            currentOrders["nested-chat"] !== undefined ? currentOrders["nested-chat"] : groupEdges.length;

        return {
            id: "nested-chat",
            target: {
                target_type: "NestedChatTarget",
                value: "nested-chat",
                order,
            } as WaldiezTransitionTarget,
        };
    }, [nestedChats, currentOrders, groupEdges.length]);

    // Combine and sort all transition targets
    const orderedTransitionTargets = useMemo(() => {
        const targets = [...directTransitionTargets];
        if (nestedChatTransitionTarget) {
            targets.push(nestedChatTransitionTarget);
        }
        return targets.sort((a, b) => (a.target.order || 0) - (b.target.order || 0));
    }, [directTransitionTargets, nestedChatTransitionTarget]);

    // Target name utility functions
    const getTransitionTargetName = useCallback(
        (target: WaldiezTransitionTarget) => {
            if (!target) {
                return "";
            }

            if (target.target_type === "AgentTarget" && target.value) {
                return `Agent: ${getAgentName(target.value)}`;
            }

            if (target.target_type === "NestedChatTarget") {
                return getNestedChatDisplayName();
            }

            return getFriendlyString(target.target_type).replace(" Target", "");
        },
        [getAgentName, getNestedChatDisplayName],
    );

    const getAfterWorkTargetName = useCallback(
        (target: WaldiezTransitionTarget) => {
            if (!target) {
                return "";
            }

            if (target.target_type === "AgentTarget" && target.value) {
                return `Agent: ${getAgentName(target.value)}`;
            }

            const typeMap: Record<string, string> = {
                AskUserTarget: "Ask User",
                RevertToUserTarget: "Revert to User",
                TerminateTarget: "Terminate",
                RandomAgentTarget: "Random Agent",
                GroupManagerTarget: "Group Manager",
                NestedChatTarget: "Nested Chat",
                GroupChatTarget: "Group Chat",
                StayTarget: "Stay",
            };

            return typeMap[target.target_type] || target.target_type;
        },
        [getAgentName],
    );

    return {
        nestedChats,
        handoffs,
        afterWorkHandoff,
        currentOrders,
        orderedTransitionTargets,
        getTransitionTargetName,
        getNestedChatDisplayName,
        getAfterWorkTargetName,
    };
};
