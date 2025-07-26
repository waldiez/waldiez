/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import { showSnackbar } from "@waldiez/components/snackbar";
import { validateModel } from "@waldiez/containers/nodes/model/utils";
import { WaldiezNodeModelData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { LOGOS } from "@waldiez/theme";
import { exportItem, importItem } from "@waldiez/utils";

/**
 * Custom hook for managing model node state and operations
 */
export const useWaldiezNodeModel = (id: string, data: WaldiezNodeModelData) => {
    // Get global state and actions from store
    const getModelById = useWaldiez(s => s.getModelById);
    const updateModelData = useWaldiez(state => state.updateModelData);
    const cloneModel = useWaldiez(s => s.cloneModel);
    const deleteModel = useWaldiez(s => s.deleteModel);
    const importModel = useWaldiez(s => s.importModel);
    const exportModel = useWaldiez(s => s.exportModel);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const flowId = useWaldiez(state => state.flowId);

    // Local state
    const [logo, setLogo] = useState<string>(LOGOS[data.apiType] || "");
    const [isOpen, setIsOpen] = useState(false);
    const [modelData, setModelData] = useState<WaldiezNodeModelData>(data);
    const [isDirty, setIsDirty] = useState(false);

    // Update local state when external data changes
    useEffect(() => {
        setModelData(data);
        setLogo(LOGOS[data.apiType] || "");
        setIsDirty(false);
    }, [data]);

    /**
     * Open the model modal
     */
    const onOpen = useCallback(() => {
        setIsOpen(true);
        setIsDirty(false);
    }, []);

    /**
     * Delete the model
     */
    const onDelete = useCallback(() => {
        deleteModel(id);
        setIsDirty(false);
        onFlowChanged();
    }, [deleteModel, id, onFlowChanged]);

    /**
     * Clone the model
     */
    const onClone = useCallback(() => {
        cloneModel(id);
        setIsDirty(false);
        onFlowChanged();
    }, [cloneModel, id, onFlowChanged]);

    /**
     * Process imported model data
     */
    const onImportLoad = useCallback(
        (model: Node, jsonData: { [key: string]: unknown }) => {
            const nodeModel = importModel(jsonData, id, model?.position, false);
            setModelData(nodeModel.data);
            setIsDirty(!isEqual(data, nodeModel.data));
        },
        [importModel, id, data],
    );

    /**
     * Handle file import
     */
    const onImport = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const getModelByIdBound = (modelId: string) => getModelById(modelId);
            importItem(event, getModelByIdBound.bind(null, id), onImportLoad);
        },
        [getModelById, id, onImportLoad],
    );

    /**
     * Export the model to a file
     */
    const onExport = useCallback(async () => {
        await exportItem(data.label, "model", () => exportModel(id, true));
    }, [data.label, exportModel, id]);

    /**
     * Update model data
     */
    const onDataChange = useCallback(
        (partialData: Partial<WaldiezNodeModelData>) => {
            setModelData(prevData => {
                const newData = { ...prevData, ...partialData };
                setIsDirty(!isEqual(newData, data));
                return newData;
            });
        },
        [data],
    );

    /**
     * Cancel changes and close modal
     */
    const onCancel = useCallback(() => {
        setLogo(LOGOS[data.apiType] || "");
        setModelData(data);
        setIsDirty(false);
        setIsOpen(false);
    }, [data]);

    /**
     * Validate the model configuration
     */
    const onCheck = useCallback(() => {
        validateModel(modelData)
            .then(result => {
                if (result.success) {
                    showSnackbar({
                        flowId,
                        message: result.message,
                        level: "success",
                        details: null,
                        duration: 3000,
                        withCloseButton: false,
                    });
                } else {
                    showSnackbar({
                        flowId,
                        message: result.message,
                        level: "error",
                        details: result.details,
                        duration: undefined,
                        withCloseButton: true,
                    });
                }
            })
            .catch(error => {
                const details = error instanceof Error ? error.message : String(error);
                showSnackbar({
                    flowId,
                    message: "Error validating model",
                    level: "error",
                    details,
                    duration: undefined,
                    withCloseButton: true,
                });
            });
    }, [modelData, flowId]);

    /**
     * Save changes without closing
     */
    const onSave = useCallback(() => {
        const newLogo = LOGOS[modelData.apiType] || "";
        setLogo(newLogo);
        updateModelData(id, modelData);

        // Refresh with stored data
        const storedModel = getModelById(id);
        if (storedModel?.data) {
            setModelData(storedModel.data as WaldiezNodeModelData);
        }

        setIsDirty(false);
        onFlowChanged();
    }, [modelData, updateModelData, id, getModelById, onFlowChanged]);

    /**
     * Save changes and close modal
     */
    const onSaveAndClose = useCallback(() => {
        onSave();
        setIsOpen(false);
    }, [onSave]);

    // Return memoized API
    return useMemo(
        () => ({
            flowId,
            isOpen,
            isDirty,
            logo,
            modelData,
            setLogo,
            onOpen,
            onImport,
            onExport,
            onDataChange,
            onDelete,
            onClone,
            onSave,
            onSaveAndClose,
            onCancel,
            onCheck,
        }),
        [
            flowId,
            isOpen,
            isDirty,
            logo,
            modelData,
            setLogo,
            onOpen,
            onImport,
            onExport,
            onDataChange,
            onDelete,
            onClone,
            onSave,
            onSaveAndClose,
            onCancel,
            onCheck,
        ],
    );
};
