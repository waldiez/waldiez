/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MessageInputProps } from "@waldiez/components/messageInput/types";
import { WaldiezMessage } from "@waldiez/models";

export const useMessageInput = (props: MessageInputProps) => {
    const {
        current,
        onMessageChange: handleEdgeMessageChange,
        onAddContextEntry: handleAddContextEntry,
        onRemoveContextEntry: handleRemoveContextEntry,
        onUpdateContextEntries: handleUpdateContextEntries,
    } = props;
    const onMessageChange = (message: WaldiezMessage) => {
        handleEdgeMessageChange(message);
    };
    const onAddContextEntry = (key: string, value: string) => {
        if (handleAddContextEntry) {
            handleAddContextEntry(key, value);
        }
    };
    const onRemoveContextEntry = (key: string) => {
        if (handleRemoveContextEntry) {
            handleRemoveContextEntry(key);
        }
    };
    const onUpdateContextEntries = (entries: Record<string, unknown>) => {
        if (handleUpdateContextEntries) {
            handleUpdateContextEntries(entries);
        }
    };
    const onContentUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onMessageChange({
            type: "string",
            useCarryover: current.useCarryover,
            content: e.target.value,
            context: current.context,
        });
    };
    const onRagProblemUpdate = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onMessageChange({
            type: "rag_message_generator",
            content: null,
            useCarryover: current.useCarryover,
            context: {
                ...current.context,
                problem: e.target.value,
            },
        });
    };
    const onMethodContentUpdate = (value: string | undefined) => {
        if (value) {
            onMessageChange({
                type: "method",
                useCarryover: current.useCarryover,
                content: value,
                context: current.context,
            });
        }
    };
    const onUseCarryoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onMessageChange({
            type: current.type,
            useCarryover: e.target.checked,
            content: current.content,
            context: current.context,
        });
    };
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
