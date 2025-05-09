/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useState } from "react";
import isEqual from "react-fast-compare";

import { WaldiezNodeToolData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { exportItem, getDateString, importItem } from "@waldiez/utils";

export const useWaldiezNodeTool = (id: string, data: WaldiezNodeToolData) => {
    const flowId = useWaldiez(state => state.flowId);
    const [isModalOpen, setModalOpen] = useState(false);
    // tmp state to save on submit, discard on cancel
    const [toolData, setToolData] = useState<WaldiezNodeToolData>(data);
    const [isDirty, setIsDirty] = useState(false);
    const updateToolData = useWaldiez(state => state.updateToolData);
    const cloneTool = useWaldiez(s => s.cloneTool);
    const deleteTool = useWaldiez(s => s.deleteTool);
    const getToolById = useWaldiez(s => s.getToolById);
    const importTool = useWaldiez(s => s.importTool);
    const exportTool = useWaldiez(s => s.exportTool);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const { isDark } = useWaldiezTheme();
    const updatedAt = getDateString(data.updatedAt);
    const onOpen = () => {
        setModalOpen(true);
        setIsDirty(false);
    };
    const onClone = () => {
        if (!isModalOpen) {
            cloneTool(id);
            onFlowChanged();
        }
    };
    const onDelete = () => {
        deleteTool(id);
        setIsDirty(false);
        onFlowChanged();
    };
    const onCancel = () => {
        setToolData(data);
        setModalOpen(false);
        setIsDirty(false);
    };
    const onChange = (partialData: Partial<WaldiezNodeToolData>) => {
        setToolData({ ...toolData, ...partialData });
        setIsDirty(!isEqual({ ...toolData, ...partialData }, data));
    };
    const onExport = async () => {
        await exportItem(data.label, "tool", exportTool.bind(null, id, true));
    };
    const onImportLoad = (tool: Node, jsonData: { [key: string]: unknown }) => {
        const newTool = importTool(jsonData, id, tool?.position, false);
        setToolData({ ...newTool.data });
        setIsDirty(!isEqual(data, newTool.data));
    };
    const onImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        importItem(event, getToolById.bind(null, id), onImportLoad);
    };
    const onSave = () => {
        updateToolData(id, toolData);
        const storedTool = getToolById(id);
        const storedData = storedTool?.data;
        if (storedData) {
            setToolData(storedData as WaldiezNodeToolData);
        }
        setIsDirty(false);
        onFlowChanged();
        // setModalOpen(false);
        // keep modal open after save
    };
    const onSaveAndClose = () => {
        onSave();
        setModalOpen(false);
    };
    return {
        flowId,
        isModalOpen,
        isDirty,
        toolData,
        isDark,
        updatedAt,
        onOpen,
        onClone,
        onDelete,
        onCancel,
        onSave,
        onSaveAndClose,
        onChange,
        onExport,
        onImport,
    };
};
