/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo, useState } from "react";

import { InfoCheckbox } from "@waldiez/components/infoCheckBox";
import { Select, SingleValue } from "@waldiez/components/select";
import {
    TransitionTargetType,
    ValidTransitionTargetTypes,
    WaldiezNodeAgent,
    WaldiezTransitionTarget,
} from "@waldiez/models";

type AfterWorkProps = {
    target: WaldiezTransitionTarget | undefined;
    agents: WaldiezNodeAgent[];
    onChange: (target: WaldiezTransitionTarget | undefined) => void;
    isForGroupChat?: boolean;
};

const targetTypesToExclude: TransitionTargetType[] = ["GroupChatTarget", "NestedChatTarget", "StayTarget"];

const targetTypesToExcludeForGroupChat: TransitionTargetType[] = [
    ...targetTypesToExclude,
    "AgentTarget",
    "RandomAgentTarget",
    "GroupManagerTarget",
];

const targetsToLabelsMapping: Record<TransitionTargetType, string> = {
    AgentTarget: "Pass the floor to another agent",
    RandomAgentTarget: "Choose a random agent",
    AskUserTarget: "Ask the user",
    RevertToUserTarget: "Return to a user agent if one is available",
    TerminateTarget: "Terminate the flow",
    GroupChatTarget: "Group Chat", // assuming: the afterWork is for an agent and: either not in a group chat or a second group chat exists
    NestedChatTarget: "Trigger a nested chat", // assuming a nested exists
    GroupManagerTarget: "Return to the group chat manager", // assuming: the afterWork is for an agent that is a member of a group chat
    StayTarget: "Do Nothing", // why is this needed?
};

export const AfterWork: React.FC<AfterWorkProps> = ({ target, agents, onChange, isForGroupChat = true }) => {
    // State
    const [enabled, setEnabled] = useState(target !== undefined);
    const [selectedTargetType, setSelectedTargetType] = useState<TransitionTargetType | undefined>(
        target?.target_type,
    );
    const [selectedAgentTargetId, setSelectedAgentTargetId] = useState<string | undefined>(
        target?.target_type === "AgentTarget" ? target.target : undefined,
    );

    // Memoized values
    const optionsToExclude = useMemo(
        () => (isForGroupChat ? targetTypesToExcludeForGroupChat : targetTypesToExclude),
        [isForGroupChat],
    );

    const transitionTargetOptions = useMemo(
        () =>
            ValidTransitionTargetTypes.filter(targetType => !optionsToExclude.includes(targetType)).map(
                targetType => ({
                    value: targetType,
                    label: targetsToLabelsMapping[targetType],
                }),
            ),
        [optionsToExclude],
    );

    const agentTargetOptions = useMemo(
        () =>
            agents.map(agent => ({
                value: agent.id,
                label: agent.data.label,
            })),
        [agents],
    );

    const selectedTargetOption = useMemo(
        () =>
            selectedTargetType
                ? {
                      label: targetsToLabelsMapping[selectedTargetType],
                      value: selectedTargetType,
                  }
                : null,
        [selectedTargetType],
    );

    const selectedAgentOption = useMemo(
        () => ({
            label: agentTargetOptions.find(option => option.value === selectedAgentTargetId)?.label,
            value: selectedAgentTargetId,
        }),
        [agentTargetOptions, selectedAgentTargetId],
    );

    // Event handlers
    const onEnabledChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const checked = event.target.checked;
            setEnabled(checked);

            if (!checked) {
                onChange(undefined);
            }
        },
        [onChange],
    );

    const onTargetTypeChange = useCallback(
        (selectedOption?: SingleValue<{ label?: string; value?: TransitionTargetType }>) => {
            if (!selectedOption?.value) {
                return;
            }

            const targetType = selectedOption.value;
            setSelectedTargetType(targetType);

            switch (targetType) {
                case "AgentTarget":
                    if (selectedAgentTargetId) {
                        onChange({
                            target_type: targetType,
                            target: selectedAgentTargetId,
                        });
                    }
                    break;
                case "TerminateTarget":
                case "RevertToUserTarget":
                case "AskUserTarget":
                    onChange({ target_type: targetType });
                    break;
            }
        },
        [onChange, selectedAgentTargetId],
    );

    const onAgentTargetChange = useCallback(
        (selectedOption?: SingleValue<{ label?: string; value?: string }>) => {
            if (!selectedOption?.value || selectedTargetType !== "AgentTarget") {
                return;
            }

            setSelectedAgentTargetId(selectedOption.value);

            onChange({
                target_type: "AgentTarget",
                target: selectedOption.value,
            });
        },
        [onChange, selectedTargetType],
    );

    // Text content
    const infoLabelAfter = isForGroupChat ? "the chat ends" : "the Agent has no more work to do";
    const infoText =
        "Check this to handle conversation continuation when no further options are available. " +
        "If no agent is selected and no tool calls have output, we will use this property to determine the next action.";

    return (
        <div className="waldiez-after-work">
            <InfoCheckbox
                label={`Include an action to perform after ${infoLabelAfter}?`}
                info={infoText}
                checked={enabled}
                dataTestId="afterWork"
                onChange={onEnabledChange}
            />
            {enabled && (
                <div className="flex flex-column margin-bottom-10">
                    <div className="full-width">
                        <label htmlFor="afterWorkTargetType">Action to perform after work:</label>
                        <div className="margin-top-10" />
                        <Select
                            inputId="afterWorkTargetType"
                            options={transitionTargetOptions}
                            value={selectedTargetOption}
                            onChange={onTargetTypeChange}
                            isClearable={false}
                            isSearchable={false}
                            isMulti={false}
                        />
                    </div>
                    {selectedTargetType === "AgentTarget" && (
                        <div className="full-width">
                            <label htmlFor="afterWorkTargetId">Agent to pass the floor to:</label>
                            <Select
                                inputId="afterWorkTargetId"
                                options={agentTargetOptions}
                                value={selectedAgentOption}
                                onChange={onAgentTargetChange}
                                isClearable={false}
                                isSearchable={false}
                                isMulti={false}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
