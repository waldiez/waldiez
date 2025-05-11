/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useWaldiezAgentNestedChats } from "@waldiez/containers/nodes/agent/modal/tabs/nested/hooks";
import { WaldiezAgentNestedChatsMessages } from "@waldiez/containers/nodes/agent/modal/tabs/nested/messages";
import { WaldiezAgentNestedChatsTriggers } from "@waldiez/containers/nodes/agent/modal/tabs/nested/triggers";
import { WaldiezAgentNestedChatsProps } from "@waldiez/containers/nodes/agent/modal/tabs/nested/types";

export const WaldiezAgentNestedChats = (props: WaldiezAgentNestedChatsProps) => {
    const { id } = props;
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
    return (
        <div className="agent-panel agent-nestedChats-panel margin-top--10">
            <WaldiezAgentNestedChatsTriggers
                id={id}
                selectedTriggers={selectedTriggers}
                onSelectedTriggersChange={onSelectedTriggersChange}
                selectOptions={triggerSelectOptions}
            />
            {chat.triggeredBy.length > 0 && (
                <>
                    <hr style={{ width: "100%", opacity: 0.5 }} />
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
};
