/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeGroupManagerTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import {
    GroupChatSpeakerSelectionMethodOption,
    WaldiezAgentGroupManagerSpeakers,
    WaldiezNodeAgent,
    WaldiezNodeAgentGroupManagerData,
    WaldiezTransitionTarget,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useGroupManagerTabs = (props: WaldiezNodeGroupManagerTabsProps) => {
    const { id, data, onDataChange } = props;
    const [localData, setLocalData] = useState<WaldiezNodeAgentGroupManagerData>(data);
    // const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const getGroupMembers = useWaldiez(s => s.getGroupMembers);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const getModels = useWaldiez(s => s.getModels);
    const setSpeakerData = (speakerData: Partial<WaldiezAgentGroupManagerSpeakers>) => {
        const newSpeakerData = { ...localData.speakers, ...speakerData };
        setLocalData(prev => ({ ...prev, speakers: newSpeakerData }));
        onDataChange({ speakers: newSpeakerData });
    };
    // const agentConnections = getAgentConnections(id);
    const groupMembers = getGroupMembers(id);
    const onNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData(prev => ({ ...prev, groupName: event.target.value }));
        onDataChange({ groupName: event.target.value });
    };
    const onDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalData(prev => ({ ...prev, description: event.target.value }));
        onDataChange({ description: event.target.value });
    };
    const onSystemMessageChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalData(prev => ({ ...prev, systemMessage: event.target.value }));
        onDataChange({ systemMessage: event.target.value });
    };
    const onMaxRoundChange = (value: number | null) => {
        if (value !== null && value > 0) {
            setLocalData(prev => ({ ...prev, maxRound: value }));
            onDataChange({ maxRound: value });
        }
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
    const onInitialAgentChange = (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
        if (!option) {
            setLocalData(prev => ({ ...prev, initialAgentId: undefined }));
            onDataChange({ initialAgentId: undefined });
            return;
        }
        setLocalData(prev => ({ ...prev, initialAgentId: option.value.id }));
        onDataChange({ initialAgentId: option.value.id });
    };
    const onEnableClearHistoryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData(prev => ({ ...prev, enableClearHistory: event.target.checked }));
        onDataChange({ enableClearHistory: event.target.checked });
    };
    const onSendIntroductionsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData(prev => ({ ...prev, sendIntroductions: event.target.checked }));
        onDataChange({ sendIntroductions: event.target.checked });
    };
    const onMaxRetriesForSelectingChange = (value: number | null) => {
        setSpeakerData({ maxRetriesForSelecting: value });
    };
    const onSpeakerSelectionMethodChange = (
        option: {
            label: string;
            value: GroupChatSpeakerSelectionMethodOption;
        } | null,
    ) => {
        const newMethod = option?.value ?? undefined;
        setSpeakerData({ selectionMethod: newMethod });
        // setSpeakerData({ selectionMethod: value !== null ? value : undefined });
    };
    const currentAfterWorkFilter = data.handoffs?.filter(handoff => handoff?.after_work !== undefined);
    // there should be only one after work
    const currentAfterWork =
        currentAfterWorkFilter && currentAfterWorkFilter.length > 0
            ? currentAfterWorkFilter[0].after_work
            : undefined;
    const removeAfterWork = () => {
        const newHandoffs = data.handoffs?.filter(handoff => !handoff.after_work);
        setLocalData(prev => ({ ...prev, handoffs: newHandoffs }));
        props.onDataChange({
            ...data,
            handoffs: newHandoffs,
        });
    };
    const addOrUpdateAfterWork = (target: WaldiezTransitionTarget) => {
        let newHandoffs = data.handoffs?.filter(handoff => handoff.after_work === undefined);
        const newHandoff = {
            after_work: target,
            target_type: target.target_type,
            order: target.order,
        };
        if (newHandoffs) {
            const existingHandoffIndex = newHandoffs.findIndex(handoff => handoff.after_work !== undefined);
            if (existingHandoffIndex !== -1) {
                newHandoffs[existingHandoffIndex] = newHandoff;
            } else {
                newHandoffs.push(newHandoff);
            }
        } else {
            newHandoffs = [newHandoff];
        }
        console.log("newHandoffs", newHandoffs);
        setLocalData(prev => ({ ...prev, handoffs: newHandoffs }));
        props.onDataChange({
            ...data,
            handoffs: newHandoffs,
        });
    };
    const onAfterWorkChange = (target: WaldiezTransitionTarget | undefined) => {
        if (!target) {
            removeAfterWork();
        } else {
            addOrUpdateAfterWork(target);
        }
    };
    const models = getModels();
    const currentInitialAgent = localData.initialAgentId ? getAgentById(localData.initialAgentId) : undefined;
    const initialAgent = currentInitialAgent
        ? {
              label: currentInitialAgent.data.label,
              value: currentInitialAgent,
          }
        : undefined;
    const initialAgentOptions = groupMembers.map(agent => ({
        label: agent.data.label,
        value: agent,
    }));
    return {
        data: localData,
        models,
        groupMembers,
        initialAgent,
        initialAgentOptions,
        currentAfterWork,
        onNameChange,
        onDescriptionChange,
        onSystemMessageChange,
        onMaxRoundChange,
        onAddContextVariable,
        onDeleteContextVariable,
        onUpdateContextVariable,
        onInitialAgentChange,
        onEnableClearHistoryChange,
        onSendIntroductionsChange,
        onMaxRetriesForSelectingChange,
        onSpeakerSelectionMethodChange,
        onAfterWorkChange,
    };
};
