/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export const useWaldiezAgentGroup = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
}) => {
    const { agents, data, onDataChange } = props;
    const [selectedGroup, setSelectedGroup] = useState<WaldiezNodeAgent | null>(null);
    const groupManagers = agents.filter(agent => agent.data.agentType === "manager");
    const currentGroupManager: WaldiezNodeAgent | null = data.parentId
        ? (groupManagers.find(agent => agent.id === data.parentId) ?? null)
        : null;
    useEffect(() => {
        const manager = data.parentId
            ? (groupManagers.find(agent => agent.id === data.parentId) ?? null)
            : null;
        setSelectedGroup(manager);
    }, [data]);
    const groupOptions = groupManagers.map(agent => ({
        label: agent.data.label,
        value: agent,
    }));
    const onSelectGroupChange = (option: SingleValue<{ label: string; value: WaldiezNodeAgent }>) => {
        if (option) {
            setSelectedGroup(option.value);
        } else {
            setSelectedGroup(null);
        }
    };
    const onJoinGroup = () => {
        if (selectedGroup) {
            onDataChange({ parentId: selectedGroup.id });
        } else {
            onDataChange({ parentId: null });
        }
    };
    const onLeaveGroup = () => {
        onDataChange({ parentId: null });
    };
    return {
        groupOptions,
        currentGroupManager,
        selectedGroup,
        onSelectGroupChange,
        onJoinGroup,
        onLeaveGroup,
    };
};
