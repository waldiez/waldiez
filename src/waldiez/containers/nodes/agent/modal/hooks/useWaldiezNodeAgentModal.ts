/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useEffect, useState } from "react";
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

export const useWaldiezNodeAgentModal = (
    id: string,
    isOpen: boolean,
    data: WaldiezNodeAgentData,
    onClose: () => void,
) => {
    const flowId = useWaldiez(s => s.flowId);
    const getAgentById = useWaldiez(s => s.getAgentById);
    const updateAgentData = useWaldiez(s => s.updateAgentData);
    const updateEdgeData = useWaldiez(s => s.updateEdgeData);
    const exportAgent = useWaldiez(s => s.exportAgent);
    const importAgent = useWaldiez(s => s.importAgent);
    const getAgentConnections = useWaldiez(s => s.getAgentConnections);
    const updateEdgePath = useWaldiez(s => s.updateEdgePath);
    const uploadHandler = useWaldiez(s => s.onUpload);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const [agentData, setAgentData] = useState<WaldiezNodeAgentData>({
        ...data,
    });
    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const { isDark } = useWaldiezTheme();
    const [isDirty, setIsDirty] = useState(false);
    const updateDescriptionTextArea = (value: string) => {
        const agentDescriptionElement = document.getElementById(`flow-${flowId}-agent-description-${id}`);
        if (agentDescriptionElement) {
            (agentDescriptionElement as HTMLTextAreaElement).value = value;
        }
    };
    useEffect(() => {
        setIsDirty(false);
        setFilesToUpload([]);
    }, [isOpen]);
    const postSubmit = () => {
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
        // setNodeModalOpen(false);
    };
    const submit = (dataToSubmit: { [key: string]: any }) => {
        if (dataToSubmit.agentType !== data.agentType) {
            dataToSubmit = handleAgentTypeChange(dataToSubmit);
        }
        updateAgentData(id, dataToSubmit);
        if (data.label !== dataToSubmit.label) {
            updateAgentEdgeLabels();
        }
        setFilesToUpload([]);
        postSubmit();
    };
    const updateAgentEdgeLabels = () => {
        // naming: "source" => "target"
        // depending on the 'agentConnections', update the edge labels
        const agentConnections = getAgentConnections(id, {
            sourcesOnly: false,
            targetsOnly: false,
        });
        const sourceEdges = agentConnections.sources.edges;
        const targetEdges = agentConnections.targets.edges;
        const newLabel = agentData.label;
        const oldLabel = data.label;
        sourceEdges.forEach(sourceEdge => {
            const toSearch = ` => ${oldLabel}`;
            const toReplace = ` => ${newLabel}`;
            const labelIndex = sourceEdge.data?.label.indexOf(toSearch);
            if (typeof labelIndex === "number" && labelIndex > -1) {
                const label = sourceEdge.data?.label.replace(toSearch, toReplace);
                updateEdgeData(sourceEdge.id, { ...sourceEdge.data, label });
            }
        });
        targetEdges.forEach(targetEdge => {
            const toSearch = `${oldLabel} => `;
            const toReplace = `${newLabel} => `;
            const labelIndex = targetEdge.data?.label.indexOf(toSearch);
            if (typeof labelIndex === "number" && labelIndex > -1) {
                const label = targetEdge.data?.label.replace(toSearch, toReplace);
                updateEdgeData(targetEdge.id, { ...targetEdge.data, label });
            }
        });
    };
    const submitRagUser = (dataToSubmit: { [key: string]: any }) => {
        if (filesToUpload.length > 0 && uploadHandler) {
            uploadHandler(filesToUpload)
                .then(filePaths => {
                    const ragData = agentData as WaldiezNodeAgentRagUserData;
                    const docsPath = ragData.retrieveConfig.docsPath;
                    const newDocsPath = [...docsPath];
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
                    const docsPath = dataToSubmit.retrieveConfig.docsPath;
                    dataToSubmit.retrieveConfig.docsPath = [...docsPath].filter(
                        (entry: any) =>
                            typeof entry === "string" && entry.length > 0 && !entry.startsWith("file:///"),
                    );
                    setFilesToUpload([]);
                    submit(dataToSubmit);
                });
        } else {
            // make sure no nulls in docsPath
            const ragData = agentData as WaldiezNodeAgentRagUserData;
            const docsPath = ragData.retrieveConfig.docsPath;
            dataToSubmit.retrieveConfig.docsPath = docsPath.filter(
                entry => typeof entry === "string" && entry.length > 0 && !entry.startsWith("file:///"),
            );
            setFilesToUpload([]);
            submit(dataToSubmit);
        }
    };
    const onSave = () => {
        const dataToSubmit = { ...agentData } as { [key: string]: any };
        if (agentData.agentType === "rag_user_proxy") {
            submitRagUser(dataToSubmit);
        } else {
            submit(dataToSubmit);
        }
    };
    const updateAgentConnections = (newAgentType: WaldiezNodeAgentType) => {
        const agentConnections = getAgentConnections(id, {
            targetsOnly: true,
        });
        agentConnections.targets.edges.forEach(edge => {
            updateEdgePath(edge.id, newAgentType);
        });
    };
    const handleAgentTypeChange = (dataToSubmit: { [key: string]: any }) => {
        const newAgentType = dataToSubmit.agentType as WaldiezNodeAgentType;
        updateAgentConnections(newAgentType);
        if (newAgentType === "rag_user_proxy" && !dataToSubmit.retrieveConfig) {
            dataToSubmit.retrieveConfig = defaultRetrieveConfig;
        } else if (newAgentType === "user_proxy" && dataToSubmit.retrieveConfig) {
            delete dataToSubmit.retrieveConfig;
        }
        return dataToSubmit;
    };
    const onImportLoad = (agent: Node, jsonData: { [key: string]: unknown }) => {
        const newAgent = importAgent(jsonData, id, true, agent?.position, false);
        onDataChange({ ...newAgent.data });
    };
    const onImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        importItem(event, getAgentById.bind(null, id), onImportLoad);
    };
    const onExport = async () => {
        await exportItem(agentData.label, "agent", exportAgent.bind(null, id, true));
    };
    const onCancel = () => {
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
    };
    const onDataChange = (partialData: Partial<WaldiezNodeAgentData>) => {
        const dirty = !isEqual({ ...agentData, ...partialData }, data);
        setTimeout(() => {
            setAgentData({ ...agentData, ...partialData });
        }, 10);
        setIsDirty(dirty);
    };
    const toRagUser = () => {
        // make sure data.retrieveConfig (WaldiezRageUserRetrieveConfig) is set
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
    };
    const toUser = () => {
        // remove retrieveConfig if it exists
        const noRagData = agentData as { [key: string]: any };
        noRagData.agentType = "user_proxy";
        if (noRagData.retrieveConfig) {
            delete noRagData.retrieveConfig;
        }
        setAgentData({
            ...agentData,
            ...noRagData,
        });
    };

    const onAgentTypeChange = (agentType: WaldiezNodeAgentType) => {
        // rag_user_proxy | user_proxy only
        if (agentType === "rag_user_proxy") {
            toRagUser();
        } else {
            toUser();
        }
        setIsDirty(data.agentType !== agentType);
    };
    const onFilesToUploadChange = (files: File[]) => {
        const dirty = !isEqual(files, filesToUpload);
        setFilesToUpload(files);
        setIsDirty(dirty);
    };
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
        onCancel,
    };
};
