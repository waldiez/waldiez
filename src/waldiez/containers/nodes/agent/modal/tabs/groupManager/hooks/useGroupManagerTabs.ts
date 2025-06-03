/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

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
     * Make sure data.speakers.order always has all the group members
     * This ensures that the order is always consistent with the group members
     * if not present, it initializes with the group members
     * if some of the members are not present in the order, it adds them
     * if the order has members that are not in the group members, it removes them
     */
    const speakersOrder = useMemo(() => {
        const groupMembers = getGroupMembers(id);
        const currentOrder = data.speakers.order || [];

        // Create a set of group member IDs for quick lookup
        const groupMemberIds = new Set(groupMembers.map(member => member.id));

        // Filter out any agents not in the group members
        const filteredOrder = currentOrder.filter(agentId => groupMemberIds.has(agentId));

        // Add any missing group members to the order
        const filteredOrderSet = new Set(filteredOrder);
        const missingMembers = groupMembers
            .filter(member => !filteredOrderSet.has(member.id))
            .map(member => member.id);

        let updatedOrder = [...filteredOrder, ...missingMembers];

        // Handle initialAgentId: ensure it's always at the start if present
        if (data.initialAgentId && groupMemberIds.has(data.initialAgentId)) {
            // Remove it from its current position (if present)
            updatedOrder = updatedOrder.filter(id => id !== data.initialAgentId);
            // Add it to the beginning
            updatedOrder.unshift(data.initialAgentId);
        }

        return updatedOrder;
    }, [getGroupMembers, id, data.speakers.order, data.initialAgentId]);

    const updateSpeakersOrder = useCallback(
        (newOrder: string[]) => {
            // Update the speakers order in the data
            onDataChange({
                speakers: {
                    ...data.speakers,
                    order: newOrder,
                },
            });
        },
        [data.speakers, onDataChange],
    );

    const onMoveMemberUp = useCallback(
        (agentId: string) => {
            if (!speakersOrder.includes(agentId)) {
                return;
            }

            const currentIndex = speakersOrder.indexOf(agentId);

            // Can't move up if already at the top
            if (currentIndex <= 0) {
                return;
            }

            // If there's an initialAgentId, can't move above position 1 (index 0 is reserved)
            if (data.initialAgentId && currentIndex === 1) {
                return;
            }

            const newOrder = [...speakersOrder];
            // Swap with the element above
            [newOrder[currentIndex - 1], newOrder[currentIndex]] = [
                newOrder[currentIndex],
                newOrder[currentIndex - 1],
            ];

            // Update the data (assuming you have a function to update speakers order)
            updateSpeakersOrder(newOrder);
        },
        [speakersOrder, data.initialAgentId, updateSpeakersOrder],
    );

    const onMoveMemberDown = useCallback(
        (agentId: string) => {
            if (!speakersOrder.includes(agentId)) {
                return;
            }

            const currentIndex = speakersOrder.indexOf(agentId);

            // Can't move down if already at the bottom
            if (currentIndex >= speakersOrder.length - 1) {
                return;
            }

            // If this is the initialAgentId, it can't be moved down (must stay first)
            if (data.initialAgentId && agentId === data.initialAgentId) {
                return;
            }

            const newOrder = [...speakersOrder];
            // Swap with the element below
            [newOrder[currentIndex], newOrder[currentIndex + 1]] = [
                newOrder[currentIndex + 1],
                newOrder[currentIndex],
            ];

            // Update the data (assuming you have a function to update speakers order)
            updateSpeakersOrder(newOrder);
        },
        [speakersOrder, data.initialAgentId, updateSpeakersOrder],
    );

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
     * Handle after work changes
     */
    const onAfterWorkChange = useCallback(
        (target: WaldiezTransitionTarget | undefined | null) => {
            if (!target) {
                onDataChange({
                    ...data,
                    afterWork: null,
                });
            } else {
                onDataChange({
                    ...data,
                    afterWork: target,
                });
            }
        },
        [data, onDataChange],
    );

    return {
        models,
        groupMembers,
        speakersOrder,
        initialAgent,
        initialAgentOptions,
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
        onMoveMemberUp,
        onMoveMemberDown,
    };
};
