/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentNestedChat } from "@waldiez/models";

type WaldiezAgentNestedChatsMessagesProps = {
    id: string;
    chat: WaldiezAgentNestedChat;
    selectOptions: {
        label: string;
        value: string;
    }[];
    selectedRecipient: {
        id: string;
        isReply: boolean;
    } | null;
    getEdgeLabel: (id: string) => string;
    onSelectedRecipientChange: (option: SingleValue<{ label: string; value: string }> | null) => void;
    onSelectedRecipientIsReplyChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onAddNestedChatConnection: () => void;
    onRemoveRecipient: (index: number) => void;
    onNestedChatRecipientMovedUp: (index: number) => void;
    onNestedChatRecipientMovedDown: (index: number) => void;
    getMessageLabel: (index: number) => string;
};

/**
 * Component for managing nested chat message configuration
 * Handles message selection, ordering, and reply settings
 */
export const WaldiezAgentNestedChatsMessages = memo((props: WaldiezAgentNestedChatsMessagesProps) => {
    const {
        id,
        chat,
        selectOptions,
        selectedRecipient,
        getEdgeLabel,
        onSelectedRecipientChange,
        onSelectedRecipientIsReplyChange,
        onAddNestedChatConnection,
        onRemoveRecipient,
        onNestedChatRecipientMovedUp,
        onNestedChatRecipientMovedDown,
        getMessageLabel,
    } = props;

    /**
     * Convert selected recipient to dropdown value format
     */
    const selectedRecipientValue = useMemo(
        () =>
            selectedRecipient
                ? {
                      label: getEdgeLabel(selectedRecipient.id),
                      value: selectedRecipient.id,
                  }
                : null,
        [selectedRecipient, getEdgeLabel],
    );

    /**
     * Button disabled state
     */
    const isAddButtonDisabled = !selectedRecipient || !selectedRecipient.id;

    /**
     * Empty messages state
     */
    const hasNoMessages = chat.messages.length === 0;

    return (
        <div className="nested-chat-messages" data-testid={`nested-chat-messages-${id}`}>
            {/* Information section */}
            <div className="info">
                <b>Messages:</b> Specifies which nested chat will be triggered. The final message is returned
                to the main chat. <br />
                <b>Agent's Reply:</b> Indicates the recipient of the trigger message. If selected, it is the
                second in the order. For example, if "User =&gt; Assistant" with the box ticked, the message
                is sent to the User; otherwise, it is sent to the Assistant.
            </div>

            {/* Message configuration section */}
            <label htmlFor={`new-nested-chat-select-recipient-${id}`} className="nested-chat-messages-label">
                Messages:
            </label>

            {/* Message addition controls */}
            <div className="nested-chats-add-message">
                <div className="nested-chat-recipients margin-right-10">
                    <label htmlFor={`new-nested-chat-select-recipient-${id}`} className="hidden">
                        Recipient
                    </label>
                    <Select
                        options={selectOptions}
                        onChange={onSelectedRecipientChange}
                        value={selectedRecipientValue}
                        inputId={`new-nested-chat-select-recipient-${id}`}
                        aria-label="Select message recipient"
                    />
                </div>

                <label
                    className="checkbox-label nested-chat-agent-reply-label"
                    htmlFor={`new-nested-chat-recipient-is-agent-reply-${id}`}
                >
                    <div>Agent's Reply</div>
                    <input
                        id={`new-nested-chat-recipient-is-agent-reply-${id}`}
                        type="checkbox"
                        checked={selectedRecipient?.isReply ?? false}
                        onChange={onSelectedRecipientIsReplyChange}
                        data-testid={`new-nested-chat-recipient-is-agent-reply-${id}`}
                        aria-label="Mark as agent reply"
                    />
                    <div className="checkbox"></div>
                </label>

                <div className="nested-chat-add-button">
                    <button
                        type="button"
                        title="Add"
                        className="add-nested-chat"
                        disabled={isAddButtonDisabled}
                        onClick={onAddNestedChatConnection}
                        data-testid={`new-nested-chat-add-recipient-${id}`}
                        aria-label="Add message to nested chat"
                    >
                        Add
                    </button>
                </div>
            </div>

            {/* Message list section */}
            <div className="nested-chats-registered-messages">
                {hasNoMessages ? (
                    <div className="nested-chat-registered-message">No messages to include</div>
                ) : (
                    <div className="flex-1 messages-list">
                        {chat.messages.map((target, index) => (
                            <MessageListItem
                                key={`${target.id}-${index}`}
                                target={target}
                                index={index}
                                messageCount={chat.messages.length}
                                getMessageLabel={getMessageLabel}
                                onMoveUp={onNestedChatRecipientMovedUp}
                                onMoveDown={onNestedChatRecipientMovedDown}
                                onRemove={onRemoveRecipient}
                                id={id}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

/**
 * Message list item component
 * Extracted for better code organization and readability
 */
const MessageListItem = memo(
    ({
        target,
        index,
        messageCount,
        getMessageLabel,
        onMoveUp,
        onMoveDown,
        onRemove,
        id,
    }: {
        target: { id: string; isReply: boolean };
        index: number;
        messageCount: number;
        getMessageLabel: (index: number) => string;
        onMoveUp: (index: number) => void;
        onMoveDown: (index: number) => void;
        onRemove: (index: number) => void;
        id: string;
    }) => {
        // Determine if move buttons should be shown
        const canMoveUp = messageCount > 1 && index !== 0;
        const canMoveDown = messageCount > 1 && index !== messageCount - 1;

        return (
            <div
                className="nested-chat-registered-message"
                data-testid={`nested-chat-message-${id}-${index}`}
            >
                {/* Message label with optional reply indicator */}
                <span className="message-label">
                    {getMessageLabel(index)}
                    {target.isReply && <span className="reply-indicator"> (Reply)</span>}
                </span>

                {/* Message actions */}
                <div className="nested-chat-message-actions">
                    {/* Move Up Button */}
                    {canMoveUp && (
                        <div className="nested-chat-reorder">
                            <button
                                type="button"
                                title="Move up"
                                onClick={() => onMoveUp(index)}
                                data-testid={`nested-chat-reorder-up-${index}`}
                                aria-label={`Move message ${index + 1} up`}
                            >
                                &uarr;
                            </button>
                        </div>
                    )}

                    {/* Move Down Button */}
                    {canMoveDown && (
                        <div className="nested-chat-reorder">
                            <button
                                type="button"
                                title="Move down"
                                onClick={() => onMoveDown(index)}
                                data-testid={`nested-chat-reorder-down-${index}`}
                                aria-label={`Move message ${index + 1} down`}
                            >
                                &darr;
                            </button>
                        </div>
                    )}

                    {/* Remove Button */}
                    <div className="nested-chat-remove">
                        <button
                            type="button"
                            title="Remove"
                            onClick={() => onRemove(index)}
                            data-testid={`remove-nested-chat-recipient-${index}`}
                            aria-label={`Remove message ${index + 1}`}
                        >
                            Remove
                        </button>
                    </div>
                </div>
            </div>
        );
    },
);

WaldiezAgentNestedChatsMessages.displayName = "WaldiezAgentNestedChatsMessages";
MessageListItem.displayName = "MessageListItem";
