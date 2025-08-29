/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { type MultiValue, Select } from "@waldiez/components";

type WaldiezAgentNestedChatsTriggersProps = {
    id: string;
    selectOptions: {
        label: string;
        value: string;
    }[];
    selectedTriggers: string[];
    onSelectedTriggersChange: (option: MultiValue<{ label: string; value: string }> | null) => void;
};

/**
 * Component for selecting trigger agents for nested chats
 * Allows selecting agents that can trigger a nested chat sequence
 */
export const WaldiezAgentNestedChatsTriggers = memo((props: WaldiezAgentNestedChatsTriggersProps) => {
    const { id, selectOptions, selectedTriggers, onSelectedTriggersChange } = props;

    /**
     * Convert selected trigger IDs to Select component value format
     */
    const currentTriggers = useMemo(
        () =>
            selectedTriggers.map(trigger => {
                const option = selectOptions.find(option => option.value === trigger);
                return {
                    label: option?.label || "Unknown",
                    value: trigger,
                };
            }),
        [selectedTriggers, selectOptions],
    );

    return (
        <div className="nested-chat-triggers margin-bottom--10" data-testid={`nested-chat-triggers-${id}`}>
            {/* Information about triggers */}
            <div className="info">
                <b>Trigged by:</b> The agent triggers a sequence of nested chats when a message is received.
                If it is the termination message of a selected chat (e.g., max turns is set to 1) the trigger
                won't be activated.
            </div>

            {/* Trigger selection */}
            <label htmlFor={`new-nested-chat-select-trigger-${id}`} className="nested-chat-triggers-label">
                Triggered by:
            </label>

            <div className="nested-chat-select-trigger-view">
                <div className="nested-chat-select-trigger">
                    <Select
                        options={selectOptions}
                        value={currentTriggers}
                        onChange={onSelectedTriggersChange}
                        isMulti
                        inputId={`new-nested-chat-select-trigger-${id}`}
                        aria-label="Select triggers for nested chat"
                    />
                </div>
            </div>
        </div>
    );
});

WaldiezAgentNestedChatsTriggers.displayName = "WaldiezAgentNestedChatsTriggers";
