/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Modal } from "@waldiez/components";
import { useWaldiezNodeAgentModal } from "@waldiez/containers/nodes/agent/modal/hooks";
import { WaldiezNodeAgentModalTabs } from "@waldiez/containers/nodes/agent/modal/tabs";
import { getImportExportView } from "@waldiez/containers/nodes/common";
import { WaldiezNodeAgentData } from "@waldiez/models";

type WaldiezNodeAgentModalProps = {
    id: string;
    data: WaldiezNodeAgentData;
    isOpen: boolean;
    onClose: () => void;
};

export const WaldiezNodeAgentModal = (props: WaldiezNodeAgentModalProps) => {
    const { id, data, isOpen, onClose } = props;
    const {
        flowId,
        isDirty,
        isDarkMode,
        agentData,
        filesToUpload,
        onDataChange,
        onAgentTypeChange,
        onFilesToUploadChange,
        onImport,
        onExport,
        onSave,
        onCancel,
    } = useWaldiezNodeAgentModal(id, isOpen, data, onClose);
    const onSaveAndClose = () => {
        onSave();
        onClose();
    };
    const importExportView =
        data.agentType !== "manager"
            ? getImportExportView(flowId, id, "agent", onImport, onExport)
            : undefined;
    return (
        <Modal
            title={agentData.label}
            isOpen={isOpen}
            onClose={onCancel}
            onSaveAndClose={onSaveAndClose}
            beforeTitle={importExportView}
            dataTestId={`wf-${flowId}-agent-modal-${id}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body">
                {data.agentType === "manager" ? (
                    <div>Group related settings</div>
                ) : (
                    <WaldiezNodeAgentModalTabs
                        id={id}
                        flowId={flowId}
                        data={agentData}
                        isDarkMode={isDarkMode}
                        onDataChange={onDataChange}
                        isModalOpen={isOpen}
                        onAgentTypeChange={onAgentTypeChange}
                        filesToUpload={filesToUpload}
                        onFilesToUploadChange={onFilesToUploadChange}
                    />
                )}
            </div>
            <div className="modal-actions">
                <button
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid={`cancel-agent-data-${id}`}
                    type="button"
                    title="Cancel"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    title={isDirty ? "Save" : "No changes to save"}
                    className="modal-action-submit"
                    onClick={onSave}
                    data-testid={`submit-agent-data-${id}`}
                    disabled={!isDirty}
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};
