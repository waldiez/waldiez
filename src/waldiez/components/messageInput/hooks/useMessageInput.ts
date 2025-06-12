/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { MessageInputProps } from "@waldiez/components/messageInput/types";
import { WaldiezMessage } from "@waldiez/models";

/**
 * Custom hook for handling message input functionality
 */
export const useMessageInput = (props: MessageInputProps) => {
    const {
        current,
        onMessageChange: handleEdgeMessageChange,
        onAddContextEntry: handleAddContextEntry,
        onRemoveContextEntry: handleRemoveContextEntry,
        onUpdateContextEntries: handleUpdateContextEntries,
    } = props;

    // Base message change handler
    const onMessageChange = useCallback(
        (message: WaldiezMessage) => {
            handleEdgeMessageChange(message);
        },
        [handleEdgeMessageChange],
    );

    // Context entry handlers
    const onAddContextEntry = useCallback(
        (key: string, value: string) => {
            handleAddContextEntry?.(key, value);
        },
        [handleAddContextEntry],
    );

    const onRemoveContextEntry = useCallback(
        (key: string) => {
            handleRemoveContextEntry?.(key);
        },
        [handleRemoveContextEntry],
    );

    const onUpdateContextEntries = useCallback(
        (entries: Record<string, unknown>) => {
            handleUpdateContextEntries?.(entries);
        },
        [handleUpdateContextEntries],
    );

    // Content update handlers for different message types
    const onContentUpdate = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onMessageChange({
                type: "string",
                useCarryover: current.useCarryover,
                content: e.target.value,
                context: current.context,
            });
        },
        [current.useCarryover, current.context, onMessageChange],
    );

    const onRagProblemUpdate = useCallback(
        (e: React.ChangeEvent<HTMLTextAreaElement>) => {
            onMessageChange({
                type: "rag_message_generator",
                content: null,
                useCarryover: current.useCarryover,
                context: {
                    ...current.context,
                    problem: e.target.value,
                },
            });
        },
        [current.useCarryover, current.context, onMessageChange],
    );

    const onMethodContentUpdate = useCallback(
        (value: string | undefined) => {
            if (!value) {
                return;
            }

            onMessageChange({
                type: "method",
                useCarryover: current.useCarryover,
                content: value,
                context: current.context,
            });
        },
        [current.useCarryover, current.context, onMessageChange],
    );

    const onUseCarryoverChange = useCallback(
        (checked: boolean) => {
            onMessageChange({
                type: current.type,
                useCarryover: checked,
                content: current.content,
                context: current.context,
            });
        },
        [current.type, current.content, current.context, onMessageChange],
    );

    return {
        onContentUpdate,
        onRagProblemUpdate,
        onMethodContentUpdate,
        onUseCarryoverChange,
        onAddContextEntry,
        onRemoveContextEntry,
        onUpdateContextEntries,
    };
};
