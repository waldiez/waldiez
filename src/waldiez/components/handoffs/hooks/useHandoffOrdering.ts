/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable complexity */
/* eslint-disable max-statements */
import { useCallback } from "react";

import { WaldiezNodeAgentData, WaldiezTransitionTarget } from "@waldiez/models";

/**
 * Hook to handle reordering of handoff targets
 */
export const useHandoffOrdering = (
    data: WaldiezNodeAgentData,
    orderedTransitionTargets: Array<{ id: string; target: WaldiezTransitionTarget }>,
    nestedChats: any[],
    getAgentName: (agentId: string) => string,
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void,
) => {
    const swapItems = useCallback(
        (index1: number, index2: number) => {
            if (
                index1 < 0 ||
                index2 < 0 ||
                index1 >= orderedTransitionTargets.length ||
                index2 >= orderedTransitionTargets.length
            ) {
                return;
            }

            const item1 = orderedTransitionTargets[index1];
            const item2 = orderedTransitionTargets[index2];

            // Create deep clones of data to modify
            const newHandoffs = structuredClone(data.handoffs || []);
            const newNestedChats = structuredClone(data.nestedChats || []);

            let order1 = index1;
            let order2 = index2;

            // If orders are different, use them instead of position
            if (item1.target.order !== item2.target.order) {
                order1 = item1.target.order !== undefined ? item1.target.order : index1;
                order2 = item2.target.order !== undefined ? item2.target.order : index2;
            }

            // Process all handoffs to update orders
            newHandoffs.forEach(handoff => {
                if (!handoff.llm_conditions) {
                    return;
                }

                handoff.llm_conditions.forEach(condition => {
                    // Check for item1
                    if (
                        (item1.target.target_type === "AgentTarget" &&
                            condition.target.target_type === "AgentTarget" &&
                            condition.target.target === item1.target.target) ||
                        (item1.target.target_type === "NestedChatTarget" &&
                            condition.target.target_type === "NestedChatTarget")
                    ) {
                        condition.target.order = order2;
                    }

                    // Check for item2
                    if (
                        (item2.target.target_type === "AgentTarget" &&
                            condition.target.target_type === "AgentTarget" &&
                            condition.target.target === item2.target.target) ||
                        (item2.target.target_type === "NestedChatTarget" &&
                            condition.target.target_type === "NestedChatTarget")
                    ) {
                        condition.target.order = order1;
                    }
                });
            });

            // Update nested chat order if needed
            if (item1.id === "nested-chat" && newNestedChats.length > 0) {
                newNestedChats[0].order = order2;
            } else if (item2.id === "nested-chat" && newNestedChats.length > 0) {
                newNestedChats[0].order = order1;
            }

            // Check if handoffs exist for these items
            const hasHandoffForItem1 = newHandoffs.some(h =>
                h.llm_conditions?.some(
                    c =>
                        (item1.target.target_type === "AgentTarget" &&
                            c.target.target_type === "AgentTarget" &&
                            c.target.target === item1.target.target) ||
                        (item1.target.target_type === "NestedChatTarget" &&
                            c.target.target_type === "NestedChatTarget"),
                ),
            );

            const hasHandoffForItem2 = newHandoffs.some(h =>
                h.llm_conditions?.some(
                    c =>
                        (item2.target.target_type === "AgentTarget" &&
                            c.target.target_type === "AgentTarget" &&
                            c.target.target === item2.target.target) ||
                        (item2.target.target_type === "NestedChatTarget" &&
                            c.target.target_type === "NestedChatTarget"),
                ),
            );

            // Create handoff for item1 if it doesn't exist
            if (!hasHandoffForItem1 && item1.target.target_type === "AgentTarget") {
                newHandoffs.push({
                    id: `handoff-${item1.id}`,
                    llm_conditions: [
                        {
                            target: {
                                ...item1.target,
                                order: order2,
                            },
                            condition: {
                                condition_type: "string_llm",
                                prompt: `Handoff to agent ${getAgentName(item1.target.target)}`,
                            },
                        },
                    ],
                });
            }

            // Create handoff for item2 if it doesn't exist
            if (!hasHandoffForItem2 && item2.target.target_type === "AgentTarget") {
                newHandoffs.push({
                    id: `handoff-${item2.id}`,
                    llm_conditions: [
                        {
                            target: {
                                ...item2.target,
                                order: order1,
                            },
                            condition: {
                                condition_type: "string_llm",
                                prompt: `Handoff to agent ${getAgentName(item2.target.target)}`,
                            },
                        },
                    ],
                });
            }

            // Create handoff for nested chat if needed
            if (
                (item1.id === "nested-chat" || item2.id === "nested-chat") &&
                !hasHandoffForItem1 &&
                !hasHandoffForItem2 &&
                nestedChats.length > 0 &&
                nestedChats[0].messages.length > 0
            ) {
                const nestedChatOrder = item1.id === "nested-chat" ? order2 : order1;

                newHandoffs.push({
                    id: "handoff-nested-chat",
                    llm_conditions: [
                        {
                            target: {
                                target_type: "NestedChatTarget",
                                target: "nested-chat",
                                order: nestedChatOrder,
                            },
                            condition: {
                                condition_type: "string_llm",
                                prompt: "Handoff to nested chat",
                            },
                        },
                    ],
                });
            }

            // Update data in one call
            onDataChange({
                handoffs: newHandoffs,
                nestedChats: newNestedChats,
            });
        },
        [orderedTransitionTargets, data.handoffs, data.nestedChats, nestedChats, getAgentName, onDataChange],
    );

    const moveTransitionTargetUp = useCallback(
        (index: number) => {
            if (index <= 0 || index >= orderedTransitionTargets.length) {
                return;
            }
            swapItems(index, index - 1);
        },
        [orderedTransitionTargets, swapItems],
    );

    const moveTransitionTargetDown = useCallback(
        (index: number) => {
            if (index < 0 || index >= orderedTransitionTargets.length - 1) {
                return;
            }
            swapItems(index, index + 1);
        },
        [orderedTransitionTargets, swapItems],
    );

    return {
        moveTransitionTargetUp,
        moveTransitionTargetDown,
    };
};
