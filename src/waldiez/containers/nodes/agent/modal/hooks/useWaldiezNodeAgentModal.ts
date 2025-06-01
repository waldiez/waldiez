/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useCallback, useEffect, useState } from "react";
import isEqual from "react-fast-compare";

import {
    WaldiezNodeAgentData,
    WaldiezNodeAgentRagUserData,
    WaldiezNodeAgentType,
    defaultRetrieveConfig,
} from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { exportItem, importItem } from "@waldiez/utils";

/**
 * Custom hook for managing Waldiez Node Agent Modal functionality
 * Handles agent data updates, imports/exports, and file uploads
 */
export const useWaldiezNodeAgentModal = (
    id: string,
    isOpen: boolean,
    data: WaldiezNodeAgentData,
    onClose: () => void,
) => {
    // Store selectors
    const flowId = useWaldiez(s => s.flowId);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);
    const exportAgent = useWaldiez(s => s.exportAgent);
    const importAgent = useWaldiez(s => s.importAgent);
    const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const removeGroupMember = useWaldiez(s => s.removeGroupMember);
    const addGroupMember = useWaldiez(s => s.addGroupMember);
    const updateEdgePath = useWaldiez(s => s.updateEdgePath);
    const uploadHandler = useWaldiez(s => s.onUpload);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    // Local state
    const [agentData, setAgentData] = useState<WaldiezNodeAgentData>({ ...data });
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [isDirty, setIsDirty] = useState(false);

    // Theme state
    const { isDark } = useWaldiezTheme();

    /**
     * Reset state when modal is opened/closed
     */
    useEffect(() => {
        setIsDirty(false);
        setFilesToUpload([]);
    }, [isOpen]);

    /**
     * Updates the description textarea in the DOM
     */
    const updateDescriptionTextArea = useCallback(
        (value: string) => {
            const agentDescriptionElement = document.getElementById(`flow-${flowId}-agent-description-${id}`);
            if (agentDescriptionElement) {
                (agentDescriptionElement as HTMLTextAreaElement).value = value;
            }
        },
        [flowId, id],
    );

    /**
     * Post-submission cleanup and synchronization
     */
    const postSubmit = useCallback(() => {
        const storedAgent = getAgentById(id);
        if (!storedAgent) {
            updateDescriptionTextArea(agentData.description);
            setIsDirty(false);
            return;
        }

        if (storedAgent.data) {
            setAgentData({ ...(storedAgent.data as WaldiezNodeAgentData) });
            setIsDirty(false);
        }

        updateDescriptionTextArea(storedAgent.data.description);
        onFlowChanged();
        // Original commented code: setNodeModalOpen(false);
    }, [id, agentData.description, getAgentById, updateDescriptionTextArea, onFlowChanged]);

    /**
     * Updates labels in connected edges when agent label changes
     */
    const updateAgentEdgeLabels = useCallback(() => {
        // Get all connections for this agent
        const agentConnections = getAgentConnections(id, {
            sourcesOnly: false,
            targetsOnly: false,
        });

        const sourceEdges = agentConnections.sources.edges;
        const targetEdges = agentConnections.targets.edges;
        const newLabel = agentData.label;
        const oldLabel = data.label;

        // Update source edge labels
        sourceEdges.forEach(sourceEdge => {
            const toSearch = ` => ${oldLabel}`;
            const toReplace = ` => ${newLabel}`;
            const labelIndex = sourceEdge.data?.label.indexOf(toSearch);

            if (typeof labelIndex === "number" && labelIndex > -1) {
                const label = sourceEdge.data?.label.replace(toSearch, toReplace);
                updateEdgeData(sourceEdge.id, { ...sourceEdge.data, label });
            }
        });

        // Update target edge labels
        targetEdges.forEach(targetEdge => {
            const toSearch = `${oldLabel} => `;
            const toReplace = `${newLabel} => `;
            const labelIndex = targetEdge.data?.label.indexOf(toSearch);

            if (typeof labelIndex === "number" && labelIndex > -1) {
                const label = targetEdge.data?.label.replace(toSearch, toReplace);
                updateEdgeData(targetEdge.id, { ...targetEdge.data, label });
            }
        });
    }, [id, agentData.label, data.label, getAgentConnections, updateEdgeData]);

    /**
     * Handle agent type changes and update connections accordingly
     */
    const updateAgentConnections = useCallback(
        (newAgentType: WaldiezNodeAgentType) => {
            const agentConnections = getAgentConnections(id, {
                targetsOnly: true,
            });

            agentConnections.targets.edges.forEach(edge => {
                updateEdgePath(edge.id, newAgentType);
            });
        },
        [id, getAgentConnections, updateEdgePath],
    );

    /**
     * Process agent type changes and update data accordingly
     */
    const handleAgentTypeChange = useCallback(
        (dataToSubmit: { [key: string]: any }) => {
            const newAgentType = dataToSubmit.agentType as WaldiezNodeAgentType;

            updateAgentConnections(newAgentType);

            // Add or remove retrieveConfig based on agent type
            if (newAgentType === "rag_user_proxy" && !dataToSubmit.retrieveConfig) {
                dataToSubmit.retrieveConfig = defaultRetrieveConfig;
            } else if (newAgentType === "user_proxy" && dataToSubmit.retrieveConfig) {
                delete dataToSubmit.retrieveConfig;
            }

            return dataToSubmit;
        },
        [updateAgentConnections],
    );

    const checkGroupChange = useCallback(
        (dataToSubmit: { [key: string]: any }) => {
            const currentParentId = data.parentId;
            const newParentId = dataToSubmit.parentId;
            if (currentParentId !== newParentId) {
                if (currentParentId) {
                    removeGroupMember(currentParentId, id);
                }
                if (newParentId) {
                    addGroupMember(newParentId, id);
                }
            }
        },
        [data.parentId, id, removeGroupMember, addGroupMember],
    );

    /**
     * Submit agent data updates to store
     */
    const submit = useCallback(
        (dataToSubmit: { [key: string]: any }) => {
            // Handle agent type change if needed
            if (dataToSubmit.agentType !== data.agentType) {
                dataToSubmit = handleAgentTypeChange(dataToSubmit);
            }

            // check if group membership has changed
            checkGroupChange(dataToSubmit);

            // Update agent data
            updateAgentData(id, dataToSubmit);

            // Update edge labels if label changed
            if (data.label !== dataToSubmit.label) {
                updateAgentEdgeLabels();
            }

            // Reset file upload state and complete submission
            setFilesToUpload([]);
            postSubmit();
        },
        [
            data,
            id,
            handleAgentTypeChange,
            checkGroupChange,
            updateAgentData,
            updateAgentEdgeLabels,
            postSubmit,
        ],
    );

    /**
     * Special submission handling for RAG user agents with file uploads
     */
    const submitRagUser = useCallback(
        (dataToSubmit: { [key: string]: any }) => {
            // Handle file uploads if present
            if (filesToUpload.length > 0 && uploadHandler) {
                uploadHandler(filesToUpload)
                    .then(filePaths => {
                        const ragData = agentData as WaldiezNodeAgentRagUserData;
                        const docsPath = ragData.retrieveConfig.docsPath;
                        const newDocsPath = [...docsPath];

                        // Update file paths with uploaded ones
                        for (let i = 0; i < filesToUpload.length; i++) {
                            const index = newDocsPath.indexOf(`file:///${filesToUpload[i].name}`);
                            if (index > -1) {
                                if (typeof filePaths[i] === "string") {
                                    newDocsPath[index] = filePaths[i];
                                } else {
                                    newDocsPath.splice(index, 1);
                                }
                            }
                        }

                        dataToSubmit.retrieveConfig.docsPath = newDocsPath;
                    })
                    .catch(error => {
                        console.error(error);
                    })
                    .finally(() => {
                        // Filter out invalid paths and temporary file:/// URLs
                        const docsPath = dataToSubmit.retrieveConfig.docsPath;
                        dataToSubmit.retrieveConfig.docsPath = [...docsPath].filter(
                            (entry: any) =>
                                typeof entry === "string" &&
                                entry.length > 0 &&
                                !entry.startsWith("file:///"),
                        );

                        setFilesToUpload([]);
                        submit(dataToSubmit);
                    });
            } else {
                // Handle submission without file uploads
                const ragData = agentData as WaldiezNodeAgentRagUserData;
                const docsPath = ragData.retrieveConfig.docsPath;

                // Filter out invalid paths
                dataToSubmit.retrieveConfig.docsPath = docsPath.filter(
                    entry => typeof entry === "string" && entry.length > 0 && !entry.startsWith("file:///"),
                );

                setFilesToUpload([]);
                submit(dataToSubmit);
            }
        },
        [agentData, filesToUpload, uploadHandler, submit],
    );

    /**
     * Convert agent to RAG user type
     */
    const toRagUser = useCallback(() => {
        // Ensure retrieveConfig is properly set
        const ragData = agentData as { [key: string]: any };
        ragData.agentType = "rag_user_proxy";

        if (!ragData.retrieveConfig) {
            ragData.retrieveConfig = defaultRetrieveConfig;
        }

        ragData.retrieveConfig.docsPath = [];

        setAgentData({
            ...agentData,
            ...ragData,
        });
    }, [agentData]);

    /**
     * Convert agent to standard user type
     */
    const toUser = useCallback(() => {
        // Remove retrieveConfig if it exists
        const noRagData = agentData as { [key: string]: any };
        noRagData.agentType = "user_proxy";

        if (noRagData.retrieveConfig) {
            delete noRagData.retrieveConfig;
        }

        setAgentData({
            ...agentData,
            ...noRagData,
        });
    }, [agentData]);

    /**
     * Event Handlers
     */

    /**
     * Handle save button click
     */
    const onSave = useCallback(() => {
        const dataToSubmit = { ...agentData } as { [key: string]: any };

        if (agentData.agentType === "rag_user_proxy") {
            submitRagUser(dataToSubmit);
        } else {
            submit(dataToSubmit);
        }
    }, [agentData, submitRagUser, submit]);

    /**
     * Handle save and close button click
     */
    const onSaveAndClose = useCallback(() => {
        onSave();
        onClose();
    }, [onSave, onClose]);

    /**
     * Handle data changes in the form
     */
    const onDataChange = useCallback(
        (partialData: Partial<WaldiezNodeAgentData>) => {
            const dirty = !isEqual({ ...agentData, ...partialData }, data);
            setAgentData(prevData => ({ ...prevData, ...partialData }));
            setIsDirty(dirty);
        },
        [agentData, data],
    );

    /**
     * Handle import loading
     */
    const onImportLoad = useCallback(
        (agent: Node, jsonData: { [key: string]: unknown }) => {
            const newAgent = importAgent(jsonData, id, true, agent?.position, false);
            onDataChange({ ...newAgent.data });
        },
        [id, importAgent, onDataChange],
    );

    /**
     * Handle import button change
     */
    const onImport = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            importItem(event, getAgentById.bind(null, id), onImportLoad);
        },
        [id, getAgentById, onImportLoad],
    );

    /**
     * Handle export button click
     */
    const onExport = useCallback(async () => {
        await exportItem(agentData.label, "agent", exportAgent.bind(null, id, true));
    }, [agentData.label, id, exportAgent]);

    /**
     * Handle cancel button click
     */
    const onCancel = useCallback(() => {
        const storedAgent = getAgentById(id);

        if (!storedAgent) {
            setIsDirty(false);
            onClose();
            return;
        }

        if (storedAgent.data) {
            setAgentData({ ...(storedAgent.data as WaldiezNodeAgentData) });
        }

        setIsDirty(false);
        onClose();
    }, [id, getAgentById, onClose]);

    /**
     * Handle agent type changes
     */
    const onAgentTypeChange = useCallback(
        (agentType: WaldiezNodeAgentType) => {
            // Handle change between rag_user_proxy and user_proxy
            if (agentType === "rag_user_proxy") {
                toRagUser();
            } else {
                toUser();
            }

            setIsDirty(data.agentType !== agentType);
        },
        [data.agentType, toRagUser, toUser],
    );

    /**
     * Handle files to upload changes
     */
    const onFilesToUploadChange = useCallback(
        (files: File[]) => {
            const dirty = !isEqual(files, filesToUpload);
            setFilesToUpload(files);
            setIsDirty(dirty);
        },
        [filesToUpload],
    );

    return {
        flowId,
        filesToUpload,
        agentData,
        isDirty,
        isDarkMode: isDark,
        onDataChange,
        onAgentTypeChange,
        onFilesToUploadChange,
        onImport,
        onExport,
        onSave,
        onSaveAndClose,
        onCancel,
    };
};
