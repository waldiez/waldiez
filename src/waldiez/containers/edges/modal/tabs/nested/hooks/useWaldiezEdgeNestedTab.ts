/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import type { WaldiezEdgeNestedTabProps } from "@waldiez/containers/edges/modal/tabs/nested/types";
import { WaldiezMessage, type WaldiezMessageType } from "@waldiez/models";

/**
 * Custom hook for managing the nested chat tab of the edge modal
 */
export const useWaldiezEdgeNestedTab = (props: WaldiezEdgeNestedTabProps) => {
    const { data, onDataChange } = props;

    // Memoize current nested chat data for dependency tracking
    const nestedChat = useMemo(() => data.nestedChat, [data.nestedChat]);

    /**
     * Create a default message with the specified type
     */
    const createDefaultMessage = useCallback(
        (type: WaldiezMessageType): WaldiezMessage => ({
            type,
            useCarryover: false,
            content: null,
            context: {},
        }),
        [],
    );

    /**
     * Update nested message type and reset to defaults
     */
    const onNestedMessageTypeChange = useCallback(
        (type: WaldiezMessageType) => {
            onDataChange({
                nestedChat: {
                    reply: nestedChat.reply,
                    message: createDefaultMessage(type),
                },
            });
        },
        [nestedChat.reply, onDataChange, createDefaultMessage],
    );

    /**
     * Update nested reply type and reset to defaults
     */
    const onNestedReplyTypeChange = useCallback(
        (type: WaldiezMessageType) => {
            onDataChange({
                nestedChat: {
                    message: nestedChat.message,
                    reply: createDefaultMessage(type),
                },
            });
        },
        [nestedChat.message, onDataChange, createDefaultMessage],
    );

    /**
     * Update the entire nested message
     */
    const onNestedMessageChange = useCallback(
        (message: WaldiezMessage) => {
            onDataChange({
                nestedChat: {
                    reply: nestedChat.reply,
                    message,
                },
            });
        },
        [nestedChat.reply, onDataChange],
    );

    /**
     * Update the entire nested reply
     */
    const onNestedReplyChange = useCallback(
        (reply: WaldiezMessage) => {
            onDataChange({
                nestedChat: {
                    message: nestedChat.message,
                    reply,
                },
            });
        },
        [nestedChat.message, onDataChange],
    );

    return {
        onNestedMessageTypeChange,
        onNestedReplyTypeChange,
        onNestedMessageChange,
        onNestedReplyChange,
    };
};
