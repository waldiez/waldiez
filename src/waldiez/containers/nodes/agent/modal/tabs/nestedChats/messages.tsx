/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentNestedChat } from "@waldiez/models";

export const WaldiezAgentNestedChatsMessages = (props: {
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
}) => {
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
    const selectedRecipientValue = selectedRecipient
        ? {
              label: getEdgeLabel(selectedRecipient.id),
              value: selectedRecipient.id,
          }
        : null;
    return (
        <div className="nested-chat-messages margin-top-10">
            <div className="info margin-bottom-10">
                <b>Messages:</b> Specifies which nested chat will be triggered. The final message is returned
                to the main chat. <br />
                <b>Agent's Reply:</b> Indicates the recipient of the trigger message. If selected, it is the
                second in the order. For example, if "User =&gt; Assistant" with the box ticked, the message
                is sent to the User; otherwise, it is sent to the Assistant.
            </div>
            <label className="nested-chat-messages-label">Messages:</label>
            <div className="nested-chats-add-message">
                <div className="nested-chat-recipients margin-right-10">
                    <label className="hidden" htmlFor={`new-nested-chat-select-recipient-${id}`}>
                        Recipient
                    </label>
                    <Select
                        options={selectOptions}
                        onChange={onSelectedRecipientChange}
                        value={selectedRecipientValue}
                        inputId={`new-nested-chat-select-recipient-${id}`}
                    />
                </div>
                <label className="checkbox-label nested-chat-agent-reply-label">
                    <div>Agent's Reply</div>
                    <input
                        type="checkbox"
                        checked={selectedRecipient?.isReply ?? false}
                        onChange={onSelectedRecipientIsReplyChange}
                        data-testid={`new-nested-chat-recipient-is-agent-reply-${id}`}
                    />
                    <div className="checkbox"></div>
                </label>
                <div className="nested-chat-add-button">
                    <button
                        type="button"
                        title="Add"
                        className="add-nested-chat"
                        disabled={!selectedRecipient || !selectedRecipient.id}
                        onClick={onAddNestedChatConnection}
                        data-testid={`new-nested-chat-add-recipient-${id}`}
                    >
                        Add
                    </button>
                </div>
            </div>
            <div className="nested-chats-registered-messages">
                {chat.messages.length === 0 ? (
                    <div className="nested-chat-registered-message">No messages to include</div>
                ) : (
                    <div className="flex-1">
                        {chat.messages.map((target, index) => {
                            return (
                                <div
                                    key={`${target.id}-${index}`}
                                    className="nested-chat-registered-message"
                                    data-testid={`nested-chat-message-${id}-0`}
                                >
                                    {getMessageLabel(index)}
                                    {target.isReply ? " (Reply)" : ""}
                                    <div className="nested-chat-message-actions">
                                        {chat.messages.length > 1 && index !== 0 && (
                                            <div className="nested-chat-reorder">
                                                <button
                                                    type="button"
                                                    title="Move up"
                                                    onClick={onNestedChatRecipientMovedUp.bind(null, index)}
                                                    data-testid={`nested-chat-reorder-up-${index}`}
                                                >
                                                    &uarr;
                                                </button>
                                            </div>
                                        )}
                                        {chat.messages.length > 1 && index !== chat.messages.length - 1 && (
                                            <div className="nested-chat-reorder">
                                                <button
                                                    type="button"
                                                    title="Move down"
                                                    onClick={onNestedChatRecipientMovedDown.bind(null, index)}
                                                    data-testid={`nested-chat-reorder-down-${index}`}
                                                >
                                                    &darr;
                                                </button>
                                            </div>
                                        )}
                                        <div className="nested-chat-remove">
                                            <button
                                                type="button"
                                                title="Remove"
                                                onClick={onRemoveRecipient.bind(null, index)}
                                                data-testid={`remove-nested-chat-recipient-${index}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};
