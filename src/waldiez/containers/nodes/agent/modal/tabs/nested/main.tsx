/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { memo } from "react";

import { useWaldiezAgentNestedChats } from "@waldiez/containers/nodes/agent/modal/tabs/nested/hooks";
import { WaldiezAgentNestedChatsMessages } from "@waldiez/containers/nodes/agent/modal/tabs/nested/messages";
import { WaldiezAgentNestedChatsTriggers } from "@waldiez/containers/nodes/agent/modal/tabs/nested/triggers";
import { type WaldiezAgentNestedChatsProps } from "@waldiez/containers/nodes/agent/modal/tabs/nested/types";

/**
 * Component for configuring nested chat settings
 * Manages triggers and message exchange in nested chat configurations
 */
export const WaldiezAgentNestedChats = memo((props: WaldiezAgentNestedChatsProps) => {
    const { id } = props;

    // Get hook data and handlers
    const {
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
    } = useWaldiezAgentNestedChats(props);

    // Determine if messages section should be shown
    const showMessages = chat.triggeredBy.length > 0;

    return (
        <div
            className="agent-panel agent-nestedChats-panel margin-top-10"
            data-testid={`agent-nested-chats-panel-${id}`}
        >
            {/* Triggers Section */}
            <WaldiezAgentNestedChatsTriggers
                id={id}
                selectedTriggers={selectedTriggers}
                onSelectedTriggersChange={onSelectedTriggersChange}
                selectOptions={triggerSelectOptions}
            />

            {/* Messages Section - only shown when triggers are selected */}
            {showMessages && (
                <>
                    <hr
                        className="nested-chat-separator margin-top--10"
                        style={{ width: "100%", opacity: 0.3 }}
                        aria-hidden="true"
                    />
                    <WaldiezAgentNestedChatsMessages
                        id={id}
                        chat={chat}
                        selectOptions={messageSelectOptions}
                        selectedRecipient={selectedRecipient}
                        onSelectedRecipientChange={onSelectedRecipientChange}
                        onSelectedRecipientIsReplyChange={onSelectedRecipientIsReplyChange}
                        onAddNestedChatConnection={onAddNestedChatConnection}
                        onRemoveRecipient={onRemoveRecipient}
                        onNestedChatRecipientMovedUp={onNestedChatRecipientMovedUp}
                        onNestedChatRecipientMovedDown={onNestedChatRecipientMovedDown}
                        getMessageLabel={getMessageLabel}
                        getEdgeLabel={getEdgeLabel}
                    />
                </>
            )}
        </div>
    );
});

WaldiezAgentNestedChats.displayName = "WaldiezAgentNestedChats";
