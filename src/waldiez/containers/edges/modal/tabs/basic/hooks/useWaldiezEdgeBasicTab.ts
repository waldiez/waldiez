/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type ChangeEvent, useCallback, useMemo } from "react";

import type { WaldiezEdgeBasicTabProps } from "@waldiez/containers/edges/modal/tabs/basic/types";
import type { WaldiezEdgeType } from "@waldiez/models/types";

const EDGE_TYPE_OPTIONS: { label: string; value: WaldiezEdgeType }[] = [
    { label: "Chat", value: "chat" },
    { label: "Nested Chat", value: "nested" },
];

/**
 * Custom hook for managing the basic tab of the edge modal
 */
export const useWaldiezEdgeBasicTab = (props: WaldiezEdgeBasicTabProps) => {
    const { data, edgeType, onDataChange } = props;

    /**
     * Update the edge description
     */
    const onDescriptionChange = useCallback(
        (e: ChangeEvent<HTMLTextAreaElement>) => {
            onDataChange({ description: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Update the edge label
     */
    const onLabelChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onDataChange({ label: e.target.value });
        },
        [onDataChange],
    );

    /**
     * Toggle the clear history option
     */
    const onClearHistoryChange = useCallback(
        (checked: boolean) => {
            if (data.clearHistory === checked) {
                return; // No change, do nothing
            }
            // Ensure that the onDataChange function is defined and available
            if (typeof onDataChange !== "function") {
                return; // Exit if onDataChange is not a function
            }
            onDataChange({ clearHistory: checked });
        },
        [onDataChange, data.clearHistory],
    );
    /**
     * Update the maximum number of turns
     */
    const onMaxTurnsChange = useCallback(
        (value: number | null) => {
            onDataChange({ maxTurns: value });
        },
        [onDataChange],
    );

    const currentSelectedChatType = useMemo(() => {
        const chatTypeLabel = EDGE_TYPE_OPTIONS.find(option => option.value === edgeType)?.label || "Chat";

        return {
            label: chatTypeLabel,
            value: edgeType as WaldiezEdgeType,
        };
    }, [edgeType]);

    return {
        edgeTypeOptions: EDGE_TYPE_OPTIONS,
        currentSelectedChatType,
        onLabelChange,
        onDescriptionChange,
        onClearHistoryChange,
        onMaxTurnsChange,
    };
};
