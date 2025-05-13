/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useCallback, useMemo } from "react";

import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for managing Waldiez Node Agent Body functionality
 * Handles description changes and member modal interactions
 */
export const useWaldiezNodeAgentBody = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
}) => {
    const { id, isModalOpen } = props;

    // Store selectors
    const getAgentById = useWaldiez(s => s.getAgentById);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const onNodeDoubleClick = useWaldiez(s => s.onNodeDoubleClick);
    const getGroupMembers = useWaldiez(s => s.getGroupMembers);

    // Memoized derived data
    const groupMembers = useMemo(() => getGroupMembers(id) as WaldiezNodeAgent[], [getGroupMembers, id]);

    /**
     * Handle description changes for the agent
     * Updates agent data only if modal is not open
     */
    const onDescriptionChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            if (!isModalOpen) {
                const agent = getAgentById(id) as WaldiezNodeAgent;
                if (agent) {
                    updateAgentData(id, {
                        ...agent.data,
                        description: event.target.value,
                    });
                }
            }
        },
        [isModalOpen, getAgentById, id, updateAgentData],
    );

    /**
     * Handle opening a member's modal
     * Only triggers if the parent modal is not already open
     */
    const onOpenMemberModal = useCallback(
        (member: Node) => {
            if (!isModalOpen) {
                onNodeDoubleClick(null, member);
            }
        },
        [isModalOpen, onNodeDoubleClick],
    );

    return {
        onDescriptionChange,
        onOpenMemberModal,
        groupMembers,
    };
};
