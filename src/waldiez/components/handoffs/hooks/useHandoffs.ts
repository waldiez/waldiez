/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useMemo } from "react";

import { useAgentRelationships } from "@waldiez/components/handoffs/hooks/useAgentRelationships";
import { useHandoffOrdering } from "@waldiez/components/handoffs/hooks/useHandoffOrdering";
import { useHandoffTargets } from "@waldiez/components/handoffs/hooks/useHandoffTargets";
import { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export const useHandoffs = (
    id: string,
    data: WaldiezNodeAgentData,
    agents: WaldiezNodeAgent[],
    edges: WaldiezEdge[],
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void,
) => {
    // Get agent relationship data
    const { groupEdges, getAgentName } = useAgentRelationships(id, data, agents, edges);

    // Get handoff targets
    const {
        nestedChats,
        afterWorkHandoff,
        orderedTransitionTargets,
        getTransitionTargetName,
        getNestedChatDisplayName,
        getAfterWorkTargetName,
    } = useHandoffTargets(data, groupEdges, getAgentName);

    // Get ordering functions
    const { moveTransitionTargetUp, moveTransitionTargetDown } = useHandoffOrdering(
        data,
        orderedTransitionTargets,
        nestedChats,
        getAgentName,
        onDataChange,
    );

    // Check if we have any handoffs to display
    const hasHandoffs = useMemo(
        () => orderedTransitionTargets.length > 0 || !!afterWorkHandoff,
        [orderedTransitionTargets, afterWorkHandoff],
    );

    return {
        hasHandoffs,
        orderedTransitionTargets,
        afterWorkHandoff,
        getTransitionTargetName,
        getAgentName,
        getNestedChatDisplayName,
        getAfterWorkTargetName,
        moveTransitionTargetUp,
        moveTransitionTargetDown,
    };
};
