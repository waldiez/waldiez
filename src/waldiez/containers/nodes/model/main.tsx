/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { NodeProps } from "@xyflow/react";

import type { FC } from "react";
import { FaCopy, FaGear, FaTrashCan } from "react-icons/fa6";
import { TbSettingsCheck } from "react-icons/tb";

import { getImportExportView } from "@waldiez/containers/nodes/common";
import { useWaldiezNodeModel } from "@waldiez/containers/nodes/model/hooks";
import { WaldiezNodeModelModal } from "@waldiez/containers/nodes/model/modal";
import type { WaldiezNodeModel } from "@waldiez/models";

export const WaldiezNodeModelView: FC<NodeProps<WaldiezNodeModel>> = ({ id, data }) => {
    const {
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
    } = useWaldiezNodeModel(id, data);
    const importExportView = getImportExportView(flowId, id, "model", onImport, onExport);
    return (
        <div className={isOpen ? "model-node nodrag nowheel" : "model-node nodrag"}>
            <div className="model-header">
                <div
                    role="button"
                    title="Edit"
                    className="clickable"
                    data-node-id={id}
                    data-testid={`open-model-node-modal-${id}`}
                    onClick={onOpen}
                >
                    <FaGear />
                </div>
                <div id={`node-label-${id}`} className="node-label" data-testid={`node-label-${id}`}>
                    {data.label}
                </div>
                <div className={`model-logo ${data.apiType}`}>
                    <img src={logo} alt="logo" />
                </div>
            </div>
            <div className="model-footer" data-testid={`model-footer-${id}`}>
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
                <div className="flex-align-center">
                    <div
                        role="button"
                        title="Check"
                        className="clickable margin-right-10"
                        id={`test-model-${id}`}
                        data-testid={`test-model-${id}`}
                        onClick={onCheck}
                    >
                        <TbSettingsCheck fontSize="1.1em" />
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
            </div>
            <WaldiezNodeModelModal
                flowId={flowId}
                modelId={id}
                data={modelData}
                isOpen={isOpen}
                isDirty={isDirty}
                importExportView={importExportView}
                onLogoChange={setLogo}
                onDataChange={onDataChange}
                onClose={onCancel}
                onCancel={onCancel}
                onSave={onSave}
                onTest={onCheck}
                onSaveAndClose={onSaveAndClose}
            />
        </div>
    );
};
