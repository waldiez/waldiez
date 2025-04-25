/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { NodeProps } from "@xyflow/react";

import { FaCopy, FaGear, FaTrashCan } from "react-icons/fa6";

import { useWaldiezNodeSkill } from "@waldiez/containers/nodes/skill/hooks";
import { WaldiezNodeSkillModal } from "@waldiez/containers/nodes/skill/modal";
import { WaldiezNodeSkill } from "@waldiez/models";

export const WaldiezNodeSkillView = ({ id, data }: NodeProps<WaldiezNodeSkill>) => {
    const {
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
    } = useWaldiezNodeSkill(id, data);
    return (
        <div className={isModalOpen ? "skill-node nodrag nowheel" : "skill-node nodrag"}>
            <div className="skill-header">
                <div
                    role="button"
                    title="Edit"
                    className="clickable"
                    // id={`open-skill-node-modal-${id}`}
                    data-node-id={id}
                    data-testid={`open-skill-node-modal-${id}`}
                    onClick={onOpen}
                >
                    <FaGear />
                </div>
                <div id={`node-label-${id}`} data-testid={`node-label-${id}`} className="node-label">
                    {data.label}
                </div>
            </div>
            <div className="skill-content">
                <div className="description" data-test-id={`node-description-${id}`}>
                    {data.description}
                </div>
                <div className="date-info">{updatedAt}</div>
            </div>
            <div className="skill-footer" data-testid={`skill-footer-${id}`}>
                <div
                    role="button"
                    title="Delete"
                    className="clickable"
                    id={`delete-node-${id}`}
                    data-testid={`delete-node-${id}`}
                    onClick={onDelete}
                >
                    <FaTrashCan />
                </div>
                <div
                    role="button"
                    title="Clone"
                    className="clickable"
                    id={`clone-node-${id}`}
                    data-testid={`clone-node-${id}`}
                    onClick={onClone}
                >
                    <FaCopy />
                </div>
            </div>
            <WaldiezNodeSkillModal
                skillId={id}
                flowId={flowId}
                data={skillData}
                isModalOpen={isModalOpen}
                darkMode={isDark}
                isDirty={isDirty}
                onClose={onCancel}
                onCancel={onCancel}
                onSave={onSave}
                onSaveAndClose={onSaveAndClose}
                onDataChange={onChange}
                onImport={onImport}
                onExport={onExport}
            />
        </div>
    );
};
