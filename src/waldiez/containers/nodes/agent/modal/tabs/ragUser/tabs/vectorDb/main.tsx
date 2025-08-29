/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";

import { InfoCheckbox, InfoLabel, Select } from "@waldiez/components";
import { useWaldiezAgentRagUserVectorDb } from "@waldiez/containers/nodes/agent/modal/tabs/ragUser/tabs/vectorDb/hooks";
import type { WaldiezNodeAgentData, WaldiezNodeAgentRagUserData } from "@waldiez/models/types";

/**
 * Vector DB options for the dropdown
 */
const vectorDbOptions = [
    { label: "Chroma", value: "chroma" as const },
    { label: "Qdrant", value: "qdrant" as const },
    { label: "Pgvector", value: "pgvector" as const },
    { label: "MongoDB", value: "mongodb" as const },
];

/**
 * Mapping of vector DB values to display labels
 */
const vectorDbValuesMap = {
    chroma: "Chroma",
    pgvector: "Pgvector",
    mongodb: "MongoDB",
    qdrant: "Qdrant",
};

/**
 * Default model names for each vector DB
 */
const modelNameMapping = {
    chroma: "all-MiniLM-L6-v2",
    pgvector: "all-MiniLM-L6-v2",
    mongodb: "all-MiniLM-L6-v2",
    qdrant: "BAAI/bge-small-en-v1.5",
};

/**
 * Embedding model information tooltip content
 */
const getEmbeddingModelInfoView = () => (
    <div>
        The model for embedding. <br />
        The defaults are: <br />
        <b>Chroma:</b> all-MiniLM-L6-v2; <br />
        <b>Pgvector:</b> all-MiniLM-L6-v2; <br />
        <b>MongoDB:</b> all-MiniLM-L6-v2; <br />
        <b>Qdrant:</b> BAAI/bge-small-en-v1.5.
    </div>
);

type WaldiezAgentRagUserVectorDbProps = {
    id: string;
    data: WaldiezNodeAgentRagUserData;
    onDataChange: (data: WaldiezNodeAgentData) => void;
};

/**
 * Component for configuring Vector DB settings for RAG
 * Handles database type, model selection, and storage options
 */
export const WaldiezAgentRagUserVectorDb = memo((props: WaldiezAgentRagUserVectorDbProps) => {
    const { id, data } = props;
    const { retrieveConfig } = data;

    // Use the hook for handlers
    const {
        onVectorDbChange,
        onModelChange,
        onQdrantUseMemoryChange,
        onQdrantUseLocalStorageChange,
        onQdrantLocalStoragePathChange,
        onChromaUseLocalStorageChange,
        onChromaLocalStoragePathChange,
        onDbConfigConnectionUrlChange,
    } = useWaldiezAgentRagUserVectorDb(props);

    /**
     * Current vector DB type for the dropdown
     */
    const vectorDbValue = useMemo(
        () => ({
            label: vectorDbValuesMap[retrieveConfig.vectorDb ?? "chroma"],
            value: retrieveConfig.vectorDb ?? "chroma",
        }),
        [retrieveConfig.vectorDb],
    );

    /**
     * Current model value
     */
    const modelValue = useMemo(
        () => retrieveConfig.dbConfig.model ?? modelNameMapping[retrieveConfig.vectorDb ?? "chroma"],
        [retrieveConfig.dbConfig.model, retrieveConfig.vectorDb],
    );

    /**
     * Determine if Qdrant-specific settings should be shown
     */
    const isQdrant = retrieveConfig.vectorDb === "qdrant";

    /**
     * Determine if Chroma-specific settings should be shown
     */
    const isChroma = retrieveConfig.vectorDb === "chroma";

    /**
     * Determine if memory storage is used (Qdrant)
     */
    const usesMemoryStorage = isQdrant && retrieveConfig.dbConfig.useMemory;

    /**
     * Determine if local storage is used (both Qdrant and Chroma)
     */
    const usesLocalStorage = retrieveConfig.dbConfig.useLocalStorage;

    /**
     * Determine if connection URL should be shown (not Qdrant or Qdrant with no storage)
     */
    const showConnectionUrl = !isQdrant || (isQdrant && !usesMemoryStorage && !usesLocalStorage);

    return (
        <div className="flex-column vector-db-config" data-testid={`rag-vector-db-config-${id}`}>
            {/* Vector DB Type Selection */}
            <label htmlFor={`rag-vector-db-${id}`}>Vector DB:</label>
            <Select
                options={vectorDbOptions}
                value={vectorDbValue}
                onChange={onVectorDbChange}
                inputId={`rag-vector-db-${id}`}
                aria-label="Select vector database type"
            />

            {/* Embedding Model */}
            <InfoLabel
                label="Embedding Model:"
                info={getEmbeddingModelInfoView}
                htmlFor={`rag-vector-db-model-${id}`}
            />
            <input
                type="text"
                title="Embedding model"
                value={modelValue}
                onChange={onModelChange}
                data-testid={`rag-vector-db-model-${id}`}
                id={`rag-vector-db-model-${id}`}
                aria-label="Embedding model name"
            />

            {/* Qdrant-specific Settings */}
            {isQdrant && (
                <>
                    <InfoCheckbox
                        label="Use Memory Storage "
                        info="Use memory for the vector db. Default is True."
                        checked={retrieveConfig.dbConfig.useMemory}
                        id={`rag-vector-db-use-memory-${id}`}
                        onChange={onQdrantUseMemoryChange}
                        aria-label="Use memory storage for Qdrant"
                    />

                    {!usesMemoryStorage && (
                        <>
                            <InfoCheckbox
                                label="Use Local Storage "
                                info='Use local storage for the vector db. Default is: True if "Use Memory Storage" is False.'
                                checked={usesLocalStorage}
                                onChange={onQdrantUseLocalStorageChange}
                                id={`rag-vector-db-use-local-storage-${id}`}
                                aria-label="Use local storage for Qdrant"
                            />

                            {usesLocalStorage && (
                                <>
                                    <label htmlFor={`rag-vector-db-local-storage-path-${id}`}>
                                        Storage Path:
                                    </label>
                                    <input
                                        id={`rag-vector-db-local-storage-path-${id}`}
                                        title="Storage path"
                                        type="text"
                                        value={retrieveConfig.dbConfig.localStoragePath ?? ""}
                                        onChange={onQdrantLocalStoragePathChange}
                                        data-testid={`rag-vector-db-local-storage-path-${id}`}
                                        aria-label="Qdrant local storage path"
                                    />
                                </>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Chroma-specific Settings */}
            {isChroma && (
                <>
                    <InfoCheckbox
                        label="Use Persistent Storage "
                        info="Use persistent storage for the vector db (i.e., whether to store data after closing the session). Default is False."
                        checked={usesLocalStorage}
                        id={`rag-vector-db-use-local-storage-${id}`}
                        onChange={onChromaUseLocalStorageChange}
                        aria-label="Use persistent storage for Chroma"
                    />

                    {usesLocalStorage && (
                        <>
                            <label htmlFor={`rag-vector-db-chroma-local-storage-path-${id}`}>
                                Storage Path:
                            </label>
                            <input
                                id={`rag-vector-db-chroma-local-storage-path-${id}`}
                                title="Storage path"
                                type="text"
                                value={retrieveConfig.dbConfig.localStoragePath ?? ""}
                                onChange={onChromaLocalStoragePathChange}
                                data-testid={`rag-vector-db-local-storage-path-${id}`}
                                aria-label="Chroma storage path"
                            />
                        </>
                    )}
                </>
            )}

            {/* Connection URL (for non-Qdrant or Qdrant with remote connection) */}
            {showConnectionUrl && (
                <div className="flex-column">
                    <InfoLabel
                        htmlFor={`rag-vector-db-connection-url-${id}`}
                        label="Connection URL:"
                        info={
                            "The connection URL for the vector db. " +
                            "If using chroma and not provided, a new " +
                            "chroma db server will be spawned. " +
                            "For pgvector and mongodb, this is required."
                        }
                    />

                    <input
                        type="text"
                        title="Connection URL"
                        value={retrieveConfig.dbConfig.connectionUrl ?? ""}
                        onChange={onDbConfigConnectionUrlChange}
                        data-testid={`rag-vector-db-connection-url-${id}`}
                        id={`rag-vector-db-connection-url-${id}`}
                        aria-label="Vector DB connection URL"
                    />
                </div>
            )}
        </div>
    );
});

WaldiezAgentRagUserVectorDb.displayName = "WaldiezAgentRagUserVectorDb";
