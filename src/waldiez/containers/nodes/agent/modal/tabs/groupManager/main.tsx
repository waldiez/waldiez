/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import {
    AfterWork,
    Dict,
    InfoCheckbox,
    NumberInput,
    Select,
    TabItem,
    TabItems,
    TextInput,
} from "@waldiez/components";
import { useGroupManagerTabs } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/hooks";
import { WaldiezNodeGroupManagerTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import { GroupChatSpeakerSelectionMethodOption } from "@waldiez/models";

import { WaldiezAgentModels } from "../models";

export const WaldiezNodeGroupManagerTabs = (props: WaldiezNodeGroupManagerTabsProps) => {
    const { isModalOpen, flowId, id } = props;
    const {
        data,
        groupMembers,
        models,
        initialAgent,
        initialAgentOptions,
        currentAfterWork,
        onNameChange,
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
    } = useGroupManagerTabs(props);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);
    const speakerSelectionOptions: {
        label: string;
        value: GroupChatSpeakerSelectionMethodOption;
    }[] = [
        { label: "Auto", value: "auto" },
        { label: "Manual", value: "manual" },
        { label: "Default", value: "default" },
        { label: "Random", value: "random" },
        { label: "Round Robin", value: "round_robin" },
    ];
    return (
        <TabItems activeTabIndex={activeTabIndex}>
            <TabItem label={"Group"} id={`wf-${flowId}-agent-group-manager-config-${id}`}>
                <div className="modal-body">
                    <TextInput
                        label="Group Name:"
                        value={data.groupName ?? ""}
                        onChange={onNameChange}
                        dataTestId={`agent-name-input-${id}`}
                    />
                    <label htmlFor={`wf-${flowId}-agent-config-${id}-select-initial-agent`}>
                        Initial Agent:
                    </label>
                    <Select
                        options={initialAgentOptions}
                        value={initialAgent}
                        onChange={onInitialAgentChange}
                        inputId={`wf-${flowId}-agent-config-${id}-select-initial-agent`}
                    />
                    <NumberInput
                        label="Max Rounds:"
                        value={data.maxRound}
                        onChange={onMaxRoundChange}
                        min={1}
                        max={1000}
                        step={1}
                        setNullOnLower={false}
                        forceInt
                        labelInfo={"The maximum number of conversation rounds in the group."}
                        dataTestId={`manager-max-rounds-input-${id}`}
                    />
                    <Dict
                        itemsType="swarm-context-variables"
                        viewLabel="Context Variables"
                        viewLabelInfo="The context variables that will be available when the group chat starts."
                        onAdd={onAddContextVariable}
                        onDelete={onDeleteContextVariable}
                        onUpdate={onUpdateContextVariable}
                        items={data.contextVariables ?? {}}
                        allowEmptyValues
                    />
                </div>
            </TabItem>
            <TabItem label={"Group Manager"} id={`wf-${flowId}-agent-group-manager-agent-${id}`}>
                <WaldiezAgentModels
                    id={id}
                    data={props.data}
                    models={models}
                    onDataChange={props.onDataChange}
                />
                <label>Description:</label>
                <textarea
                    title="Agent description"
                    rows={2}
                    value={data.description}
                    onChange={onDescriptionChange}
                    data-testid={`agent-description-input-${id}`}
                />
                <label>System Message:</label>
                <textarea
                    title="System message"
                    rows={2}
                    value={data.systemMessage ?? ""}
                    onChange={onSystemMessageChange}
                    data-testid={`agent-system-message-input-${id}`}
                />
                <InfoCheckbox
                    label="Send introductions"
                    checked={data.sendIntroductions === true}
                    info="Send a round of introductions at the start of the group chat, so agents know who they can speak to (default: False)"
                    onChange={onSendIntroductionsChange}
                    dataTestId={`manager-send-introductions-checkbox-${id}`}
                />
                <InfoCheckbox
                    label="Enable clear history"
                    checked={data.enableClearHistory === true}
                    info="Enable the possibility to clear history of messages for agents manually by providing 'clear history' phrase in user prompt."
                    onChange={onEnableClearHistoryChange}
                    dataTestId={`manager-enable-clear-history-checkbox-${id}`}
                />
            </TabItem>
            <TabItem label={"Speakers"} id={`wf-${flowId}-agent-group-manager-config-${id}`}>
                <label className="hidden" htmlFor={`manager-speaker-selection-method-${id}`}></label>
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
                                <strong className="italic">Default</strong>: the transitions to the speakers
                                are explicitly defined in the workflow. An optional action to perform after
                                the chat can also be defined.
                            </li>
                            <li>
                                <strong className="italic">Random</strong>: the next speaker is selected
                                randomly.
                            </li>
                            <li>
                                <strong className="italic">Round Robin</strong>: the next speaker is selected
                                in a round robin fashion, i.e., iterating in the same order as provided in
                                agents.
                            </li>
                        </ul>
                    </div>
                    <p>Speaker Selection Method:</p>
                </div>
                <Select
                    options={speakerSelectionOptions}
                    value={{
                        label:
                            speakerSelectionOptions.find(
                                option => option.value === data.speakers?.selectionMethod,
                            )?.label ?? "Auto",
                        value: data.speakers?.selectionMethod ?? "auto",
                    }}
                    onChange={onSpeakerSelectionMethodChange}
                    inputId={`manager-speaker-selection-method-${id}`}
                />
                <NumberInput
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
                />
            </TabItem>
            {data.speakers?.selectionMethod === "default" && (
                <TabItem label={"Afterwards"} id={`wf-${flowId}-agent-group-manager-after-work-${id}`}>
                    <div className="modal-body">
                        <AfterWork
                            target={currentAfterWork}
                            agents={groupMembers}
                            onChange={onAfterWorkChange}
                            isForGroupChat
                        />
                    </div>
                </TabItem>
            )}
        </TabItems>
    );
};
