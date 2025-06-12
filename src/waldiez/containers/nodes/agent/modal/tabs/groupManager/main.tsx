/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useEffect, useMemo, useState } from "react";
import { FaLock } from "react-icons/fa6";

import {
    AfterWork,
    Dict,
    InfoCheckbox,
    NumberInput,
    Select,
    TabItem,
    TabItems,
    TextInput,
    TextareaInput,
} from "@waldiez/components";
import { useGroupManagerTabs } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/hooks";
import { WaldiezNodeGroupManagerTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import { WaldiezAgentModels } from "@waldiez/containers/nodes/agent/modal/tabs/models";
import { GroupChatSpeakerSelectionMethodOption } from "@waldiez/models";

/**
 * Component for managing group chat settings and configuration
 * Provides tabs for group settings, manager settings, speaker selection, and after-work actions
 */
export const WaldiezNodeGroupManagerTabs = memo((props: WaldiezNodeGroupManagerTabsProps) => {
    const { isModalOpen, flowId, id, data } = props;

    // Get hook data and handlers
    const {
        groupMembers,
        models,
        initialAgent,
        initialAgentOptions,
        speakersOrder,
        onGroupNameChange,
        onManagerNameChange,
        onMaxRoundChange,
        onAddContextVariable,
        onDeleteContextVariable,
        onUpdateContextVariable,
        onInitialAgentChange,
        onEnableClearHistoryChange,
        onSendIntroductionsChange,
        onMaxRetriesForSelectingChange,
        onSpeakerSelectionMethodChange,
        onDescriptionChange,
        onSystemMessageChange,
        onAfterWorkChange,
        onMoveMemberUp,
        onMoveMemberDown,
    } = useGroupManagerTabs(props);

    // Tab state
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Reset active tab when modal opens/closes
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);

    /**
     * Speaker selection method options
     */
    const speakerSelectionOptions = useMemo(
        () => [
            { label: "Auto", value: "auto" as GroupChatSpeakerSelectionMethodOption },
            { label: "Manual", value: "manual" as GroupChatSpeakerSelectionMethodOption },
            { label: "Default", value: "default" as GroupChatSpeakerSelectionMethodOption },
            { label: "Random", value: "random" as GroupChatSpeakerSelectionMethodOption },
            { label: "Round Robin", value: "round_robin" as GroupChatSpeakerSelectionMethodOption },
        ],
        [],
    );

    /**
     * Current speaker selection method value
     */
    const speakerSelectionValue = useMemo(
        () => ({
            label:
                speakerSelectionOptions.find(option => option.value === data.speakers?.selectionMethod)
                    ?.label ?? "Auto",
            value: data.speakers?.selectionMethod ?? "auto",
        }),
        [data.speakers?.selectionMethod, speakerSelectionOptions],
    );

    /**
     * Determine if "Afterwards" tab should be shown
     */
    const showAfterwardsTab = !["manual", "auto"].includes(data.speakers?.selectionMethod);

    const getAgentName = (agentId: string) => {
        return groupMembers.find(agent => agent.id === agentId)?.data.label ?? agentId;
    };

    return (
        <TabItems activeTabIndex={activeTabIndex}>
            {/* Group Settings Tab */}
            <TabItem label="Group" id={`wf-${flowId}-agent-group-manager-config-${id}`}>
                <div className="modal-body  agent-panel">
                    <TextInput
                        label="Group Name:"
                        name="group-name"
                        value={data.groupName ?? ""}
                        onChange={onGroupNameChange}
                        dataTestId={`agent-name-input-${id}`}
                        aria-label="Group name"
                    />

                    <label htmlFor={`wf-${flowId}-agent-config-${id}-select-initial-agent`}>
                        Initial Agent:
                    </label>
                    <Select
                        options={initialAgentOptions}
                        value={initialAgent}
                        onChange={onInitialAgentChange}
                        inputId={`wf-${flowId}-agent-config-${id}-select-initial-agent`}
                        aria-label="Select initial agent"
                    />

                    <NumberInput
                        name="max-rounds"
                        label="Max Rounds:"
                        value={data.maxRound}
                        onChange={onMaxRoundChange}
                        min={1}
                        max={1000}
                        step={1}
                        setNullOnLower={false}
                        forceInt
                        labelInfo="The maximum number of conversation rounds in the group."
                        dataTestId={`manager-max-rounds-input-${id}`}
                        aria-label="Maximum conversation rounds"
                    />

                    <Dict
                        itemsType="group-context-variables"
                        viewLabel="Context Variables"
                        viewLabelInfo="The context variables that will be available when the group chat starts."
                        onAdd={onAddContextVariable}
                        onDelete={onDeleteContextVariable}
                        onUpdate={onUpdateContextVariable}
                        items={data.contextVariables ?? {}}
                        allowEmptyValues
                        aria-label="Group context variables"
                    />
                </div>
            </TabItem>

            {/* Group Manager Tab */}
            <TabItem label="Group Manager" id={`wf-${flowId}-agent-group-manager-agent-${id}`}>
                <div className="modal-body agent-panel">
                    {/* Models Selection */}
                    <div>
                        <WaldiezAgentModels
                            id={id}
                            data={props.data}
                            models={models}
                            onDataChange={props.onDataChange}
                        />
                    </div>

                    {/* Group Manager Name */}
                    {/* Manager Settings */}
                    <div>
                        <TextInput
                            label="Group Manager's Name:"
                            name="group-manager-name"
                            value={data.name ?? data.label ?? ""}
                            onChange={onManagerNameChange}
                            dataTestId={`agent-name-input-${id}`}
                            placeholder="Group Manager Name"
                            className="margin-top-5"
                            aria-label="Group manager name"
                        />
                    </div>

                    {/* Description */}
                    <label htmlFor={`agent-description-input-${id}`}>Description:</label>
                    <TextareaInput
                        id={`agent-description-input-${id}`}
                        title="Agent description"
                        rows={2}
                        value={data.description}
                        onChange={onDescriptionChange}
                        data-testid={`agent-description-input-${id}`}
                        aria-label="Manager description"
                    />

                    {/* System Message */}
                    <label htmlFor={`agent-system-message-input-${id}`}>System Message:</label>
                    <TextareaInput
                        id={`agent-system-message-input-${id}`}
                        title="System message"
                        rows={2}
                        value={data.systemMessage ?? ""}
                        onChange={onSystemMessageChange}
                        data-testid={`agent-system-message-input-${id}`}
                        aria-label="Manager system message"
                    />

                    {/* Configuration Checkboxes */}
                    <InfoCheckbox
                        label="Send introductions"
                        checked={data.sendIntroductions === true}
                        info="Send a round of introductions at the start of the group chat, so agents know who they can speak to (default: False)"
                        onChange={onSendIntroductionsChange}
                        id={`manager-send-introductions-checkbox-${id}`}
                        aria-label="Enable sending introductions"
                    />

                    <InfoCheckbox
                        label="Enable clear history"
                        checked={data.enableClearHistory === true}
                        info="Enable the possibility to clear history of messages for agents manually by providing 'clear history' phrase in user prompt."
                        onChange={onEnableClearHistoryChange}
                        id={`manager-enable-clear-history-checkbox-${id}`}
                        aria-label="Enable clear history functionality"
                    />
                </div>
            </TabItem>

            {/* Speakers Tab */}
            <TabItem label="Speakers" id={`wf-${flowId}-agent-group-manager-speakers-${id}`}>
                <div className="modal-body agent-panel">
                    <div className="margin-top-10">
                        <div className="info">
                            The method for selecting the next speaker. The default is{" "}
                            <strong className="italic">Auto</strong>. Could be any of the following:
                            <ul>
                                <li>
                                    <strong className="italic">Auto</strong>: the next speaker is selected
                                    automatically by LLM.
                                </li>
                                <li>
                                    <strong className="italic">Manual</strong>: the next speaker is selected
                                    manually by user input.
                                </li>
                                <li>
                                    <strong className="italic">Default</strong>: the transitions to the
                                    speakers are explicitly defined in the workflow.
                                </li>
                                <li>
                                    <strong className="italic">Random</strong>: the next speaker is selected
                                    randomly.
                                </li>
                                <li>
                                    <strong className="italic">Round Robin</strong>: the next speaker is
                                    selected in a round robin fashion, i.e., iterating in the same order as
                                    provided in agents.
                                </li>
                            </ul>
                        </div>
                    </div>

                    <label htmlFor={`manager-speaker-selection-method-${id}`}>
                        Speaker Selection Method:
                    </label>
                    <Select
                        options={speakerSelectionOptions}
                        value={speakerSelectionValue}
                        onChange={onSpeakerSelectionMethodChange}
                        inputId={`manager-speaker-selection-method-${id}`}
                        aria-label="Select speaker selection method"
                    />

                    <NumberInput
                        name="max-retries-for-selecting"
                        label="Max Retries for selecting a speaker:"
                        value={data.speakers?.maxRetriesForSelecting ?? 0}
                        onChange={onMaxRetriesForSelectingChange}
                        min={0}
                        max={100}
                        step={1}
                        onNull={0}
                        setNullOnLower={true}
                        onLowerLabel="Unset"
                        labelInfo="The maximum number of times the speaker selection re-query process will run. If, during speaker selection, multiple agent names or no agent names are returned by the LLM as the next agent, it will be queried again up to the maximum number of times until a single agent is returned or it exhausts the maximum attempts. Applies only to 'auto' speaker selection method."
                        dataTestId={`manager-max-retries-for-selecting-input-${id}`}
                        aria-label="Maximum retries for speaker selection"
                    />

                    {data.speakers?.selectionMethod === "round_robin" && (
                        <div className="margin-top-10">
                            <div className="info">
                                The order in which the speakers will be selected in round robin mode. If not
                                provided, the order will be automatically determined based on the agents in
                                the group.
                            </div>
                            <div className="ordered-items-list">
                                {speakersOrder.map((speaker, index) => {
                                    const isInitialAgent = data.initialAgentId === speaker;
                                    const canMoveUp = index > 0 && !(data.initialAgentId && index === 1);
                                    const canMoveDown = index < speakersOrder.length - 1 && !isInitialAgent;
                                    const hasButtons = canMoveUp || canMoveDown;

                                    return (
                                        <div
                                            key={`group-speaker-${speaker}`}
                                            className={`ordered-item ${hasButtons ? "has-buttons" : "no-buttons"}`}
                                            data-testid={`group-speaker-${index}`}
                                        >
                                            <div className="reorder-buttons">
                                                {canMoveUp && (
                                                    <button
                                                        type="button"
                                                        title="Move up"
                                                        className="reorder-btn up-btn"
                                                        onClick={() => onMoveMemberUp(speaker)}
                                                    >
                                                        &#x2191;
                                                    </button>
                                                )}

                                                {canMoveDown && (
                                                    <button
                                                        type="button"
                                                        title="Move down"
                                                        className="reorder-btn down-btn"
                                                        onClick={() => onMoveMemberDown(speaker)}
                                                    >
                                                        &#x2193;
                                                    </button>
                                                )}
                                                {isInitialAgent && (
                                                    <button type="button" className="reorder-btn no-click">
                                                        <FaLock />
                                                    </button>
                                                )}
                                            </div>

                                            <div className="ordered-item-content">
                                                {getAgentName(speaker)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </TabItem>

            {/* Afterwards Tab - Conditionally Shown */}
            {showAfterwardsTab && (
                <TabItem label="Afterwards" id={`wf-${flowId}-agent-group-manager-after-work-${id}`}>
                    <div className="modal-body agent-panel">
                        <AfterWork
                            target={data.afterWork}
                            agents={groupMembers}
                            onChange={onAfterWorkChange}
                            isForGroupChat
                            aria-label="After work configuration"
                        />
                    </div>
                </TabItem>
            )}
        </TabItems>
    );
});

WaldiezNodeGroupManagerTabs.displayName = "WaldiezNodeGroupManagerTabs";
