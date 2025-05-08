/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useState } from "react";
import isEqual from "react-fast-compare";

import { validateModel } from "@waldiez/containers/nodes/model/utils";
import { WaldiezNodeModelData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { LOGOS } from "@waldiez/theme";
import { exportItem, importItem, showSnackbar } from "@waldiez/utils";

export const useWaldiezNodeModel = (id: string, data: WaldiezNodeModelData) => {
    const getModelById = useWaldiez(s => s.getModelById);
    const updateModelData = useWaldiez(state => state.updateModelData);
    const cloneModel = useWaldiez(s => s.cloneModel);
    const deleteModel = useWaldiez(s => s.deleteModel);
    const importModel = useWaldiez(s => s.importModel);
    const exportModel = useWaldiez(s => s.exportModel);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const flowId = useWaldiez(state => state.flowId);
    const [logo, setLogo] = useState<string>(LOGOS[data.apiType] as string);
    const [isOpen, setIsOpen] = useState(false);
    const [modelData, setModelData] = useState<WaldiezNodeModelData>(data);
    const [isDirty, setIsDirty] = useState(false);
    const onOpen = () => {
        setIsOpen(true);
        setIsDirty(false);
    };
    const onDelete = () => {
        deleteModel(id);
        setIsDirty(false);
        onFlowChanged();
    };
    const onClone = () => {
        cloneModel(id);
        setIsDirty(false);
        onFlowChanged();
    };
    const onImportLoad = (model: Node, jsonData: { [key: string]: unknown }) => {
        const nodeModel = importModel(jsonData, id, model?.position, false);
        setModelData({ ...nodeModel.data });
        setIsDirty(!isEqual(data, nodeModel.data));
    };
    const onImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        importItem(event, getModelById.bind(null, id), onImportLoad);
    };
    const onExport = async () => {
        await exportItem(data.label, "model", exportModel.bind(null, id, true));
    };
    const onDataChange = (partialData: Partial<WaldiezNodeModelData>) => {
        setModelData({ ...modelData, ...partialData });
        setIsDirty(!isEqual({ ...modelData, ...partialData }, data));
    };
    const onCancel = () => {
        setLogo(LOGOS[data.apiType]);
        setModelData(data);
        setIsDirty(false);
        setIsOpen(false);
    };
    const onCheck = () => {
        validateModel(modelData)
            .then(result => {
                if (result.success) {
                    // console.log("Model is valid");
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
                // console.error("Error validating model:", error);
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
    };
    const onSave = () => {
        setLogo(LOGOS[modelData.apiType]);
        updateModelData(id, modelData);
        const storedModel = getModelById(id);
        const storedData = storedModel?.data;
        if (storedData) {
            setModelData(storedData as WaldiezNodeModelData);
        }
        setIsDirty(false);
        onFlowChanged();
    };
    const onSaveAndClose = () => {
        onSave();
        setIsOpen(false);
    };
    return {
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
    };
};
