/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import type { WaldiezEdgeMessageTabProps } from "@waldiez/containers/edges/modal/tabs/message/types";
import { WaldiezMessage, type WaldiezMessageType } from "@waldiez/models";

/**
 * Custom hook for managing the message tab of the edge modal
 */
export const useWaldiezEdgeMessageTab = (props: WaldiezEdgeMessageTabProps) => {
    const { data, onDataChange } = props;

    /**
     * Handle message type change
     * Resets message to default values for the new type
     */
    const onMessageTypeChange = useCallback(
        (type: WaldiezMessageType) => {
            onDataChange({
                message: {
                    ...data.message,
                    type,
                    useCarryover: false,
                    content: null,
                    context: {},
                },
            });
        },
        [data.message, onDataChange],
    );

    /**
     * Update the entire message object
     */
    const onMessageChange = useCallback(
        (message: WaldiezMessage) => {
            onDataChange({ message });
        },
        [onDataChange],
    );

    /**
     * Add a new context entry to the message
     */
    const onAddMessageContextEntry = useCallback(
        (key: string, value: string) => {
            onDataChange({
                message: {
                    ...data.message,
                    context: {
                        ...data.message.context,
                        [key]: value,
                    },
                },
            });
        },
        [data.message, onDataChange],
    );

    /**
     * Remove a context entry from the message
     */
    const onRemoveMessageContextEntry = useCallback(
        (key: string) => {
            // Create a new context object without the specified key
            const { [key]: _removed, ...restContext } = data.message.context;

            onDataChange({
                message: {
                    ...data.message,
                    context: restContext,
                },
            });
        },
        [data.message, onDataChange],
    );

    /**
     * Update all context entries at once
     */
    const onUpdateMessageContextEntries = useCallback(
        (entries: Record<string, unknown>) => {
            onDataChange({
                message: {
                    ...data.message,
                    context: entries,
                },
            });
        },
        [data.message, onDataChange],
    );

    return {
        onMessageTypeChange,
        onMessageChange,
        onAddMessageContextEntry,
        onRemoveMessageContextEntry,
        onUpdateMessageContextEntries,
    };
};
