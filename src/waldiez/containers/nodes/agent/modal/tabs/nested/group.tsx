/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useEffect, useMemo } from "react";

import { HandoffAvailability, HandoffCondition, TabItem, TabItems } from "@waldiez/components";
import { useWaldiez } from "@waldiez/store";
import type {
    WaldiezAgentConnections,
    WaldiezAgentNestedChat,
    WaldiezEdge,
    WaldiezNodeAgentData,
} from "@waldiez/types";

type WaldiezAgentGroupNestedChatTabsProps = {
    id: string;
    flowId: string;
    darkMode: boolean;
    edges: WaldiezEdge[];
    data: WaldiezNodeAgentData;
    agentConnections: WaldiezAgentConnections;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>, markDirty?: boolean) => void;
};

const defaultCondition: WaldiezAgentNestedChat["condition"] = {
    conditionType: "string_llm",
    prompt: "",
};

const defaultAvailability: WaldiezAgentNestedChat["available"] = {
    type: "none",
    value: "",
};

/**
 * Get or create nested chats from agent data and edges
 * Makes sure all edges are included in the nested chat messages
 */
const getNestedChats = (agentData: WaldiezNodeAgentData, edges: WaldiezEdge[]): WaldiezAgentNestedChat[] => {
    // Initialize with existing nested chats or create a new empty one
    const nestedChats: WaldiezAgentNestedChat[] = [];
    if (agentData.nestedChats.length > 0 && agentData.nestedChats[0]!.messages.length > 0) {
        nestedChats.push(agentData.nestedChats[0]!);
    } else {
        nestedChats.push({
            triggeredBy: [],
            messages: [],
            condition: {
                conditionType: "string_llm",
                prompt: "",
            },
            available: {
                type: "none",
                value: "",
            },
        });
    }

    // Add any edges that aren't already in the nested chat messages
    edges.forEach(edge => {
        if (
            nestedChats.length > 0 &&
            nestedChats[0]?.messages.findIndex(message => message.id === edge.id) === -1
        ) {
            nestedChats[0]?.messages.push({
                id: edge.id,
                isReply: false,
            });
        }
    });

    return structuredClone(nestedChats);
};

/**
 * Component for managing group nested chat tabs
 * Provides queue management and availability settings
 */
export const WaldiezAgentGroupNestedChatTabs = memo((props: WaldiezAgentGroupNestedChatTabsProps) => {
    const { id, flowId, agentConnections, data, edges, onDataChange } = props;

    const getGroupManager = useWaldiez(s => s.getAgentById);
    // Get nested chats with all edges included
    const nestedChats = useMemo(() => getNestedChats(data, edges), [data, edges]);

    const groupManager = useMemo(
        () => (data.parentId ? getGroupManager(data.parentId) : null),
        [data, getGroupManager],
    );
    const contextVariables = groupManager ? Object.keys(groupManager.data.contextVariables || {}) : [];

    useEffect(() => {
        if (!data?.nestedChats?.length) {
            return;
        }

        const currentMessageIds = new Set(data.nestedChats[0]?.messages.map(m => m.id));
        const edgeIds = new Set(edges.map(e => e.id));

        const missingEdges = edges.filter(e => !currentMessageIds.has(e.id));
        const extraMessages = data.nestedChats[0]?.messages.filter(m => !edgeIds.has(m.id));

        const needsUpdate = missingEdges.length > 0 || extraMessages!.length > 0;

        if (needsUpdate) {
            const updatedMessages = [
                ...data.nestedChats[0]!.messages.filter(m => edgeIds.has(m.id)),
                ...missingEdges.map(edge => ({ id: edge.id, isReply: false })),
            ];

            const updatedNestedChats: WaldiezAgentNestedChat[] = [
                {
                    ...data.nestedChats[0]!,
                    messages: updatedMessages,
                },
            ];

            onDataChange({ nestedChats: updatedNestedChats });
        }
    }, [data.nestedChats, edges, onDataChange]);

    // Calculate message count for UI adjustments
    const nestedChatMessagesCount = useMemo(
        () => (nestedChats.length > 0 ? nestedChats[0]?.messages.length : 0),
        [nestedChats],
    );

    /**
     * Get recipient name from edge ID
     */
    const getRecipientName = useCallback(
        (edgeId: string) => {
            const edge = agentConnections.targets.edges.find(edge => edge.id === edgeId);
            if (!edge) {
                return "";
            }

            const target = agentConnections.targets.nodes.find(agent => agent.id === edge.target);
            if (!target) {
                return "";
            }

            return target.data.label;
        },
        [agentConnections.targets.edges, agentConnections.targets.nodes],
    );

    /**
     * Move a nested chat message up in the queue
     */
    const onMoveNestedChatMessageUp = useCallback(
        (index: number) => {
            const newNestedChats = [...nestedChats];
            if (
                newNestedChats[0] &&
                Array.isArray(newNestedChats[0].messages) &&
                newNestedChats[0].messages[index] !== undefined &&
                newNestedChats[0].messages[index - 1] !== undefined
            ) {
                const temp = newNestedChats[0].messages[index];
                newNestedChats[0].messages[index] = newNestedChats[0].messages[index - 1]!;
                newNestedChats[0].messages[index - 1] = temp;

                onDataChange({ nestedChats: newNestedChats });
            }
        },
        [nestedChats, onDataChange],
    );

    /**
     * Move a nested chat message down in the queue
     */
    const onMoveNestedChatMessageDown = useCallback(
        (index: number) => {
            const newNestedChats = [...nestedChats];
            const messages = newNestedChats[0]!.messages;
            if (messages[index + 1] !== undefined) {
                const temp = messages[index];
                messages[index] = messages[index + 1]!;
                messages[index + 1] = temp!;

                onDataChange({
                    nestedChats: structuredClone(newNestedChats),
                });
            }
        },
        [nestedChats, onDataChange],
    );

    /**
     * Handle condition change for nested chat
     */
    const onConditionChange = useCallback(
        (condition: WaldiezAgentNestedChat["condition"]) => {
            const newNestedChats = structuredClone(nestedChats);
            newNestedChats[0]!.condition = condition || defaultCondition;
            onDataChange({ nestedChats: newNestedChats });
        },
        [nestedChats, onDataChange],
    );

    /**
     * Handle availability change for nested chat
     */
    const onAvailabilityChange = useCallback(
        (available: WaldiezAgentNestedChat["available"]) => {
            const newNestedChats = structuredClone(nestedChats);
            newNestedChats[0]!.available = available || defaultAvailability;
            onDataChange({ nestedChats: newNestedChats });
        },
        [nestedChats, onDataChange],
    );

    return (
        <div className="agent-panel" data-testid={`agent-group-nested-chat-tabs-${id}`}>
            <TabItems activeTabIndex={0}>
                {/* Queue Tab */}
                <TabItem label="Queue" id={`wf-${flowId}-wa-${id}-nested-chats-queue`}>
                    <div className="flex flex-col margin-10 nested-chat-queue">
                        {nestedChats[0]?.messages.map((message, index) => (
                            <div
                                key={`agent-${id}-nestedChat-recipient-${index}`}
                                className="flex items-center margin-bottom-10 queue-item"
                                data-testid={`nested-chat-queue-item-${index}`}
                            >
                                {/* Reorder buttons */}
                                <div className="margin-right-10 reorder-buttons">
                                    {/* Move Up Button - Only shown when not first and more than one message */}
                                    {index > 0 && (nestedChatMessagesCount || 0) > 1 && (
                                        <button
                                            type="button"
                                            title="Move up"
                                            className="reorder-btn up-btn"
                                            data-testid={`move-nested-recipient-up-button-${index}`}
                                            onClick={() => onMoveNestedChatMessageUp(index)}
                                            aria-label={`Move ${getRecipientName(message.id)} up`}
                                        >
                                            &#x2191;
                                        </button>
                                    )}

                                    {/* Move Down Button - Only shown when not last */}
                                    {index < (nestedChatMessagesCount || 0) - 1 && (
                                        <button
                                            title="Move down"
                                            type="button"
                                            className="reorder-btn down-btn"
                                            data-testid={`move-nested-recipient-down-button-${index}`}
                                            onClick={() => onMoveNestedChatMessageDown(index)}
                                            aria-label={`Move ${getRecipientName(message.id)} down`}
                                        >
                                            &#x2193;
                                        </button>
                                    )}
                                </div>

                                {/* Recipient Name */}
                                <div className="agent-nested-recipient-name">
                                    {getRecipientName(message.id)}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabItem>

                {/* HandoffAvailability Tab - Only shown when in a group */}
                <TabItem label="Availability" id={`wf-${flowId}-wa-${id}-nested-chat-availability`}>
                    <HandoffAvailability
                        available={nestedChats[0]?.available || defaultAvailability}
                        contextVariables={contextVariables}
                        onDataChange={onAvailabilityChange}
                        aria-label="Handoff availability settings"
                    />
                </TabItem>
                {/* HandoffCondition Tab - Only shown when in a group */}
                <TabItem label="Condition" id={`wf-${flowId}-wa-${id}-nested-chat-condition`}>
                    <HandoffCondition
                        contextVariables={contextVariables}
                        condition={nestedChats[0]?.condition || defaultCondition}
                        onDataChange={onConditionChange}
                        aria-label="Handoff condition settings"
                    />
                </TabItem>
            </TabItems>
        </div>
    );
});

WaldiezAgentGroupNestedChatTabs.displayName = "WaldiezAgentGroupNestedChatTabs";
