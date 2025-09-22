/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { type NodeProps } from "@xyflow/react";

import { type FC } from "react";
import { FaCopy, FaGear, FaTrashCan } from "react-icons/fa6";

import { useWaldiezNodeTool } from "@waldiez/containers/nodes/tool/hooks";
import { WaldiezNodeToolModal } from "@waldiez/containers/nodes/tool/modal";
import { type WaldiezNodeTool } from "@waldiez/models";

export const WaldiezNodeToolView: FC<NodeProps<WaldiezNodeTool>> = props => {
    const { id } = props;
    const {
        flowId,
        isModalOpen,
        isDirty,
        toolData: data,
        isDark,
        logo,
        onOpen,
        onClone,
        onDelete,
        onCancel,
        onSave,
        onSaveAndClose,
        onChange,
        onExport,
        onImport,
    } = useWaldiezNodeTool(props.id, props.data);
    return (
        <div className={isModalOpen ? "tool-node nodrag nowheel" : "tool-node nodrag"}>
            <div className="tool-header">
                <div
                    role="button"
                    title="Edit"
                    className="clickable"
                    // id={`open-tool-node-modal-${id}`}
                    data-node-id={id}
                    data-testid={`open-tool-node-modal-${id}`}
                    onClick={onOpen}
                >
                    <FaGear />
                </div>
                <div data-testid={`node-label-${id}`} className="node-label">
                    {data.label}
                </div>
                <div className={`tool-logo ${data.toolType}`}>{logo}</div>
            </div>
            <div className="tool-content">
                <div className="description" data-test-id={`node-description-${id}`}>
                    {data.description}
                </div>
            </div>
            <div className="tool-footer" data-testid={`tool-footer-${id}`}>
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
            <WaldiezNodeToolModal
                toolId={id}
                flowId={flowId}
                data={data}
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
