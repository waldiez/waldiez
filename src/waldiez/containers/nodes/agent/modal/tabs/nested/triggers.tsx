/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MultiValue, Select } from "@waldiez/components";

export const WaldiezAgentNestedChatsTriggers = (props: {
    id: string;
    selectOptions: {
        label: string;
        value: string;
    }[];
    selectedTriggers: string[];
    onSelectedTriggersChange: (option: MultiValue<{ label: string; value: string }> | null) => void;
}) => {
    const { id, selectOptions, selectedTriggers, onSelectedTriggersChange } = props;
    const currentTriggers = selectedTriggers.map(trigger => {
        const option = selectOptions.find(option => option.value === trigger);
        return { label: option?.label || "Unknown", value: trigger };
    });
    return (
        <div className="nested-chat-triggers margin-top-20">
            <div className="info margin-bottom-10">
                <b>Trigged by:</b> The agent triggers a sequence of nested chats when a message is received.
                If it is the termination message of a selected chat (e.g., max turns is set to 1) the trigger
                won't be activated.
            </div>
            <label className="nested-chat-triggers-label">Triggered by:</label>
            <div className="nested-chat-select-trigger-view">
                <div className="nested-chat-select-trigger">
                    <label className="hidden" htmlFor={`new-nested-chat-select-trigger-${id}`}>
                        Triggers
                    </label>
                    <Select
                        options={selectOptions}
                        value={currentTriggers}
                        onChange={onSelectedTriggersChange}
                        isMulti
                        inputId={`new-nested-chat-select-trigger-${id}`}
                    />
                </div>
            </div>
        </div>
    );
};
