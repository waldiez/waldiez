/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MessageInput } from "@waldiez/components";
import { useWaldiezEdgeMessageTab } from "@waldiez/containers/edges/modal/tabs/message/hooks";
import { WaldiezEdgeMessageTabProps } from "@waldiez/containers/edges/modal/tabs/message/types";

export const WaldiezEdgeMessageTab = (props: WaldiezEdgeMessageTabProps) => {
    const { edgeId, data, darkMode, skipRagOption, skipCarryoverOption } = props;
    const {
        onMessageTypeChange,
        onMessageChange,
        onAddMessageContextEntry,
        onRemoveMessageContextEntry,
        onUpdateMessageContextEntries,
    } = useWaldiezEdgeMessageTab(props);
    return (
        <div className="margin-top-10">
            <MessageInput
                darkMode={darkMode}
                current={data.message}
                skipRagOption={skipRagOption}
                skipCarryoverOption={skipCarryoverOption || false}
                selectLabel="Message Type:"
                selectTestId={`select-message-type-${edgeId}`}
                defaultContent={DEFAULT_METHOD_MESSAGE_CONTENT}
                notNoneLabel="Message:"
                notNoneLabelInfo="The message to be used when the chat is initiated."
                includeContext={true}
                onTypeChange={onMessageTypeChange}
                onMessageChange={onMessageChange}
                onAddContextEntry={onAddMessageContextEntry}
                onRemoveContextEntry={onRemoveMessageContextEntry}
                onUpdateContextEntries={onUpdateMessageContextEntries}
            />
        </div>
    );
};

const DEFAULT_METHOD_MESSAGE_CONTENT = `"""Custom message function."""
# provide the message to be sent when the sender and the recipient are connected
# complete the \`callable_message\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the:
# final message: (str) or a dictionary with the final message and additional data (dict)
#
# the recipient and the sender are 'autogen.ConversableAgent' objects
# the context is generated from the sender's initiate_chat additional keyword arguments
# example:
# def callable_message(sender, recipient, context):
#   # type: (ConversableAgent, ConversableAgent, dict) -> Union[str, Dict]
#   carryover = context.get("carryover", "")
#    if isinstance(carryover, list):
#        carryover = carryover[-1]
#    final_msg = "Write a blogpost." + "\\nContext: \\n" + carryover
#    return final_msg
#
def callable_message(sender, recipient, context):
    """Complete the message function"""
    ...
`;
