/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useMemo, useState } from "react";

import { InfoCheckbox, MultiValue, Select, SingleValue } from "@waldiez/components";
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
/**
 * Target types to exclude from the dropdown based on context
 */
const targetTypesToExclude: TransitionTargetType[] = ["GroupChatTarget", "NestedChatTarget", "StayTarget"];
/**
 * Target types to exclude when in group chat context
 */
const targetTypesToExcludeForGroupChat: TransitionTargetType[] = [
    ...targetTypesToExclude,
    "AgentTarget",
    "RandomAgentTarget",
    "GroupManagerTarget",
];
/**
 * Mapping of transition target types to human-readable labels
 */
const targetsToLabelsMapping: Record<TransitionTargetType, string> = {
    AgentTarget: "Pass the floor to another agent",
    RevertToUserTarget: "Revert to the user agent",
    RandomAgentTarget: "Choose a random agent",
    AskUserTarget: "Ask the user",
    TerminateTarget: "Terminate the flow",
    GroupChatTarget: "Group Chat", // assuming? the afterWork is for an agent and: either not in a group chat or a second group chat exists
    NestedChatTarget: "Trigger a nested chat", // assuming a nested exists
    GroupManagerTarget: "Return to the group chat manager", // assuming? the afterWork is for an agent that is a member of a group chat
    StayTarget: "Do Nothing", // why is this needed?
};
/**
 * Component for configuring what happens after an agent or group chat has no more work to do
 * Allows specifying transition targets like terminating, asking the user, or passing to another agent
 */
export const AfterWork: React.FC<AfterWorkProps> = memo(
    ({ target, agents, onChange, isForGroupChat = true }: AfterWorkProps) => {
        // State
        const [enabled, setEnabled] = useState(target !== undefined);
        const [selectedTargetType, setSelectedTargetType] = useState<TransitionTargetType | undefined>(
            target?.target_type,
        );
        const [selectedAgentTargetId, setSelectedAgentTargetId] = useState<string | undefined>(
            target?.target_type === "AgentTarget" ? target.value : undefined,
        );
        const [selectedRandomAgentTargetIds, setSelectedRandomAgentTargetIds] = useState<string[]>(
            target?.target_type === "RandomAgentTarget" ? target.value : [],
        );

        /**
         * Determine which target types to exclude based on context
         */
        const optionsToExclude = useMemo(
            () => (isForGroupChat ? targetTypesToExcludeForGroupChat : targetTypesToExclude),
            [isForGroupChat],
        );
        /**
         * Available transition target options for the dropdown
         */
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
        /**
         * Available agent options for the agent selector dropdown
         */
        const agentTargetOptions = useMemo(
            () =>
                agents.map(agent => ({
                    value: agent.id,
                    label: agent.data.label,
                })),
            [agents],
        );
        /**
         * Currently selected target option for the dropdown
         */
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
        /**
         * Currently selected agent option for the dropdown
         */
        const selectedAgentOption = useMemo(
            () => ({
                label: agentTargetOptions.find(option => option.value === selectedAgentTargetId)?.label,
                value: selectedAgentTargetId,
            }),
            [agentTargetOptions, selectedAgentTargetId],
        );

        /**
         * Handle enabling/disabling after-work
         */
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
        /**
         * Handle target type selection
         */
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
                                value: selectedAgentTargetId,
                            });
                        }
                        break;
                    case "TerminateTarget":
                    case "RevertToUserTarget":
                    case "AskUserTarget":
                    case "GroupManagerTarget":
                        onChange({ target_type: targetType });
                        break;
                    case "RandomAgentTarget":
                        if (selectedRandomAgentTargetIds.length > 0) {
                            onChange({
                                target_type: targetType,
                                value: selectedRandomAgentTargetIds,
                            });
                        }
                        break;
                }
            },
            [onChange, selectedAgentTargetId, selectedRandomAgentTargetIds],
        );
        /**
         * Handle agent selection for AgentTarget
         */
        const onAgentTargetChange = useCallback(
            (selectedOption?: SingleValue<{ label?: string; value?: string }>) => {
                if (!selectedOption?.value || selectedTargetType !== "AgentTarget") {
                    return;
                }

                setSelectedAgentTargetId(selectedOption.value);

                onChange({
                    target_type: "AgentTarget",
                    value: selectedOption.value,
                });
            },
            [onChange, selectedTargetType],
        );

        const onRandomAgentTargetsChange = useCallback(
            (selectedOptions?: MultiValue<{ label?: string; value: string }>) => {
                if (!selectedOptions || selectedTargetType !== "RandomAgentTarget") {
                    return;
                }
                const selectedIds = selectedOptions.map(option => option.value);
                setSelectedRandomAgentTargetIds(selectedIds);
                onChange({
                    target_type: "RandomAgentTarget",
                    value: selectedIds,
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
                        <div className="full-width margin-bottom-10">
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
                            <div className="full-width margin-bottom-10">
                                <label htmlFor="afterWorkTargetId">Agent to pass the floor to:</label>
                                <div className="margin-top-10" />
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
                        {selectedTargetType === "RandomAgentTarget" && (
                            <div className="full-width">
                                <label htmlFor="afterWorkTargetIds">Agents to choose from:</label>
                                <div className="margin-top-10" />
                                <Select
                                    inputId="afterWorkTargetIds"
                                    options={agentTargetOptions}
                                    value={selectedRandomAgentTargetIds.map(id => ({
                                        label: agentTargetOptions.find(option => option.value === id)?.label,
                                        value: id,
                                    }))}
                                    onChange={onRandomAgentTargetsChange}
                                    isClearable={true}
                                    isSearchable={false}
                                    isMulti
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        );
    },
);
AfterWork.displayName = "AfterWork";
