/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdgeNestedTabProps } from "@waldiez/containers/edges/modal/tabs/nested/types";
import { WaldiezMessage, WaldiezMessageType } from "@waldiez/models";

export const useWaldiezEdgeNestedTab = (props: WaldiezEdgeNestedTabProps) => {
    const { data, onDataChange } = props;
    const onNestedMessageTypeChange = (type: WaldiezMessageType) => {
        onDataChange({
            nestedChat: {
                reply: data.nestedChat.reply,
                message: {
                    type,
                    use_carryover: false,
                    content: null,
                    context: {},
                },
            },
        });
    };
    const onNestedReplyTypeChange = (type: WaldiezMessageType) => {
        onDataChange({
            nestedChat: {
                message: data.nestedChat.message,
                reply: {
                    type,
                    use_carryover: false,
                    content: null,
                    context: {},
                },
            },
        });
    };
    const onNestedMessageChange = (message: WaldiezMessage) => {
        onDataChange({
            nestedChat: {
                reply: data.nestedChat.reply,
                message,
            },
        });
    };
    const onNestedReplyChange = (reply: WaldiezMessage) => {
        onDataChange({
            nestedChat: {
                message: data.nestedChat.message,
                reply,
            },
        });
    };
    return {
        onNestedMessageTypeChange,
        onNestedReplyTypeChange,
        onNestedMessageChange,
        onNestedReplyChange,
    };
};
