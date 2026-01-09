/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezMessage, WaldiezMessageType } from "@waldiez/models/types";

/**
 * Props for the MessageInput component
 * @param current - The current message object
 * @param defaultContent - The default content for the message
 * @param darkMode - Boolean indicating if dark mode is enabled
 * @param selectLabel - Label for the message type select input
 * @param includeContext - Boolean indicating if context variables should be included
 * @param skipRagOption - Boolean indicating if the RAG option should be skipped
 * @param skipCarryoverOption - Boolean indicating if the carryover option should be skipped
 * @param selectTestId - Test ID for the message type select input
 * @param notNoneLabel - Optional label for the message input when type is not "none"
 * @param notNoneLabelInfo - Optional info for the message input when type is not "none"
 * @param skipNone - Boolean indicating if the "none" option should be skipped
 * @param onTypeChange - Callback function for when the message type changes
 * @param onMessageChange - Callback function for when the message content changes
 * @param onAddContextEntry - Callback function for adding a context entry
 * @param onRemoveContextEntry - Callback function for removing a context entry
 * @param onUpdateContextEntries - Callback function for updating context entries
 */
export type MessageInputProps = {
    current: WaldiezMessage;
    defaultContent: string;
    darkMode: boolean;
    selectLabel: string;
    includeContext: boolean;
    skipRagOption: boolean;
    skipCarryoverOption: boolean;
    selectTestId: string;
    notNoneLabel?: string;
    notNoneLabelInfo?: string;
    skipNone?: boolean;
    onTypeChange: (type: WaldiezMessageType) => void;
    onMessageChange: (message: WaldiezMessage) => void;
    onAddContextEntry?: (key: string, value: string) => void;
    onRemoveContextEntry?: (key: string) => void;
    onUpdateContextEntries?: (entries: Record<string, unknown>) => void;
};
