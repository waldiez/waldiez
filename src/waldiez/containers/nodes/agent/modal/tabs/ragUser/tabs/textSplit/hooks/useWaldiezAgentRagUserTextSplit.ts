/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

/**
 * Custom hook for managing text splitting configuration for RAG
 * Handles token settings, chunk mode, and splitting behavior
 */
export const useWaldiezAgentRagUserTextSplit = (props: {
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const { data, onDataChange } = props;

    /**
     * Update retrieve config with partial data
     */
    const setRetrieveConfigConfigData = useCallback(
        (partialData: Partial<WaldiezNodeAgentRagUserData["retrieveConfig"]>) => {
            onDataChange({
                ...data,
                retrieveConfig: {
                    ...data.retrieveConfig,
                    ...partialData,
                },
            });
        },
        [data, onDataChange],
    );

    /**
     * Handle chunk token size changes
     */
    const onChunkTokenSizeChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.value || event.target.value.trim() === "") {
                setRetrieveConfigConfigData({ chunkTokenSize: undefined });
                return;
            }
            try {
                const value = parseInt(event.target.value, 10);

                if (isNaN(value) || value < 1) {
                    return; // Ignore invalid values
                }

                setRetrieveConfigConfigData({ chunkTokenSize: value });
            } catch (_) {
                // Handle parsing errors silently
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle context max tokens changes
     */
    const onContextMaxTokensChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.value || event.target.value.trim() === "") {
                setRetrieveConfigConfigData({ contextMaxTokens: undefined });
                return;
            }
            try {
                const value = parseInt(event.target.value, 10);

                if (isNaN(value) || value < 1) {
                    return; // Ignore invalid values
                }

                setRetrieveConfigConfigData({ contextMaxTokens: value });
            } catch (_) {
                // Handle parsing errors silently
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle chunk mode changes
     */
    const onChunkModeChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: "multi_lines" | "one_line";
            }>,
        ) => {
            if (option) {
                setRetrieveConfigConfigData({ chunkMode: option.value });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle must break at empty line toggle
     */
    const onMustBreakAtEmptyLineChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                mustBreakAtEmptyLine: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    return {
        onChunkTokenSizeChange,
        onContextMaxTokensChange,
        onChunkModeChange,
        onMustBreakAtEmptyLineChange,
    };
};
