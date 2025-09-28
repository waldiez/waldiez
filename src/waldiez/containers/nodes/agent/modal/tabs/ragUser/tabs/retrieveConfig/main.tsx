/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { DropZone, InfoLabel, Select, StringList } from "@waldiez/components";
import { useWaldiezAgentRagUserRetrieveConfig } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/retrieveConfig/hooks";
import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models/types";

/**
 * RAG task options for the dropdown
 */
const taskOptions = [
    { label: "Code", value: "code" as const },
    { label: "QA", value: "qa" as const },
    { label: "Default", value: "default" as const },
];

/**
 * Mapping of task values to display labels
 */
const taskValuesMap = {
    code: "Code",
    qa: "QA",
    default: "Default",
};

/**
 * Allowed file extensions for document uploads
 */
const allowedFileExtensions = [
    ".txt",
    ".pdf",
    ".doc",
    ".docx",
    ".rtf",
    ".xlsx",
    ".xls",
    ".csv",
    ".json",
    ".yaml",
    ".yml",
    ".xml",
    ".md",
    ".odt",
];

type WaldiezAgentRagUserRetrieveConfigProps = {
    id: string;
    flowId: string;
    data: WaldiezNodeAgentRagUserData;
    uploadsEnabled: boolean;
    filesToUpload: File[];
    onFilesToUploadChange: (files: File[]) => void;
    onDataChange: (data: WaldiezNodeAgentData) => void;
};

/**
 * Component for configuring RAG User retrieve settings
 * Handles document paths, task configuration, and search parameters
 */
export const WaldiezAgentRagUserRetrieveConfig = memo((props: WaldiezAgentRagUserRetrieveConfigProps) => {
    const { id, flowId, uploadsEnabled, data } = props;
    const { retrieveConfig } = data;

    // Use the hook for handlers
    const {
        onFilesUpload,
        onTaskChange,
        onAddDocsPath,
        onRemoveDocsPath,
        onDocPathChange,
        onCollectionNameChange,
        onNResultsChange,
        onDistanceThresholdChange,
    } = useWaldiezAgentRagUserRetrieveConfig(props);

    /**
     * Current task value for the dropdown
     */
    const taskValue = useMemo(
        () => ({
            label: taskValuesMap[retrieveConfig.task],
            value: data.retrieveConfig.task,
        }),
        [data.retrieveConfig.task, retrieveConfig.task],
    );

    return (
        <div className="rag-retrieve-config-container" data-testid={`rag-retrieve-config-${id}`}>
            {/* Task Selection */}
            <div className="flex flex-col">
                <InfoLabel
                    label="Task:"
                    info={
                        "The task of the retrieve chat. " +
                        'Possible values are "code", "qa" and "default". ' +
                        "The system prompt will be different for different tasks. " +
                        "The default value is `default`, which supports both code and qa, " +
                        "and provides source information in the end of the response."
                    }
                    htmlFor={`rag-retrieve-task-input-${id}`}
                />

                <label className="hidden" htmlFor={`rag-retrieve-task-${id}`}>
                    Task
                </label>

                <Select
                    options={taskOptions}
                    value={taskValue}
                    onChange={onTaskChange}
                    inputId={`rag-retrieve-task-${id}`}
                    aria-label="Select RAG task type"
                />
            </div>

            {/* Document Paths */}
            <div className="flex flex-col">
                {uploadsEnabled && (
                    <div className="margin-top-20">
                        <DropZone
                            flowId={flowId}
                            onUpload={onFilesUpload}
                            allowedFileExtensions={allowedFileExtensions}
                            multiple
                            aria-label="Upload documents for RAG"
                        />
                    </div>
                )}

                <StringList
                    viewLabel="Docs Paths:"
                    viewLabelInfo={
                        "The paths of the documents for the retrieve chat. " +
                        "It can be a list of directories, files and urls. " +
                        "Default is None, which works only if the collection is already created."
                    }
                    items={retrieveConfig.docsPath}
                    itemsType="rag-doc"
                    onItemAdded={onAddDocsPath}
                    onItemDeleted={onRemoveDocsPath}
                    onItemChange={onDocPathChange}
                    aria-label="Document paths"
                />
            </div>

            {/* Collection Name */}
            <div className="flex flex-col">
                <InfoLabel
                    label="Collection Name:"
                    info="The name of the collection to be used in the vector database. If not provided, a default name `autogen-docs` will be used."
                    htmlFor={`rag-retrieve-collection-name-${id}`}
                />

                <input
                    type="text"
                    title="Collection name"
                    value={retrieveConfig.collectionName ?? ""}
                    onChange={onCollectionNameChange}
                    data-testid={`rag-retrieve-collection-name-${id}`}
                    aria-label="Collection name"
                    id={`rag-retrieve-collection-name-${id}`}
                />
            </div>

            {/* Number of Results */}
            <div className="flex flex-col">
                <InfoLabel
                    label="Number of results:"
                    info={
                        "The number of results to return. Default is None, " +
                        "which means the system will return all the results. " +
                        "Will be ignored if < 1."
                    }
                    htmlFor={`rag-retrieve-n-results-${id}`}
                />

                <input
                    title="Number of results"
                    type="number"
                    value={retrieveConfig.nResults ?? ""}
                    onChange={onNResultsChange}
                    data-testid={`rag-retrieve-n-results-${id}`}
                    aria-label="Number of results"
                    id={`rag-retrieve-n-results-${id}`}
                />
            </div>

            {/* Distance Threshold */}
            <div className="flex flex-col">
                <InfoLabel
                    htmlFor={`rag-retrieve-distance-threshold-${id}`}
                    label="Distance Threshold:"
                    info={
                        "The threshold for the distance score, only distance smaller than it will be returned. " +
                        "Will be ignored if < 0. Default is -1."
                    }
                />

                <input
                    title="Distance threshold"
                    type="number"
                    value={retrieveConfig.distanceThreshold ?? -1}
                    onChange={onDistanceThresholdChange}
                    data-testid={`rag-retrieve-distance-threshold-${id}`}
                    aria-label="Distance threshold"
                    id={`rag-retrieve-distance-threshold-${id}`}
                />
            </div>
        </div>
    );
});

WaldiezAgentRagUserRetrieveConfig.displayName = "WaldiezAgentRagUserRetrieveConfig";
