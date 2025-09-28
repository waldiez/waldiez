/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MessageInput, TabItem, TabItems } from "@waldiez/components";
import { useWaldiezEdgeNestedTab } from "@waldiez/containers/edges/modal/tabs/nested/hooks";
import type { WaldiezEdgeNestedTabProps } from "@waldiez/containers/edges/modal/tabs/nested/types";

export const WaldiezEdgeNestedTab = (props: WaldiezEdgeNestedTabProps) => {
    const { flowId, edgeId, darkMode, data } = props;
    const { onNestedMessageTypeChange, onNestedMessageChange, onNestedReplyTypeChange, onNestedReplyChange } =
        useWaldiezEdgeNestedTab(props);
    const currentMessageInput = data.nestedChat?.message ?? {
        type: "none",
        useCarryover: false,
        content: null,
        context: {},
    };
    const currentReplyInput = data.nestedChat?.reply ?? {
        type: "none",
        useCarryover: false,
        content: null,
        context: {},
    };
    // not in nested (for now?), if we want to add it,
    // we must add the context in the message's config argument
    // in `def nested_chat_message(recipient, messages, sender, config):`
    // set config['context'] = context
    // this makes sense only if the type is not `method` and not `none` (i.e. text or or carryover + text)
    // so for now a custom method can be used to handle the context
    const noOp = () => {};
    return (
        <div className="flex flex-col margin-top-10">
            <div className="info margin-bottom-10">
                When the connection is used in a nested chat, you can specify the messages to be sent and
                received, from the source and the target respectively.
            </div>
            <TabItems activeTabIndex={0}>
                <TabItem label="Message" id={`wc-${flowId}-edge-nested-chat-${edgeId}-message`}>
                    <div className="flex flex-col">
                        <MessageInput
                            darkMode={darkMode}
                            current={currentMessageInput}
                            selectLabel="Message Type:"
                            selectTestId={`select-nested-message-type-${edgeId}`}
                            defaultContent={DEFAULT_NESTED_CHAT_MESSAGE_METHOD_CONTENT}
                            notNoneLabel="Message:"
                            notNoneLabelInfo="The message to be sent from the source."
                            includeContext={false}
                            skipCarryoverOption={true}
                            skipRagOption={true}
                            onTypeChange={onNestedMessageTypeChange}
                            onMessageChange={onNestedMessageChange}
                            onAddContextEntry={noOp}
                            onRemoveContextEntry={noOp}
                            onUpdateContextEntries={noOp}
                        />
                    </div>
                </TabItem>
                <TabItem label="Reply" id={`wc-${flowId}-edge-nested-chat-${edgeId}-reply`}>
                    <div className="flex flex-col">
                        <MessageInput
                            darkMode={darkMode}
                            current={currentReplyInput}
                            selectLabel="Reply Type:"
                            selectTestId={`select-nested-reply-type-${edgeId}`}
                            defaultContent={DEFAULT_NESTED_CHAT_REPLY_METHOD_CONTENT}
                            notNoneLabel="Reply:"
                            notNoneLabelInfo="The message to be sent from the target."
                            skipCarryoverOption={true}
                            skipRagOption={true}
                            includeContext={false} // not in nested (for now?)
                            onTypeChange={onNestedReplyTypeChange}
                            onMessageChange={onNestedReplyChange}
                            onAddContextEntry={noOp}
                            onRemoveContextEntry={noOp}
                            onUpdateContextEntries={noOp}
                        />
                    </div>
                </TabItem>
            </TabItems>
        </div>
    );
};

export const DEFAULT_NESTED_CHAT_MESSAGE_METHOD_CONTENT = `"""Custom nested chat message function."""
# provide the message to be sent from the sender to the recipient in a nested chat
# complete the \`nested_chat_message\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the final message.
# example:
# def nested_chat_message(recipient, messages, sender, config):
#    # type: (ConversableAgent, Optional[list[dict]], Optional[ConversableAgent], Optional[dict]) -> str | dict
#    return f"""Review the following content.
#            \\n\\n {recipient.chat_messages_for_summary(sender)[-1]['content']}"""
#
def nested_chat_message(recipient, messages, sender, config):
    """Complete the nested chat message function"""
    ...
`;
export const DEFAULT_NESTED_CHAT_REPLY_METHOD_CONTENT = `"""Custom nested chat reply function."""
# provide the reply to be sent when the recipient replies to the sender in a nested chat
# complete the \`nested_chat_reply\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the agent's reply.
# example:
# def nested_chat_reply(recipient, messages, sender, config):
#    # type: (ConversableAgent, Optional[list[dict]], Optional[ConversableAgent], Optional[dict]) -> str | dict
#    last_message = messages[-1]['content']
#    return f"Great! You said: {last_message}"
#
def nested_chat_reply(recipient, messages, sender, config):
    """Complete the nested chat reply function"""
    ...
`;
