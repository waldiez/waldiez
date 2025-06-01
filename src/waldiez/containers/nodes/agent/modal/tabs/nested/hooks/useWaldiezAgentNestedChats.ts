/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { MultiValue, SingleValue } from "@waldiez/components";
import { WaldiezAgentNestedChatsProps } from "@waldiez/containers/nodes/agent/modal/tabs/nested/types";
import { WaldiezAgentNestedChat, WaldiezEdge } from "@waldiez/models";

/**
 * Custom hook for managing Waldiez Agent Nested Chats functionality
 * Handles chat triggering, messages, and recipient configuration
 */
export const useWaldiezAgentNestedChats = (props: WaldiezAgentNestedChatsProps) => {
    const { data, onDataChange, agentConnections } = props;

    const getDefaultChat = (): WaldiezAgentNestedChat => {
        return {
            messages: [],
            triggeredBy: [],
            condition: {
                conditionType: "string_llm",
                prompt: "",
            },
            available: {
                type: "none",
                value: "",
            },
        };
    };
    /**
     * Initialize nested chats if none exist
     * This ensures that the first chat is always present
     */
    useEffect(() => {
        // If no nested chat at all, or first one is empty — initialize
        if (data.nestedChats.length === 0) {
            onDataChange({
                nestedChats: [getDefaultChat()],
            });
        }
    }, [data.nestedChats, onDataChange]);
    /**
     * Get initial chat configuration or create a default one
     */
    const chat = useMemo(
        (): WaldiezAgentNestedChat => (data.nestedChats.length > 0 ? data.nestedChats[0] : getDefaultChat()),
        [data.nestedChats],
    );

    /**
     * Local state for recipient and trigger selection
     */
    const [selectedRecipient, setSelectedRecipient] = useState<{
        id: string;
        isReply: boolean;
    } | null>(null);

    const [selectedTriggers, setSelectedTriggers] = useState(chat.triggeredBy);

    /**
     * Extract connection sources and targets for easier access
     */
    const { sources, targets } = agentConnections;

    /**
     * Combine nodes and edges from sources and targets, removing duplicates
     */
    const allNodes = useMemo(
        () => [...new Map([...sources.nodes, ...targets.nodes].map(node => [node.id, node])).values()],
        [sources.nodes, targets.nodes],
    );

    const allEdges = useMemo(() => sources.edges.concat(targets.edges), [sources.edges, targets.edges]);

    /**
     * Generate trigger and message selection options
     */
    const triggerSelectOptions = useMemo(
        () =>
            allNodes.map(node => ({
                label: node.data?.label as string,
                value: node.id,
            })),
        [allNodes],
    );

    const messageSelectOptions = useMemo(
        () =>
            allEdges.map((edge: WaldiezEdge) => ({
                label: edge.data?.label as string,
                value: edge.id,
            })),
        [allEdges],
    );

    /**
     * Get edge label by ID
     */
    const getEdgeLabel = useCallback(
        (id: string) => {
            const edge = allEdges.find(e => e.id === id);
            return (edge?.data?.label as string) || "Unknown";
        },
        [allEdges],
    );

    /**
     * Get message label by index
     */
    const getMessageLabel = useCallback(
        (index: number) => {
            if (index < 0 || index >= chat.messages.length) {
                return "Invalid message";
            }
            return getEdgeLabel(chat.messages[index].id);
        },
        [chat.messages, getEdgeLabel],
    );

    /**
     * Add a new nested chat connection
     */
    const onAddNestedChatConnection = useCallback(() => {
        if (!selectedRecipient) {
            return;
        }

        // Check if the exact recipient is already registered
        const isDuplicate = chat.messages.some(
            recipient =>
                recipient.id === selectedRecipient.id && recipient.isReply === selectedRecipient.isReply,
        );

        if (isDuplicate) {
            return;
        }

        // Create new chat with added message
        const newChat = {
            messages: [
                ...chat.messages,
                {
                    id: selectedRecipient.id,
                    isReply: selectedRecipient.isReply,
                },
            ],
            triggeredBy: chat.triggeredBy,
            condition: chat.condition,
            available: chat.available,
        };

        onDataChange({
            nestedChats: [newChat],
        });
    }, [selectedRecipient, chat, onDataChange]);

    /**
     * Remove a recipient at specified index
     */
    const onRemoveRecipient = useCallback(
        (index: number) => {
            // Create new chat with filtered messages
            const newChat = {
                ...chat,
                messages: chat.messages.filter((_, i) => i !== index),
            };

            onDataChange({
                nestedChats: [newChat],
            });
        },
        [chat, onDataChange],
    );

    /**
     * Move a recipient up in the list
     */
    const onNestedChatRecipientMovedUp = useCallback(
        (index: number) => {
            if (index <= 0 || index >= chat.messages.length) {
                return;
            }

            // Swap messages at index and index-1
            const recipients = [...chat.messages];
            const temp = recipients[index];
            recipients[index] = recipients[index - 1];
            recipients[index - 1] = temp;

            const newChat = {
                ...chat,
                messages: recipients,
            };

            onDataChange({
                nestedChats: [newChat],
            });
        },
        [chat, onDataChange],
    );

    /**
     * Move a recipient down in the list
     */
    const onNestedChatRecipientMovedDown = useCallback(
        (index: number) => {
            if (index < 0 || index >= chat.messages.length - 1) {
                return;
            }

            // Swap messages at index and index+1
            const recipients = [...chat.messages];
            const temp = recipients[index];
            recipients[index] = recipients[index + 1];
            recipients[index + 1] = temp;

            const newChat = {
                ...chat,
                messages: recipients,
            };

            onDataChange({
                nestedChats: [newChat],
            });
        },
        [chat, onDataChange],
    );

    /**
     * Handle trigger selection changes
     */
    const onSelectedTriggersChange = useCallback(
        (options: MultiValue<{ label: string; value: string }> | null) => {
            // Update local triggers state
            if (options) {
                setSelectedTriggers(options.map(option => option.value));
            } else {
                setSelectedTriggers([]);
            }

            // Create new chat with updated triggers
            const newChat = {
                ...chat,
                messages: options ? chat.messages : [],
                triggeredBy: options ? options.map(option => option.value) : [],
            };

            onDataChange({
                nestedChats: [newChat],
            });
        },
        [chat, onDataChange],
    );

    /**
     * Handle recipient selection changes
     */
    const onSelectedRecipientChange = useCallback(
        (option: SingleValue<{ label: string; value: string }> | null) => {
            if (option && option.value) {
                setSelectedRecipient(prevState => ({
                    id: option.value,
                    isReply: prevState?.isReply || false,
                }));
            } else {
                setSelectedRecipient(null);
            }
        },
        [],
    );

    /**
     * Handle changes to the "is reply" checkbox
     */
    const onSelectedRecipientIsReplyChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (selectedRecipient) {
                setSelectedRecipient(prevState => ({
                    ...prevState!,
                    isReply: event.target.checked,
                }));
            }
        },
        [selectedRecipient],
    );

    return {
        chat,
        triggerSelectOptions,
        messageSelectOptions,
        selectedTriggers,
        selectedRecipient,
        onSelectedTriggersChange,
        onSelectedRecipientChange,
        onSelectedRecipientIsReplyChange,
        onAddNestedChatConnection,
        onRemoveRecipient,
        onNestedChatRecipientMovedUp,
        onNestedChatRecipientMovedDown,
        getMessageLabel,
        getEdgeLabel,
    };
};
