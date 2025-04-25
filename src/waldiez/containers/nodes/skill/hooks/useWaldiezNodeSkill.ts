/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { useState } from "react";
import isEqual from "react-fast-compare";

import { WaldiezNodeSkillData } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { useWaldiezTheme } from "@waldiez/theme";
import { exportItem, getDateString, importItem } from "@waldiez/utils";

export const useWaldiezNodeSkill = (id: string, data: WaldiezNodeSkillData) => {
    const flowId = useWaldiez(state => state.flowId);
    const [isModalOpen, setModalOpen] = useState(false);
    // tmp state to save on submit, discard on cancel
    const [skillData, setSkillData] = useState<WaldiezNodeSkillData>(data);
    const [isDirty, setIsDirty] = useState(false);
    const updateSkillData = useWaldiez(state => state.updateSkillData);
    const cloneSkill = useWaldiez(s => s.cloneSkill);
    const deleteSkill = useWaldiez(s => s.deleteSkill);
    const getSkillById = useWaldiez(s => s.getSkillById);
    const importSkill = useWaldiez(s => s.importSkill);
    const exportSkill = useWaldiez(s => s.exportSkill);
    const onFlowChanged = useWaldiez(s => s.onFlowChanged);
    const { isDark } = useWaldiezTheme();
    const updatedAt = getDateString(data.updatedAt);
    const onOpen = () => {
        setModalOpen(true);
        setIsDirty(false);
    };
    const onClone = () => {
        if (!isModalOpen) {
            cloneSkill(id);
            onFlowChanged();
        }
    };
    const onDelete = () => {
        deleteSkill(id);
        setIsDirty(false);
        onFlowChanged();
    };
    const onCancel = () => {
        setSkillData(data);
        setModalOpen(false);
        setIsDirty(false);
    };
    const onChange = (partialData: Partial<WaldiezNodeSkillData>) => {
        setSkillData({ ...skillData, ...partialData });
        setIsDirty(!isEqual({ ...skillData, ...partialData }, data));
    };
    const onExport = async () => {
        await exportItem(data.label, "skill", exportSkill.bind(null, id, true));
    };
    const onImportLoad = (skill: Node, jsonData: { [key: string]: unknown }) => {
        const newSkill = importSkill(jsonData, id, skill?.position, false);
        setSkillData({ ...newSkill.data });
        setIsDirty(!isEqual(data, newSkill.data));
    };
    const onImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        importItem(event, getSkillById.bind(null, id), onImportLoad);
    };
    const onSave = () => {
        updateSkillData(id, skillData);
        const storedSkill = getSkillById(id);
        const storedData = storedSkill?.data;
        if (storedData) {
            setSkillData(storedData as WaldiezNodeSkillData);
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
        skillData,
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
