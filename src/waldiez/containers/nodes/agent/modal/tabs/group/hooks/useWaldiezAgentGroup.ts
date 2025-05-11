/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export const useWaldiezAgentGroup = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { id, agents, data, onDataChange } = props;

    // Memoize filter operations to avoid recalculation on each render
    const groupManagers = useMemo(
        () => agents.filter(agent => agent.data.agentType === "group_manager"),
        [agents],
    );

    // Memoize group members computation
    const groupMembers = useMemo(() => {
        if (!data.parentId) {
            return [];
        }
        return agents.filter(agent => agent.data.parentId === data.parentId && agent.id !== id);
    }, [agents, data.parentId, id]);

    // Memoize current group manager lookup
    const currentGroupManager = useMemo(
        () => (data.parentId ? groupManagers.find(agent => agent.id === data.parentId) : undefined),
        [groupManagers, data.parentId],
    );

    // Memoize group options to avoid recreation on renders
    const groupOptions = useMemo(
        () =>
            groupManagers.map(agent => ({
                label: agent.data.label,
                value: agent,
            })),
        [groupManagers],
    );

    // Selected group state
    const [selectedGroup, setSelectedGroup] = useState<WaldiezNodeAgent | undefined>(currentGroupManager);

    // Sync selected group when data changes
    useEffect(() => {
        setSelectedGroup(currentGroupManager);
    }, [currentGroupManager]);

    // Memoize handlers to avoid recreation on renders
    const onSelectGroupChange = useCallback(
        (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
            setSelectedGroup(option ? option.value : undefined);
        },
        [],
    );

    const onJoinGroup = useCallback(() => {
        onDataChange({ parentId: selectedGroup?.id });
    }, [selectedGroup, onDataChange]);

    const onLeaveGroup = useCallback(() => {
        onDataChange({ parentId: undefined });
    }, [onDataChange]);

    return {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        groupMembers,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
    };
};
