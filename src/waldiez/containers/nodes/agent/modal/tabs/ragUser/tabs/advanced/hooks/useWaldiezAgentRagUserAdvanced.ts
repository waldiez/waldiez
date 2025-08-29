/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback } from "react";

import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models/types";

/**
 * Custom hook for managing advanced RAG settings
 * Handles custom prompts, context updating, and collection management
 */
export const useWaldiezAgentRagUserAdvanced = (props: {
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
     * Handle customized prompt changes
     */
    const onCustomizedPromptChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
            setRetrieveConfigConfigData({
                customizedPrompt: event.target.value,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle customized answer prefix changes
     */
    const onCustomizedAnswerPrefixChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                customizedAnswerPrefix: event.target.value,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle update context toggle
     */
    const onUpdateContextChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                updateContext: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle get or create toggle
     */
    const onGetOrCreateChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                getOrCreate: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle new docs toggle
     */
    const onNewDocsChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                newDocs: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle overwrite toggle
     */
    const onOverwriteChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                overwrite: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle recursive toggle
     */
    const onRecursiveChange = useCallback(
        (checked: boolean) => {
            setRetrieveConfigConfigData({
                recursive: checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    return {
        onCustomizedPromptChange,
        onCustomizedAnswerPrefixChange,
        onUpdateContextChange,
        onGetOrCreateChange,
        onNewDocsChange,
        onOverwriteChange,
        onRecursiveChange,
    };
};
