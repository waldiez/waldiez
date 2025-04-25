/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezSwarmAfterWorkOption,
    WaldiezSwarmAfterWorkRecipientType,
} from "@waldiez/models/Agent/Swarm/types";

export class WaldiezSwarmAfterWork {
    recipientType: WaldiezSwarmAfterWorkRecipientType;
    recipient: string | WaldiezSwarmAfterWorkOption;

    constructor(props: {
        recipientType: WaldiezSwarmAfterWorkRecipientType;
        recipient: string | WaldiezSwarmAfterWorkOption;
    }) {
        this.recipientType = props.recipientType;
        this.recipient = props.recipient;
    }
}

export const DEFAULT_CUSTOM_AFTER_WORK_RECIPIENT_METHOD_CONTENT = `"""Custom after work recipient function."""
# provide the function to define the recipient of the after work property
# complete the \`custom_after_work\` below. Do not change the name or the arguments of the function.
# only complete the function body and the docstring and return the recipient.
# example:
# def custom_after_work(
#     last_speaker: ConversableAgent,
#     messages: List[Dict[str, Any]],
#     groupchat: GroupChat,
# ) -> Union[AfterWorkOption, ConversableAgent, str]:
#     """Complete the custom after work recipient function"""
#     # return last_speaker
#     return "TERMINATE"
#
#
def custom_after_work(
    last_speaker: ConversableAgent,
    messages: List[Dict[str, Any]],
    groupchat: GroupChat,
) -> Union[AfterWorkOption, ConversableAgent, str]:
    """Complete the custom after work recipient function"""
    ...
`;
