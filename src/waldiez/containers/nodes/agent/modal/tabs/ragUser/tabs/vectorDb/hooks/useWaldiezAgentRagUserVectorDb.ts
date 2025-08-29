/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback } from "react";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models/types";

/**
 * Custom hook for managing Vector DB configuration for RAG
 * Handles database settings, model selection, and storage options
 */
export const useWaldiezAgentRagUserVectorDb = (props: {
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
     * Update DB config with partial data (preserves other settings)
     */
    const updateDbConfig = useCallback(
        (partialDbConfig: Partial<typeof data.retrieveConfig.dbConfig>) => {
            setRetrieveConfigConfigData({
                dbConfig: {
                    ...data.retrieveConfig.dbConfig,
                    ...partialDbConfig,
                },
            });
        },
        [data, setRetrieveConfigConfigData],
    );

    /**
     * Handle vector DB type changes
     */
    const onVectorDbChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: "chroma" | "pgvector" | "mongodb" | "qdrant";
            }>,
        ) => {
            if (option) {
                setRetrieveConfigConfigData({ vectorDb: option.value });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle embedding model changes
     */
    const onModelChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({ model: event.target.value });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle Qdrant memory storage toggle
     */
    const onQdrantUseMemoryChange = useCallback(
        (checked: boolean) => {
            updateDbConfig({
                useMemory: checked,
                useLocalStorage: false,
            });
        },
        [updateDbConfig],
    );

    /**
     * Handle Qdrant local storage toggle
     */
    const onQdrantUseLocalStorageChange = useCallback(
        (checked: boolean) => {
            updateDbConfig({
                useMemory: false,
                useLocalStorage: checked,
            });
        },
        [updateDbConfig],
    );

    /**
     * Handle Qdrant local storage path changes
     */
    const onQdrantLocalStoragePathChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            updateDbConfig({
                localStoragePath: event.target.value,
            });
        },
        [updateDbConfig],
    );

    /**
     * Handle Chroma local storage toggle
     */
    const onChromaUseLocalStorageChange = useCallback(
        (checked: boolean) => {
            updateDbConfig({
                useLocalStorage: checked,
            });
        },
        [updateDbConfig],
    );

    /**
     * Handle Chroma local storage path changes
     */
    const onChromaLocalStoragePathChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            updateDbConfig({
                localStoragePath: event.target.value,
            });
        },
        [updateDbConfig],
    );

    /**
     * Handle DB connection URL changes
     */
    const onDbConfigConnectionUrlChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            updateDbConfig({
                connectionUrl: event.target.value,
            });
        },
        [updateDbConfig],
    );

    return {
        onVectorDbChange,
        onModelChange,
        onQdrantUseMemoryChange,
        onQdrantUseLocalStorageChange,
        onQdrantLocalStoragePathChange,
        onChromaUseLocalStorageChange,
        onChromaLocalStoragePathChange,
        onDbConfigConnectionUrlChange,
    };
};
