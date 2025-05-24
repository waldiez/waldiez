/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import { nanoid } from "nanoid";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeGroupManagerTabsProps } from "@waldiez/containers/nodes/agent/modal/tabs/groupManager/types";
import {
    GroupChatSpeakerSelectionMethodOption,
    WaldiezAgentGroupManagerSpeakers,
    WaldiezNodeAgent,
    WaldiezTransitionTarget,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for managing Waldiez Group Manager Tab functionality
 * Handles group settings, context variables, agent selection, and transitions
 */
export const useGroupManagerTabs = (props: WaldiezNodeGroupManagerTabsProps) => {
    const { id, data, onDataChange } = props;

    // Store selectors
    const getGroupMembers = useWaldiez(s => s.getGroupMembers);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const getModels = useWaldiez(s => s.getModels);

    /**
     * Get models, group members and current agent from store
     */
    const models = useMemo(() => getModels(), [getModels]);
    const groupMembers = useMemo(() => getGroupMembers(id), [getGroupMembers, id]);
    const currentInitialAgent = useMemo(
        () => (data.initialAgentId ? getAgentById(data.initialAgentId) : undefined),
        [data.initialAgentId, getAgentById],
    );

    /**
     * Derived data for dropdowns and selections
     */
    const initialAgent = useMemo(
        () =>
            currentInitialAgent
                ? {
                      label: currentInitialAgent.data.label,
                      value: currentInitialAgent,
                  }
                : undefined,
        [currentInitialAgent],
    );

    const initialAgentOptions = useMemo(
        () =>
            groupMembers.map(agent => ({
                label: agent.data.label,
                value: agent,
            })),
        [groupMembers],
    );

    const currentAfterWork = useMemo(() => {
        const currentAfterWorkFilter = data.handoffs?.filter(handoff => handoff?.after_work !== undefined);
        // There should be only one after work
        return currentAfterWorkFilter && currentAfterWorkFilter.length > 0
            ? currentAfterWorkFilter[0].after_work
            : undefined;
    }, [data.handoffs]);

    /**
     * Update speaker data
     */
    const setSpeakerData = useCallback(
        (speakerData: Partial<WaldiezAgentGroupManagerSpeakers>) => {
            const newSpeakerData = { ...data.speakers, ...speakerData };
            onDataChange({ speakers: newSpeakerData });
        },
        [data.speakers, onDataChange],
    );

    /**
     * Handle group name changes
     */
    const onGroupNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const groupName = event.target.value;
            onDataChange({ groupName });
        },
        [onDataChange],
    );

    /**
     * Handle manager name changes
     */
    const onManagerNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const newName = event.target.value;
            onDataChange({ name: newName, label: newName });
        },
        [onDataChange],
    );

    /**
     * Handle description changes
     */
    const onDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const description = event.target.value;
            onDataChange({ description });
        },
        [onDataChange],
    );

    /**
     * Handle system message changes
     */
    const onSystemMessageChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            const systemMessage = event.target.value;
            onDataChange({ systemMessage });
        },
        [onDataChange],
    );

    /**
     * Handle max round changes
     */
    const onMaxRoundChange = useCallback(
        (value: number | null) => {
            if (value !== null && value > 0) {
                onDataChange({ maxRound: value });
            }
        },
        [onDataChange],
    );

    /**
     * Handle context variable operations
     */
    const onAddContextVariable = useCallback(
        (key: string, value: string) => {
            const newContextVariables = { ...data.contextVariables, [key]: value };

            onDataChange({ contextVariables: newContextVariables });
        },
        [data.contextVariables, onDataChange],
    );

    const onDeleteContextVariable = useCallback(
        (key: string) => {
            const newContextVariables = { ...data.contextVariables };
            delete newContextVariables[key];
            onDataChange({ contextVariables: newContextVariables });
        },
        [data.contextVariables, onDataChange],
    );

    const onUpdateContextVariable = useCallback(
        (items: { [key: string]: unknown }) => {
            onDataChange({ contextVariables: items });
        },
        [onDataChange],
    );

    /**
     * Handle initial agent changes
     */
    const onInitialAgentChange = useCallback(
        (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
            if (!option) {
                onDataChange({ initialAgentId: undefined });
                return;
            }

            const initialAgentId = option.value.id;
            onDataChange({ initialAgentId });
        },
        [onDataChange],
    );

    /**
     * Handle clear history toggle changes
     */
    const onEnableClearHistoryChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const enableClearHistory = event.target.checked;
            onDataChange({ enableClearHistory });
        },
        [onDataChange],
    );

    /**
     * Handle send introductions toggle changes
     */
    const onSendIntroductionsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const sendIntroductions = event.target.checked;
            onDataChange({ sendIntroductions });
        },
        [onDataChange],
    );

    /**
     * Handle max retries for selecting changes
     */
    const onMaxRetriesForSelectingChange = useCallback(
        (value: number | null) => {
            setSpeakerData({ maxRetriesForSelecting: value });
        },
        [setSpeakerData],
    );

    /**
     * Handle speaker selection method changes
     */
    const onSpeakerSelectionMethodChange = useCallback(
        (
            option: {
                label: string;
                value: GroupChatSpeakerSelectionMethodOption;
            } | null,
        ) => {
            const selectionMethod = option?.value ?? undefined;
            setSpeakerData({ selectionMethod });
        },
        [setSpeakerData],
    );

    /**
     * Remove after work transition
     */
    const removeAfterWork = useCallback(() => {
        const newHandoffs = data.handoffs?.filter(handoff => !handoff.after_work);
        onDataChange({
            ...data,
            handoffs: newHandoffs,
        });
    }, [data, onDataChange]);

    /**
     * Add or update after work transition
     */
    const addOrUpdateAfterWork = useCallback(
        (target: WaldiezTransitionTarget) => {
            let newHandoffs = data.handoffs?.filter(handoff => handoff.after_work === undefined);
            const newHandoff = {
                id: nanoid(),
                after_work: target,
            };

            if (newHandoffs) {
                const existingHandoffIndex = newHandoffs.findIndex(
                    handoff => handoff.after_work !== undefined,
                );
                if (existingHandoffIndex !== -1) {
                    newHandoffs[existingHandoffIndex] = newHandoff;
                } else {
                    newHandoffs.push(newHandoff);
                }
            } else {
                newHandoffs = [newHandoff];
            }
            onDataChange({
                ...data,
                handoffs: newHandoffs,
            });
        },
        [data, onDataChange],
    );

    /**
     * Handle after work changes
     */
    const onAfterWorkChange = useCallback(
        (target: WaldiezTransitionTarget | undefined) => {
            if (!target) {
                removeAfterWork();
            } else {
                addOrUpdateAfterWork(target);
            }
        },
        [removeAfterWork, addOrUpdateAfterWork],
    );

    return {
        models,
        groupMembers,
        initialAgent,
        initialAgentOptions,
        currentAfterWork,
        onGroupNameChange,
        onManagerNameChange,
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
