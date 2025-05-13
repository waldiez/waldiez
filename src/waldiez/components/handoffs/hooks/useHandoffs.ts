/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
/* eslint-disable max-statements */
import { useCallback, useEffect, useMemo, useState } from "react";

import {
    WaldiezAgentHandoff,
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezTransitionTarget,
} from "@waldiez/models";

export const useHandoffs = (
    id: string,
    data: WaldiezNodeAgentData,
    agents: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void,
) => {
    // Internal state to track orders (since we can't immediately see changes in props)
    const [transitionOrders, setTransitionOrders] = useState<Record<string, number>>({});
    // Add a state to track if we've initialized orders to prevent infinite loops
    const [initialized, setInitialized] = useState(false);

    /**
     * Get the parent group ID if the agent is in a group
     */
    const parentGroupId = useMemo(() => data.parentId, [data.parentId]);

    /**
     * Get other agents in the same group
     */
    const groupAgents = useMemo(() => {
        if (!parentGroupId) {
            return [];
        }

        return agents.filter(agent => agent.data.parentId === parentGroupId && agent.id !== id);
    }, [agents, parentGroupId, id]);

    /**
     * Get the edges that have this agent as a source
     */
    const agentEdges = useMemo(() => {
        return edges.filter(edge => edge.source === id);
    }, [edges, id]);

    /**
     * Filter edges to only include connections to agents in the same group
     * This prevents duplication with nested chat targets
     */
    const groupEdges = useMemo(() => {
        if (!parentGroupId) {
            return agentEdges;
        }

        // Get IDs of agents in the same group
        const groupAgentIds = groupAgents.map(agent => agent.id);

        // Only include edges to agents in the same group
        return agentEdges.filter(edge => groupAgentIds.includes(edge.target));
    }, [agentEdges, groupAgents, parentGroupId]);

    /**
     * Get the AfterWork handoff if it exists
     */
    const afterWorkHandoff = useMemo(
        () => data.handoffs?.find(handoff => handoff.after_work),
        [data.handoffs],
    );

    /**
     * Extract nested chats from agent data
     */
    const nestedChats = useMemo(() => data.nestedChats || [], [data.nestedChats]);

    /**
     * Get transition targets for direct connections
     * These are direct agent-to-agent handoffs
     */
    const directTransitionTargets = useMemo(() => {
        return groupEdges.map((edge, index) => {
            // Use our internal state if available, otherwise default to index
            const order = transitionOrders[edge.id] !== undefined ? transitionOrders[edge.id] : index;

            // Convert edge to transition target format
            const target: WaldiezTransitionTarget = {
                target_type: "AgentTarget",
                target: edge.target,
                order: order,
            };

            return {
                id: edge.id,
                target,
            };
        });
    }, [groupEdges, transitionOrders]);

    /**
     * Get transition target for nested chat if it exists
     */
    const nestedChatTransitionTarget = useMemo(() => {
        if (nestedChats.length === 0 || nestedChats[0].messages.length === 0) {
            return null;
        }

        const nestedChatId = "nested-chat";
        const nestedChat = nestedChats[0];
        const firstEdgeId =
            nestedChat.messages && nestedChat.messages.length > 0 ? nestedChat.messages[0].id : null;

        // Use internal state if available, otherwise default to a higher order
        const order =
            transitionOrders[nestedChatId] !== undefined
                ? transitionOrders[nestedChatId]
                : directTransitionTargets.length;

        const target: WaldiezTransitionTarget = {
            target_type: "NestedChatTarget",
            target: firstEdgeId || "",
            order: order,
        };

        return {
            id: nestedChatId,
            target,
        };
    }, [nestedChats, directTransitionTargets.length, transitionOrders]);

    /**
     * Initialize transition orders based on props
     * Now using useEffect to prevent re-render loops
     */
    useEffect(() => {
        // Skip if we've already initialized
        if (initialized) {
            return;
        }

        const initialOrders: Record<string, number> = {};

        // Add orders for direct connections
        groupEdges.forEach((edge, index) => {
            initialOrders[edge.id] = index;
        });

        // Add order for nested chat if exists
        if (nestedChats.length > 0 && nestedChats[0].messages.length > 0) {
            initialOrders["nested-chat"] = groupEdges.length;
        }

        // Only set if our state is empty (preserve manual ordering)
        if (Object.keys(transitionOrders).length === 0) {
            setTransitionOrders(initialOrders);
            setInitialized(true);
        } else {
            setInitialized(true);
        }
    }, [groupEdges, nestedChats, transitionOrders, initialized]);

    /**
     * Combine all transition targets and sort by order
     */
    const orderedTransitionTargets = useMemo(() => {
        const targets: { id: string; target: WaldiezTransitionTarget }[] = [...directTransitionTargets];

        if (nestedChatTransitionTarget) {
            targets.push(nestedChatTransitionTarget);
        }

        // Sort by order
        return targets.sort((a, b) => (a.target.order || 0) - (b.target.order || 0));
    }, [directTransitionTargets, nestedChatTransitionTarget]);

    /**
     * Get target agent name by ID
     */
    const getAgentName = useCallback(
        (agentId: string) => {
            const agent = agents.find(a => a.id === agentId);
            return agent?.data.label || agent?.data.name || agentId;
        },
        [agents],
    );

    /**
     * Get a display name for the nested chat
     */
    const getNestedChatDisplayName = useCallback(
        (index: number = 0) => {
            if (nestedChats.length === 0 || index >= nestedChats.length) {
                return "Nested Chat";
            }
            if (nestedChats[index].messages.length === 0) {
                return "Nested Chat";
            }
            const nestedChat = nestedChats[index];
            const targets = nestedChat.messages
                .map(msg => {
                    const edge = agentEdges.find(e => e.id === msg.id);
                    return edge ? getAgentName(edge.target) : "";
                })
                .filter(Boolean);

            if (targets.length === 0) {
                return "Nested Chat";
            }

            if (targets.length === 1) {
                return `Nested Chat: ${targets[0]}`;
            }

            return `Nested Chat: ${targets[0]} +${targets.length - 1} more`;
        },
        [nestedChats, agentEdges, getAgentName],
    );

    /**
     * Get AfterWork target display name
     */
    const getAfterWorkTargetName = useCallback(
        (target: WaldiezTransitionTarget) => {
            if (!target) {
                return "";
            }

            if (target.target_type === "AgentTarget" && target.target) {
                return `Agent: ${getAgentName(target.target)}`;
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
    /**
     * Swap two items in the ordering
     */
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

            // Create the new ordering with the swapped items
            const newOrders = { ...transitionOrders };
            newOrders[item1.id] = index2;
            newOrders[item2.id] = index1;

            // Update our internal state for immediate UI update
            setTransitionOrders(newOrders);

            // Create updated nested chats using the new orders
            let updatedNestedChats = [...nestedChats];
            if (nestedChats.length > 0 && nestedChats[0].messages.length > 0) {
                const nestedChatOrder =
                    newOrders["nested-chat"] !== undefined ? newOrders["nested-chat"] : groupEdges.length;

                updatedNestedChats = nestedChats.map((chat, idx) =>
                    idx === 0 ? { ...chat, order: nestedChatOrder } : chat,
                );
            }

            // Create handoffs based on our new ordering
            const updatedHandoffs: WaldiezAgentHandoff[] = [];

            // Keep existing afterWork handoff if present
            if (afterWorkHandoff) {
                updatedHandoffs.push(structuredClone(afterWorkHandoff));
            }

            // Create handoffs for direct connections
            groupEdges.forEach(edge => {
                const order = newOrders[edge.id] !== undefined ? newOrders[edge.id] : 0;

                // Create a simple handoff for this edge
                updatedHandoffs.push({
                    id: `handoff-${edge.id}`,
                    llm_conditions: [
                        {
                            target: {
                                target_type: "AgentTarget",
                                target: edge.target,
                                order,
                            },
                            condition: {
                                condition_type: "string_llm",
                                prompt: `Handoff to agent ${getAgentName(edge.target)}`,
                            },
                        },
                    ],
                });
            });

            // Create handoff for nested chat if it exists
            if (nestedChats.length > 0 && nestedChats[0].messages.length > 0) {
                const order =
                    newOrders["nested-chat"] !== undefined ? newOrders["nested-chat"] : groupEdges.length;

                updatedHandoffs.push({
                    id: "handoff-nested-chat",
                    llm_conditions: [
                        {
                            target: {
                                target_type: "NestedChatTarget",
                                target: "nested-chat",
                                order,
                            },
                            condition: {
                                condition_type: "string_llm",
                                prompt: "Handoff to nested chat",
                            },
                        },
                    ],
                });
            }

            // Update handoffs with our new ordering
            onDataChange({
                handoffs: structuredClone(updatedHandoffs),
                nestedChats: structuredClone(updatedNestedChats),
            });
        },
        [
            orderedTransitionTargets,
            transitionOrders,
            nestedChats,
            afterWorkHandoff,
            groupEdges,
            getAgentName,
            onDataChange,
        ],
    );
    /**
     * Move an item up in the ordering
     */
    const moveTransitionTargetUp = useCallback(
        (index: number) => {
            if (index <= 0 || index >= orderedTransitionTargets.length) {
                return;
            }

            swapItems(index, index - 1);
        },
        [orderedTransitionTargets, swapItems],
    );

    /**
     * Move an item down in the ordering
     */
    const moveTransitionTargetDown = useCallback(
        (index: number) => {
            if (index < 0 || index >= orderedTransitionTargets.length - 1) {
                return;
            }

            swapItems(index, index + 1);
        },
        [orderedTransitionTargets, swapItems],
    );

    /**
     * Get the name of a transition target
     */
    const getTransitionTargetName = useCallback(
        (target: WaldiezTransitionTarget) => {
            if (!target) {
                return "";
            }
            if (target.target_type === "AgentTarget" && target.target) {
                return `Agent: ${getAgentName(target.target)}`;
            }
            if (target.target_type === "NestedChatTarget") {
                return getNestedChatDisplayName();
            }
            if (target.target_type === "GroupManagerTarget") {
                return "Group Manager";
            }
            if (target.target_type === "RandomAgentTarget") {
                return "Random Agent";
            }
            if (target.target_type === "GroupChatTarget") {
                return "Group Chat";
            }
            if (target.target_type === "StayTarget") {
                return "Stay";
            }
            if (target.target_type === "TerminateTarget") {
                return "Terminate";
            }
            if (target.target_type === "RevertToUserTarget") {
                return "Revert to User";
            }
            if (target.target_type === "AskUserTarget") {
                return "Ask User";
            }
            return target.target_type;
        },
        [getAgentName, getNestedChatDisplayName],
    );

    /**
     * Check if we have any handoffs to display
     */
    const hasHandoffs = orderedTransitionTargets.length > 0 || !!afterWorkHandoff;

    return {
        hasHandoffs,
        orderedTransitionTargets,
        afterWorkHandoff,
        getTransitionTargetName,
        getAgentName,
        getNestedChatDisplayName,
        getAfterWorkTargetName,
        moveTransitionTargetUp,
        moveTransitionTargetDown,
    };
};
