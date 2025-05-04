/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";
import isEqual from "react-fast-compare";

import {
    AfterWork,
    Dict,
    Modal,
    NumberInput,
    Select,
    SingleValue,
    TabItem,
    TabItems,
} from "@waldiez/components";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { WaldiezAgentSwarmContainerData, WaldiezSwarmAfterWork } from "@waldiez/types";

export type WaldiezSwarmContainerModalProps = {
    id: string;
    data: WaldiezAgentSwarmContainerData;
    flowId: string;
    isOpen: boolean;
    onClose: () => void;
};
export const WaldiezNodeSwarmContainerModal = (props: WaldiezSwarmContainerModalProps) => {
    const { isOpen, onClose, id, data, flowId } = props;
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    const [isDirty, setIsDirty] = useState(false);
    const [agentData, setAgentData] = useState<WaldiezAgentSwarmContainerData>(data);
    const { isDark } = useWaldiezTheme();
    const getAgentById = useWaldiez(s => s.getAgentById);
    const getSwarmAgents = useWaldiez(s => s.getSwarmAgents);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const updateSwarmInitialAgent = useWaldiez(s => s.updateSwarmInitialAgent);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const onSave = () => {
        updateAgentData(id, agentData);
        if (agentData.initialAgent && agentData.initialAgent !== data.initialAgent) {
            updateSwarmInitialAgent(agentData.initialAgent);
        }
        onFlowChanged();
        setIsDirty(false);
        // onClose();
    };
    useEffect(() => {
        setActiveTabIndex(0);
        setIsDirty(false);
    }, [isOpen]);
    const swarmAgents = getSwarmAgents();
    const initialAgentOptions = swarmAgents.map(agent => ({
        label: agent.data.label,
        value: agent,
    }));
    const getInitialAgentValue = () => {
        const initialAgent = agentData.initialAgent ? getAgentById(agentData.initialAgent) : null;
        return initialAgent
            ? {
                  label: initialAgent.data.label,
                  value: initialAgent,
              }
            : null;
    };
    const onInitialAgentChange = (option: SingleValue<{ label: string; value: any }>) => {
        const newData = { ...agentData, initialAgent: option?.value.id };
        setAgentData(newData);
        const dirty = !isEqual(data, newData);
        setIsDirty(dirty);
    };
    const onMaxRoundsChange = (value: number | null) => {
        if (value === null) {
            return;
        }
        const newData = { ...agentData, maxRounds: value };
        setAgentData(newData);
        const isDirty = !isEqual(data, newData);
        setIsDirty(isDirty);
    };
    const onAfterWorkChange = (afterWork: WaldiezSwarmAfterWork | null) => {
        const newData = { ...agentData, afterWork };
        setAgentData(newData);
        setIsDirty(!isEqual(data, newData));
    };
    const onAddContextVariable = (key: string, value: string) => {
        const newData = {
            ...agentData,
            contextVariables: { ...agentData.contextVariables, [key]: value },
        };
        setAgentData(newData);
        setIsDirty(!isEqual(data, newData));
    };
    const onDeleteContextVariable = (key: string) => {
        const newData = {
            ...agentData,
            contextVariables: { ...agentData.contextVariables },
        };
        delete newData.contextVariables[key];
        setAgentData(newData);
        setIsDirty(!isEqual(data, newData));
    };
    const onUpdateContextVariable = (items: { [key: string]: string }) => {
        const newData = { ...agentData, contextVariables: items };
        setAgentData(newData);
        setIsDirty(!isEqual(data, newData));
    };
    const onSaveAndClose = () => {
        onSave();
        onClose();
    };
    const initialAgentValue = getInitialAgentValue();
    return (
        <Modal
            title="Swarm Configuration"
            isOpen={isOpen}
            onClose={onClose}
            onSaveAndClose={onSaveAndClose}
            dataTestId={`wf-${flowId}-agent-modal-${id}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body">
                <TabItems activeTabIndex={activeTabIndex}>
                    <TabItem label="Swarm" id={`wf-${flowId}-agent-config-${id}`}>
                        <div className="modal-tab-body">
                            <div className="agent-panel">
                                <label htmlFor={`wf-${flowId}-agent-config-${id}-select-initial-agent`}>
                                    Initial Agent
                                </label>
                                <Select
                                    options={initialAgentOptions}
                                    value={initialAgentValue}
                                    onChange={onInitialAgentChange}
                                    inputId={`wf-${flowId}-agent-config-${id}-select-initial-agent`}
                                />
                                <div className="margin-top-5" />
                                <NumberInput
                                    label="Max Rounds:"
                                    value={agentData.maxRounds}
                                    onChange={onMaxRoundsChange}
                                    min={1}
                                    max={1000}
                                    step={1}
                                    setNullOnLower={false}
                                    forceInt
                                    dataTestId={`agent-swarm-max-rounds-${id}`}
                                />
                                <div className="margin-top-10" />
                            </div>
                        </div>
                    </TabItem>
                    <TabItem
                        label="Context Variables"
                        id={`wf-${flowId}-agent-swarm-context-variables-${id}`}
                    >
                        <Dict
                            itemsType="swarm-context-variables"
                            viewLabel="Context Variables"
                            viewLabelInfo="The context variables that will be available when the swarm chat starts."
                            onAdd={onAddContextVariable}
                            onDelete={onDeleteContextVariable}
                            onUpdate={onUpdateContextVariable}
                            items={agentData.contextVariables}
                            allowEmptyValues
                        />
                    </TabItem>
                    <TabItem label="After Work" id={`wf-${flowId}-agent-swarm-after-work-${id}`}>
                        <AfterWork
                            value={agentData.afterWork}
                            agents={swarmAgents}
                            onChange={onAfterWorkChange}
                            darkMode={isDark}
                        />
                    </TabItem>
                </TabItems>
            </div>
            <div className="modal-actions">
                <button
                    className="modal-action-cancel"
                    onClick={onClose}
                    data-testid={`cancel-agent-data-${id}`}
                    type="button"
                    title="Cancel"
                >
                    Cancel
                </button>
                <button
                    className="modal-action-submit"
                    onClick={onSave}
                    data-testid={`save-agent-data-${id}`}
                    type="button"
                    title="Save"
                    disabled={!isDirty}
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};
