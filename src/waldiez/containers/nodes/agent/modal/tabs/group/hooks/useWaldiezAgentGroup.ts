/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgent, WaldiezNodeAgentData, WaldiezTransitionTarget } from "@waldiez/models";

/**
 * Custom hook for managing Waldiez Agent Group functionality
 * Handles group selection, joining and leaving groups, and related operations
 */
export const useWaldiezAgentGroup = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { id, agents, data, onDataChange } = props;

    /**
     * Filter all agents to get only group managers
     */
    const groupManagers = useMemo(
        () => agents.filter(agent => agent.data.agentType === "group_manager"),
        [agents],
    );

    /**
     * Get the current group manager if the agent is in a group
     */
    const groupMembers = useMemo(() => {
        if (!data.parentId) {
            return [];
        }
        return agents.filter(agent => agent.data.parentId === data.parentId && agent.id !== id);
    }, [agents, data.parentId, id]);

    /**
     * Get members of the current group (excluding self)
     */
    const currentGroupManager = useMemo(
        () => (data.parentId ? groupManagers.find(agent => agent.id === data.parentId) : undefined),
        [groupManagers, data.parentId],
    );

    /**
     * Create options for the group selection dropdown
     */
    const groupOptions = useMemo(
        () =>
            groupManagers.map(agent => ({
                label: agent.data.label,
                value: agent,
            })),
        [groupManagers],
    );

    /**
     * Track currently selected group in the dropdown
     */
    const [selectedGroup, setSelectedGroup] = useState<WaldiezNodeAgent | undefined>(currentGroupManager);

    /**
     * Sync selected group when current group manager changes
     */
    useEffect(() => {
        setSelectedGroup(currentGroupManager);
    }, [currentGroupManager]);

    /**
     * Handle group selection change
     */
    const onSelectGroupChange = useCallback(
        (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
            setSelectedGroup(option ? option.value : undefined);
        },
        [],
    );
    /**
     * Handle joining a group
     */
    const onJoinGroup = useCallback(() => {
        onDataChange({ parentId: selectedGroup?.id });
    }, [selectedGroup, onDataChange]);
    /**
     * Handle leaving a group
     */
    const onLeaveGroup = useCallback(() => {
        onDataChange({ parentId: undefined });
    }, [onDataChange]);

    const onAfterWorkChange = useCallback(
        (target: WaldiezTransitionTarget | undefined) => {
            // Create a copy of existing handoffs or initialize an empty array
            const handoffs = [...(data.handoffs || [])];

            if (handoffs.length === 0) {
                // If no handoffs exist, create a new one with the after_work target
                handoffs.push({
                    id: `handoff-${Date.now()}`,
                    after_work: target,
                });
            } else {
                // Update the first handoff's after_work
                handoffs[0] = {
                    ...handoffs[0],
                    after_work: target,
                };
            }

            // Update the agent data with the modified handoffs
            onDataChange({ handoffs });
        },
        [data.handoffs, onDataChange],
    );
    return {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        groupMembers,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
        onAfterWorkChange,
    };
};
