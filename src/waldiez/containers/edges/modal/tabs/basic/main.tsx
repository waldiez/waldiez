/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { type FC } from "react";

import { CheckboxInput, InfoLabel, NumberInput, Select, TextInput, TextareaInput } from "@waldiez/components";
import { useWaldiezEdgeBasicTab } from "@waldiez/containers/edges/modal/tabs/basic/hooks";
import { type WaldiezEdgeBasicTabProps } from "@waldiez/containers/edges/modal/tabs/basic/types";

export const WaldiezEdgeBasicTab: FC<WaldiezEdgeBasicTabProps> = (props: WaldiezEdgeBasicTabProps) => {
    const { data, edgeId, onTypeChange, skipDescription = false } = props;
    const {
        edgeTypeOptions,
        currentSelectedChatType,
        onLabelChange,
        onDescriptionChange,
        onClearHistoryChange,
        onMaxTurnsChange,
    } = useWaldiezEdgeBasicTab(props);
    return (
        <div className="flex flex-col">
            <div className="margin-top--10">
                <InfoLabel
                    htmlFor={`select-chat-type-${edgeId}`}
                    label="Chat Type:"
                    info="The type of the chat. Could be Chat or Nested Chat. Chats are executed in a sequential order. Nested Chats are not always executed (i.e., triggered)."
                />
                {/* for tests */}
                <label className="hidden" htmlFor={`select-chat-type-${edgeId}`}>
                    Chat Type:
                </label>
                <Select
                    options={edgeTypeOptions}
                    value={currentSelectedChatType}
                    onChange={onTypeChange}
                    inputId={`select-chat-type-${edgeId}`}
                />
            </div>
            <TextInput
                label="Label:"
                name="edge-label"
                value={data.label}
                onChange={onLabelChange}
                dataTestId={`edge-${edgeId}-label-input`}
            />
            {!skipDescription && (
                <div className="margin-top-10">
                    <label htmlFor={`edge-${edgeId}-description-input`}>Description:</label>
                    <TextareaInput
                        rows={2}
                        value={data.description}
                        placeholder="Enter a description"
                        onChange={onDescriptionChange}
                        data-testid={`edge-${edgeId}-description-input`}
                    />
                </div>
            )}
            <div className="margin-top-10" />
            <CheckboxInput
                label="Clear History"
                isChecked={data.clearHistory}
                onCheckedChange={onClearHistoryChange}
                id={`edge-${edgeId}-clear-history-checkbox`}
            />
            <NumberInput
                name="max-turns"
                label="Max Turns:"
                min={0}
                max={100}
                value={data.maxTurns}
                onChange={onMaxTurnsChange}
                onNull={0}
                setNullOnLower={true}
                onLowerLabel="No limit"
                labelInfo="The maximum number of turns for the chat between the two agents. One turn means one conversation round trip. If set to 0, there is no limit."
                dataTestId={`edge-${edgeId}-max-turns-input`}
            />
        </div>
    );
};
