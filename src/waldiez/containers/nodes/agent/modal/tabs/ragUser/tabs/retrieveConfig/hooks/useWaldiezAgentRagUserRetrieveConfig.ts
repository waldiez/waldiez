/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models";

export const useWaldiezAgentRagUserRetrieveConfig = (props: {
    data: WaldiezNodeAgentRagUserData;
    filesToUpload: File[];
    onFilesToUploadChange: (files: File[]) => void;
    onDataChange: (data: WaldiezNodeAgentData) => void;
}) => {
    const { data, onDataChange, filesToUpload, onFilesToUploadChange } = props;
    const onFilesUpload = (files: File[]) => {
        const newDocsPath = [...data.retrieveConfig.docsPath];
        const newFilesToUpload = [...filesToUpload];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
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
    };
    const setRetrieveConfigConfigData = (
        partialData: Partial<WaldiezNodeAgentRagUserData["retrieveConfig"]>,
    ) => {
        onDataChange({
            ...data,
            retrieveConfig: {
                ...data.retrieveConfig,
                ...partialData,
            },
        });
    };
    const onTaskChange = (
        option: SingleValue<{
            label: string;
            value: "code" | "qa" | "default";
        }>,
    ) => {
        if (option) {
            setRetrieveConfigConfigData({ task: option.value });
        }
    };
    const onAddDocsPath = (value: string) => {
        setRetrieveConfigConfigData({
            docsPath: [...data.retrieveConfig.docsPath, value],
        });
    };
    const onRemoveDocsPath = (docPath: string) => {
        if (filesToUpload) {
            const newFiles: File[] = [];
            for (let i = 0; i < filesToUpload.length; i++) {
                if (`file:///${filesToUpload[i].name}` !== docPath) {
                    newFiles.push(filesToUpload[i]);
                }
            }
            onFilesToUploadChange(newFiles.length > 0 ? newFiles : []);
        }
        const docsPath = data.retrieveConfig.docsPath.filter(path => path !== docPath);
        setRetrieveConfigConfigData({
            docsPath,
        });
    };
    const onDocPathChange = (oldItem: string, newItem: string) => {
        setRetrieveConfigConfigData({
            docsPath: data.retrieveConfig.docsPath.map(path => (path === oldItem ? newItem : path)),
        });
    };
    const onCollectionNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setRetrieveConfigConfigData({ collectionName: event.target.value });
    };
    const onNResultsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = parseInt(event.target.value, 10);
            if (isNaN(value) || value < 1) {
                setRetrieveConfigConfigData({ n_results: null });
            } else {
                setRetrieveConfigConfigData({ n_results: value });
            }
        } catch (_) {
            //
        }
    };
    const onDistanceThresholdChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            const value = parseFloat(event.target.value);
            if (isNaN(value) || value < 0) {
                setRetrieveConfigConfigData({ distanceThreshold: null });
            } else {
                setRetrieveConfigConfigData({ distanceThreshold: value });
            }
        } catch (_) {
            //
        }
    };
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
