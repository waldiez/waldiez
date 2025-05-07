/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

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

export const AfterWork: React.FC<AfterWorkProps> = ({ target, agents, onChange, isForGroupChat = true }) => {
    const [enabled, setEnabled] = useState(target !== undefined);
    const [selectedTargetType, setSelectedTargetType] = useState<TransitionTargetType | undefined>(
        target ? target.target_type : undefined,
    );
    const [selectedAgentTargetId, setSelectedAgentTargetId] = useState<string | undefined>(
        target && target.target_type === "AgentTarget" ? target.target : undefined,
    );
    const onEnabledChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        setEnabled(checked);
        onChange(undefined);
    };
    const onTargetTypeChange = (
        selectedOption?: SingleValue<{ label?: string; value?: TransitionTargetType }>,
    ) => {
        if (selectedOption && selectedOption.value) {
            const targetType = selectedOption.value;
            setSelectedTargetType(targetType);
            switch (targetType) {
                case "AgentTarget":
                    if (selectedAgentTargetId) {
                        const newTarget: WaldiezTransitionTarget = {
                            target_type: targetType,
                            target: selectedAgentTargetId,
                        };
                        onChange(newTarget);
                    }
                    break;
                case "TerminateTarget":
                case "RevertToUserTarget":
                case "AskUserTarget":
                    onChange({ target_type: targetType });
                    break;
                default:
                    // TODO: handle other target types
                    break;
            }
        }
    };
    const onAgentTargetChange = (selectedOption?: SingleValue<{ label?: string; value?: string }>) => {
        if (selectedOption && selectedTargetType === "AgentTarget" && selectedOption.value) {
            setSelectedAgentTargetId(selectedOption.value);
            const newTarget: WaldiezTransitionTarget = {
                target_type: "AgentTarget",
                target: selectedOption.value,
            };
            onChange(newTarget);
        }
    };
    const optionsToExclude = isForGroupChat ? targetTypesToExcludeForGroupChat : targetTypesToExclude;
    const targetOptions = ValidTransitionTargetTypes.filter(
        targetType => !optionsToExclude.includes(targetType),
    ) as TransitionTargetType[];
    const transitionTargetOptions = targetOptions.map(targetType => ({
        value: targetType,
        label: targetsToLabelsMapping[targetType],
    }));
    const agentTargetOptions = agents.map(agent => ({
        value: agent.id,
        label: agent.data.label,
    }));
    const infoLabelAfter = isForGroupChat ? "the chat ends" : "the Agent has no more work to do";
    return (
        <div className="waldiez-after-work">
            <InfoCheckbox
                label={`Include an action to perform after ${infoLabelAfter}?`}
                info={
                    "After work handles conversation continuation when an agent doesn't select the next agent. " +
                    "If no agent is selected and no tool calls have output, we will use this property to determine the next action."
                }
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
                            value={
                                selectedTargetType
                                    ? {
                                          label: targetsToLabelsMapping[selectedTargetType],
                                          value: selectedTargetType,
                                      }
                                    : null
                            }
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
                                value={{
                                    label: agentTargetOptions.find(
                                        option => option.value === selectedAgentTargetId,
                                    )?.label,
                                    value: selectedAgentTargetId,
                                }}
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
