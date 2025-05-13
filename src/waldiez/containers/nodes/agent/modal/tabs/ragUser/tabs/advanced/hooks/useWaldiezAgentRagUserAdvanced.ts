/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback } from "react";

import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

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
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                updateContext: event.target.checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle get or create toggle
     */
    const onGetOrCreateChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                getOrCreate: event.target.checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle new docs toggle
     */
    const onNewDocsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                newDocs: event.target.checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle overwrite toggle
     */
    const onOverwriteChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                overwrite: event.target.checked,
            });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle recursive toggle
     */
    const onRecursiveChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({
                recursive: event.target.checked,
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
