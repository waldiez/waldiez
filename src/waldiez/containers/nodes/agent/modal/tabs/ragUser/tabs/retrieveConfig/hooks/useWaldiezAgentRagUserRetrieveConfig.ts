/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback } from "react";

import type { SingleValue } from "@waldiez/components";
import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models/types";

/**
 * Custom hook for managing RAG User retrieve configuration
 * Handles file uploads, task configuration, and search parameters
 */
export const useWaldiezAgentRagUserRetrieveConfig = (props: {
    data: WaldiezNodeAgentRagUserData;
    filesToUpload: File[];
    onFilesToUploadChange: (files: File[]) => void;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const { data, onDataChange, filesToUpload, onFilesToUploadChange } = props;

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
     * Handle file uploads for RAG
     */
    const onFilesUpload = useCallback(
        (files: File[]) => {
            if (!files.length) {
                return;
            }

            const newDocsPath = [...data.retrieveConfig.docsPath];
            const newFilesToUpload = [...filesToUpload];

            // Add new files to the docsPath and filesToUpload arrays
            for (const file of files) {
                const docPath = `file:///${file.name}`;

                if (!newDocsPath.includes(docPath)) {
                    newDocsPath.push(docPath);
                    newFilesToUpload.push(file);
                }
            }

            onFilesToUploadChange(newFilesToUpload);
            setRetrieveConfigConfigData({
                docsPath: newDocsPath,
            });
        },
        [data.retrieveConfig.docsPath, filesToUpload, onFilesToUploadChange, setRetrieveConfigConfigData],
    );

    /**
     * Handle task type changes
     */
    const onTaskChange = useCallback(
        (
            option: SingleValue<{
                label: string;
                value: "code" | "qa" | "default";
            }>,
        ) => {
            if (option) {
                setRetrieveConfigConfigData({ task: option.value });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Add a document path to the configuration
     */
    const onAddDocsPath = useCallback(
        (value: string) => {
            setRetrieveConfigConfigData({
                docsPath: [...data.retrieveConfig.docsPath, value],
            });
        },
        [data.retrieveConfig.docsPath, setRetrieveConfigConfigData],
    );

    /**
     * Remove a document path from the configuration
     */
    const onRemoveDocsPath = useCallback(
        (docPath: string) => {
            // Remove from filesToUpload if it's a file
            if (filesToUpload.length) {
                const newFiles = filesToUpload.filter(file => `file:///${file.name}` !== docPath);

                onFilesToUploadChange(newFiles.length ? newFiles : []);
            }

            // Remove from docsPath
            const docsPath = data.retrieveConfig.docsPath.filter(path => path !== docPath);
            setRetrieveConfigConfigData({ docsPath });
        },
        [data.retrieveConfig.docsPath, filesToUpload, onFilesToUploadChange, setRetrieveConfigConfigData],
    );

    /**
     * Update a document path
     */
    const onDocPathChange = useCallback(
        (oldItem: string, newItem: string) => {
            setRetrieveConfigConfigData({
                docsPath: data.retrieveConfig.docsPath.map(path => (path === oldItem ? newItem : path)),
            });
        },
        [data.retrieveConfig.docsPath, setRetrieveConfigConfigData],
    );

    /**
     * Handle collection name changes
     */
    const onCollectionNameChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setRetrieveConfigConfigData({ collectionName: event.target.value });
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle number of results changes
     */
    const onNResultsChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.value || event.target.value.trim() === "") {
                setRetrieveConfigConfigData({ nResults: null });
                return;
            }
            try {
                const value = parseInt(event.target.value, 10);

                setRetrieveConfigConfigData({
                    nResults: isNaN(value) || value < 1 ? null : value,
                });
            } catch (_) {
                // Handle parsing errors silently
                setRetrieveConfigConfigData({ nResults: null });
            }
        },
        [setRetrieveConfigConfigData],
    );

    /**
     * Handle distance threshold changes
     */
    const onDistanceThresholdChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            if (!event.target.value || event.target.value.trim() === "") {
                setRetrieveConfigConfigData({ distanceThreshold: null });
                return;
            }
            try {
                const value = parseFloat(event.target.value);

                setRetrieveConfigConfigData({
                    distanceThreshold: isNaN(value) || value < 0 ? null : value,
                });
            } catch (_) {
                // Handle parsing errors silently
                setRetrieveConfigConfigData({ distanceThreshold: null });
            }
        },
        [setRetrieveConfigConfigData],
    );

    return {
        onFilesUpload,
        onTaskChange,
        onAddDocsPath,
        onRemoveDocsPath,
        onDocPathChange,
        onCollectionNameChange,
        onNResultsChange,
        onDistanceThresholdChange,
    };
};
