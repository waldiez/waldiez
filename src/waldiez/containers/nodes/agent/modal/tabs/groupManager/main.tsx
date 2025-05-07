/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { Dict, NumberInput, Select, SingleValue, TabItem, TabItems, TextInput } from "@waldiez/components";
import { WaldiezNodeGroupManagerTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import { WaldiezNodeAgent, WaldiezNodeAgentGroupManagerData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const WaldiezNodeGroupManagerTabs = (props: WaldiezNodeGroupManagerTabsProps) => {
    const { isModalOpen, flowId, id, data, onDataChange } = props;
    // const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const getGroupMembers = useWaldiez(s => s.getGroupMembers);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    // const agentConnections = getAgentConnections(id);
    const groupMembers = getGroupMembers(id);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);
    const [localData, setLocalData] = useState<WaldiezNodeAgentGroupManagerData>(data);
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData(prev => ({ ...prev, groupName: event.target.value }));
        onDataChange({ groupName: event.target.value });
    };
    const onMaxRoundChange = (value: number | null) => {
        setLocalData(prev => ({ ...prev, maxRound: value }));
        onDataChange({ maxRound: value });
    };
    const onAddContextVariable = (key: string, value: string) => {
        const newContextVariables = { ...localData.contextVariables, [key]: value };
        const newData = { ...localData, contextVariables: newContextVariables };
        setLocalData(newData);
        onDataChange({ contextVariables: newContextVariables });
    };
    const onDeleteContextVariable = (key: string) => {
        const newContextVariables = { ...localData.contextVariables };
        delete newContextVariables[key];
        const newData = { ...localData, contextVariables: newContextVariables };
        setLocalData(newData);
        onDataChange({ contextVariables: newContextVariables });
    };
    const onUpdateContextVariable = (items: { [key: string]: unknown }) => {
        const newData = { ...localData, contextVariables: items };
        setLocalData(newData);
        onDataChange({ contextVariables: items });
    };
    // initial agent should be one of the group members
    const initialAgentOptions = groupMembers.map(agent => ({
        label: agent.data.label,
        value: agent,
    }));
    const initialAgent = localData.initialAgentId ? getAgentById(localData.initialAgentId) : undefined;
    const initialAgentOption = initialAgent
        ? {
              label: initialAgent.data.label,
              value: initialAgent,
          }
        : undefined;
    const onInitialAgentChange = (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
        if (!option) {
            setLocalData(prev => ({ ...prev, initialAgentId: undefined }));
            onDataChange({ initialAgentId: undefined });
            return;
        }
        setLocalData(prev => ({ ...prev, initialAgentId: option.value.id }));
        onDataChange({ initialAgentId: option.value.id });
    };
    return (
        <TabItems activeTabIndex={activeTabIndex}>
            <TabItem label="Group" id={`wf-${flowId}-agent-group-manager-config-${id}`}>
                <div className="modal-body">
                    <TextInput
                        label="Name:"
                        value={localData.groupName ?? ""}
                        onChange={onNameChange}
                        dataTestId={`agent-name-input-${id}`}
                    />
                    <label htmlFor={`wf-${flowId}-agent-config-${id}-select-initial-agent`}>
                        Initial Agent
                    </label>
                    <Select
                        options={initialAgentOptions}
                        value={initialAgentOption}
                        onChange={onInitialAgentChange}
                        inputId={`wf-${flowId}-agent-config-${id}-select-initial-agent`}
                    />
                    <NumberInput
                        label="Max Rounds:"
                        value={localData.maxRound ?? 0}
                        onChange={onMaxRoundChange}
                        min={0}
                        max={1000}
                        step={1}
                        onNull={0}
                        setNullOnLower={true}
                        onLowerLabel="Unset"
                        labelInfo={"The maximum number of conversation rounds in the group."}
                        dataTestId={`manager-max-rounds-input-${id}`}
                    />
                    <Dict
                        itemsType="swarm-context-variables"
                        viewLabel="Context Variables"
                        viewLabelInfo="The context variables that will be available when the swarm chat starts."
                        onAdd={onAddContextVariable}
                        onDelete={onDeleteContextVariable}
                        onUpdate={onUpdateContextVariable}
                        items={localData.contextVariables ?? {}}
                        allowEmptyValues
                    />
                </div>
            </TabItem>
        </TabItems>
    );
};
