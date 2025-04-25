/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { MultiValue, SingleValue } from "@waldiez/components";
import { WaldiezAgentNestedChatsProps } from "@waldiez/containers/nodes/agent/modal/tabs/nestedChats/types";
import { WaldiezAgentNestedChat, WaldiezEdge } from "@waldiez/models";

export const useWaldiezAgentNestedChats = (props: WaldiezAgentNestedChatsProps) => {
    const { data, onDataChange, agentConnections } = props;
    const chat: WaldiezAgentNestedChat =
        data.nestedChats.length > 0
            ? data.nestedChats[0]
            : ({ triggeredBy: [], messages: [] } as WaldiezAgentNestedChat);
    const [selectedRecipient, setSelectedRecipient] = useState<{
        id: string;
        isReply: boolean;
    } | null>(null);
    const [selectedTriggers, setSelectedTriggers] = useState(chat.triggeredBy);
    const sources = agentConnections.source;
    const targets = agentConnections.target;
    const allNodes = [...new Map([...sources.nodes, ...targets.nodes].map(node => [node.id, node])).values()];
    const allEdges = sources.edges.concat(targets.edges);
    const triggerSelectOptions = allNodes.map(node => {
        return {
            label: node.data?.label as string,
            value: node.id,
        };
    });
    const messageSelectOptions = allEdges.map((edge: WaldiezEdge) => {
        return {
            label: edge.data?.label as string,
            value: edge.id,
        };
    });
    const getEdgeLabel = (id: string) => {
        const edge = allEdges.find(e => e.id === id);
        return edge?.data?.label as string;
    };
    const getMessageLabel = (index: number) => {
        return getEdgeLabel(chat.messages[index].id);
    };
    const onAddNestedChatConnection = () => {
        if (selectedRecipient) {
            // check if the exact recipient is already registered
            if (
                chat.messages.find(
                    recipient =>
                        recipient.id === selectedRecipient.id &&
                        recipient.isReply === selectedRecipient.isReply,
                )
            ) {
                return;
            }
            const newChat = {
                messages: [
                    ...chat.messages,
                    {
                        id: selectedRecipient.id,
                        isReply: selectedRecipient.isReply,
                    },
                ],
                triggeredBy: chat.triggeredBy,
            } as WaldiezAgentNestedChat;
            onDataChange({
                nestedChats: [newChat],
            });
        }
    };
    const onRemoveRecipient = (index: number) => {
        const newChat = {
            messages: chat.messages.filter((_, i) => i !== index),
            triggeredBy: chat.triggeredBy,
        } as WaldiezAgentNestedChat;
        onDataChange({
            nestedChats: [newChat],
        });
    };
    const onNestedChatRecipientMovedUp = (index: number) => {
        const recipients = [...chat.messages];
        const temp = recipients[index];
        recipients[index] = recipients[index - 1];
        recipients[index - 1] = temp;
        const newChat = {
            ...chat,
            messages: recipients,
        } as WaldiezAgentNestedChat;
        onDataChange({
            nestedChats: [newChat],
        });
    };
    const onNestedChatRecipientMovedDown = (index: number) => {
        const recipients = [...chat.messages];
        const temp = recipients[index];
        recipients[index] = recipients[index + 1];
        recipients[index + 1] = temp;
        const newChat = {
            ...chat,
            messages: recipients,
        } as WaldiezAgentNestedChat;
        onDataChange({
            nestedChats: [newChat],
        });
    };
    const onSelectedTriggersChange = (options: MultiValue<{ label: string; value: string }> | null) => {
        if (options) {
            setSelectedTriggers(options.map(option => option.value));
        } else {
            setSelectedTriggers([]);
        }
        const newChat = {
            messages: options ? chat.messages : [],
            triggeredBy: options ? options.map(option => option.value) : [],
        } as WaldiezAgentNestedChat;
        onDataChange({
            nestedChats: [newChat],
        });
    };
    const onSelectedRecipientChange = (option: SingleValue<{ label: string; value: string }> | null) => {
        if (option && option.value) {
            setSelectedRecipient({
                id: option.value,
                isReply: selectedRecipient?.isReply || false,
            });
        } else {
            setSelectedRecipient(null);
        }
    };
    const onSelectedRecipientIsReplyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (selectedRecipient) {
            setSelectedRecipient({
                id: selectedRecipient.id,
                isReply: event.target.checked,
            });
        }
    };
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
