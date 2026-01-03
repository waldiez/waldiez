/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback } from "react";

import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

/**
 * Custom hook for managing custom functions configuration for RAG
 * Handles embedding, token counting, and text splitting functions
 */
export const useWaldiezAgentRagUserCustomFunctions = (props: {
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
     * Handle custom embedding toggle
     */
    const onUseCustomEmbeddingChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                useCustomEmbedding: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle embedding function content changes
     */
    const onEmbeddingFunctionChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                setRetrieveConfigConfigData({
                    embeddingFunction: value,
                });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle custom token count toggle
     */
    const onUseCustomTokenCountChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                useCustomTokenCount: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle token count function content changes
     */
    const onCustomTokenCountFunctionChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                setRetrieveConfigConfigData({
                    customTokenCountFunction: value,
                });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle custom text split toggle
     */
    const onUseCustomTextSplitChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                useCustomTextSplit: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle text split function content changes
     */
    const onCustomTextSplitFunctionChange = useCallback(
        (value: string | undefined) => {
            if (value !== undefined) {
                setRetrieveConfigConfigData({
                    customTextSplitFunction: value,
                });
            }
        },
        [setRetrieveConfigConfigData],
    );

    return {
        onUseCustomEmbeddingChange,
        onEmbeddingFunctionChange,
        onUseCustomTokenCountChange,
        onCustomTokenCountFunctionChange,
        onUseCustomTextSplitChange,
        onCustomTextSplitFunctionChange,
    };
};
