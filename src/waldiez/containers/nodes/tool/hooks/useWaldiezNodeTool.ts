/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import isEqual from "react-fast-compare";

import { getToolIcon } from "@waldiez/containers/nodes/tool/utils";
import { WaldiezNodeToolData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { exportItem, getDateString, importItem } from "@waldiez/utils";

/**
 * Custom hook for managing tool node state and operations
 */
export const useWaldiezNodeTool = (id: string, data: WaldiezNodeToolData) => {
    // Get global state from store
    const flowId = useWaldiez(state => state.flowId);
    const updateToolData = useWaldiez(state => state.updateToolData);
    const cloneTool = useWaldiez(s => s.cloneTool);
    const deleteTool = useWaldiez(s => s.deleteTool);
    const getToolById = useWaldiez(s => s.getToolById);
    const importTool = useWaldiez(s => s.importTool);
    const exportTool = useWaldiez(s => s.exportTool);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const { isDark } = useWaldiezTheme();

    // Local state
    const [isModalOpen, setModalOpen] = useState(false);
    const [toolData, setToolData] = useState<WaldiezNodeToolData>(data);
    const [isDirty, setIsDirty] = useState(false);

    // Format last updated date
    const updatedAt = useMemo(() => getDateString(data.updatedAt), [data.updatedAt]);

    const logo = useMemo(() => getToolIcon(data.label, data.toolType, 18), [data.label, data.toolType]);

    // Update local tool data when external data changes
    useEffect(() => {
        setToolData(data);
        setIsDirty(false);
    }, [data]);

    /**
     * Open the modal dialog
     */
    const onOpen = useCallback(() => {
        setModalOpen(true);
        setIsDirty(false);
    }, []);

    /**
     * Clone the current tool
     */
    const onClone = useCallback(() => {
        if (isModalOpen) {
            return;
        }

        cloneTool(id);
        onFlowChanged();
    }, [isModalOpen, cloneTool, id, onFlowChanged]);

    /**
     * Delete the current tool
     */
    const onDelete = useCallback(() => {
        deleteTool(id);
        setIsDirty(false);
        onFlowChanged();
    }, [deleteTool, id, onFlowChanged]);

    /**
     * Cancel changes and close modal
     */
    const onCancel = useCallback(() => {
        setToolData(data);
        setModalOpen(false);
        setIsDirty(false);
    }, [data]);

    /**
     * Update tool data and check if it's different from original
     */
    const onChange = useCallback(
        (partialData: Partial<WaldiezNodeToolData>) => {
            setToolData(prevData => {
                const newData = { ...prevData, ...partialData };
                setIsDirty(!isEqual(newData, data));
                return newData;
            });
        },
        [data],
    );

    /**
     * Export the tool to a file
     */
    const onExport = useCallback(async () => {
        await exportItem(data.label, "tool", () => exportTool(id, true));
    }, [data.label, exportTool, id]);

    /**
     * Process imported tool data
     */
    const onImportLoad = useCallback(
        (tool: Node, jsonData: { [key: string]: unknown }) => {
            const newTool = importTool(jsonData, id, tool?.position, false);
            setToolData(newTool.data);
            setIsDirty(!isEqual(data, newTool.data));
        },
        [importTool, id, data],
    );

    /**
     * Handle file import
     */
    const onImport = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const getToolByIdBound = (toolId: string) => getToolById(toolId);
            importItem(event, getToolByIdBound.bind(null, id), onImportLoad);
        },
        [getToolById, id, onImportLoad],
    );

    /**
     * Save changes without closing the modal
     */
    const onSave = useCallback(() => {
        updateToolData(id, toolData);

        // Refresh local state with the stored data
        const storedTool = getToolById(id);
        if (storedTool?.data) {
            setToolData(storedTool.data as WaldiezNodeToolData);
        }

        setIsDirty(false);
        onFlowChanged();
        // Keep modal open after save
    }, [updateToolData, id, toolData, getToolById, onFlowChanged]);

    /**
     * Save changes and close the modal
     */
    const onSaveAndClose = useCallback(() => {
        onSave();
        setModalOpen(false);
    }, [onSave]);

    return {
        flowId,
        isModalOpen,
        isDirty,
        logo,
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
