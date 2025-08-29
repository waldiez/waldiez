/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import { useAgentRelationships } from "@waldiez/components/handoffs/hooks/useAgentRelationships";
import { useHandoffNames } from "@waldiez/components/handoffs/hooks/useHandoffNames";
import type {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezTransitionTarget,
} from "@waldiez/models/types";

type WaldiezOrderedHandoffTransitionTarget = WaldiezTransitionTarget & {
    id: string; // Ensure id is a string
    order: number; // Add order property for sorting
};

/**
 * Hook to manage agent handoffs with ordering capability
 */
export const useHandoffs = (
    id: string,
    data: WaldiezNodeAgentData,
    agents: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void,
) => {
    const { groupEdges, nestedChats } = useAgentRelationships(id, data, agents, edges);
    const { getTransitionTargetName } = useHandoffNames(agents, edges, nestedChats);
    const orderedTransitionTargets: WaldiezOrderedHandoffTransitionTarget[] = useMemo(() => {
        // Initialize ordered targets
        const orderedTargets: WaldiezOrderedHandoffTransitionTarget[] = [];
        const processedEdges = new Set<string>();
        const nestedChatId = "nested-chat";
        const hasNestedChat = nestedChats.length > 0 && nestedChats.some(chat => chat.messages.length > 0);

        // Process ordered handoffs from data.handoffs
        data.handoffs.forEach((id, index) => {
            if (id === nestedChatId) {
                // Handle nested chat
                if (hasNestedChat) {
                    const newTarget: WaldiezTransitionTarget = {
                        targetType: "NestedChatTarget",
                        value: [nestedChatId],
                    };
                    orderedTargets.push({
                        id: nestedChatId,
                        ...newTarget,
                        value: [getTransitionTargetName(newTarget)],
                        order: index,
                    });
                }
            } else {
                // Handle edge handoff
                const edge = groupEdges.find(e => e.id === id);
                if (edge) {
                    processedEdges.add(edge.id);
                    const newTarget: WaldiezTransitionTarget = {
                        targetType: "AgentTarget",
                        value: [edge.target],
                    };
                    orderedTargets.push({
                        id: edge.id,
                        ...newTarget,
                        value: [getTransitionTargetName(newTarget)],
                        order: index,
                    });
                }
            }
        });

        // Add any new edges that aren't in data.handoffs yet
        groupEdges.forEach(edge => {
            if (!processedEdges.has(edge.id)) {
                const newTarget: WaldiezTransitionTarget = {
                    targetType: "AgentTarget",
                    value: [edge.target],
                };
                orderedTargets.push({
                    id: edge.id,
                    ...newTarget,
                    value: [getTransitionTargetName(newTarget)],
                    order: orderedTargets.length,
                });
            }
        });

        // Add nested chat if it exists but isn't in data.handoffs
        if (hasNestedChat && !data.handoffs.includes(nestedChatId)) {
            const newTarget: WaldiezTransitionTarget = {
                targetType: "NestedChatTarget",
                value: [],
            };
            orderedTargets.push({
                id: nestedChatId,
                ...newTarget,
                value: [getTransitionTargetName(newTarget)],
                order: orderedTargets.length,
            });
        }
        // Sort handoffs by their order property
        return orderedTargets.sort((a, b) => a.order - b.order);
    }, [data.handoffs, groupEdges, nestedChats, getTransitionTargetName]);
    const onMoveTransitionTargetUp = useCallback(
        (index: number) => {
            if (index <= 0 || !orderedTransitionTargets[index - 1] || !orderedTransitionTargets[index]) {
                return;
            }

            const newOrderedTargets = [...orderedTransitionTargets];
            [newOrderedTargets[index], newOrderedTargets[index - 1]] = [
                newOrderedTargets[index - 1]!,
                newOrderedTargets[index]!,
            ];

            const newHandoffs = newOrderedTargets.map(target => target.id);
            onDataChange({ handoffs: newHandoffs });
        },
        [orderedTransitionTargets, onDataChange],
    );

    const onMoveTransitionTargetDown = useCallback(
        (index: number) => {
            if (index >= orderedTransitionTargets.length - 1) {
                return;
            }

            const newOrderedTargets = [...orderedTransitionTargets];
            [newOrderedTargets[index], newOrderedTargets[index + 1]] = [
                newOrderedTargets[index + 1]!,
                newOrderedTargets[index]!,
            ];

            const newHandoffs = newOrderedTargets.map(target => target.id);
            onDataChange({ handoffs: newHandoffs });
        },
        [orderedTransitionTargets, onDataChange],
    );
    return {
        orderedTransitionTargets,
        getTransitionTargetName,
        onMoveTransitionTargetUp,
        onMoveTransitionTargetDown,
    };
};
