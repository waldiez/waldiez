/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { WaldiezNodeAgentData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for managing Waldiez Node Agent Footer functionality
 * Handles delete and clone operations for agents
 */
export const useWaldiezNodeAgentFooter = (props: {
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
}) => {
    const { id, isModalOpen } = props;

    // Store selectors
    const isReadOnly = useWaldiez(s => s.isReadOnly);
    const deleteAgent = useWaldiez(s => s.deleteAgent);
    const cloneAgent = useWaldiez(s => s.cloneAgent);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);

    /**
     * Handle agent deletion
     * Only triggers if not in read-only mode and modal is not open
     */
    const onDelete = useCallback(() => {
        if (isReadOnly === true || isModalOpen) {
            return;
        }

        deleteAgent(id);
        onFlowChanged();
    }, [isReadOnly, isModalOpen, deleteAgent, id, onFlowChanged]);

    /**
     * Handle agent cloning
     * Only triggers if not in read-only mode and modal is not open
     */
    const onClone = useCallback(() => {
        if (isReadOnly === true || isModalOpen) {
            return;
        }

        cloneAgent(id);
        onFlowChanged();
    }, [isReadOnly, isModalOpen, cloneAgent, id, onFlowChanged]);

    return {
        onDelete,
        onClone,
    };
};
