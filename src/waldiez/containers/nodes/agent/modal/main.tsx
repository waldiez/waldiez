/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useMemo } from "react";

import { Modal } from "@waldiez/components";
import { useWaldiezNodeAgentModal } from "@waldiez/containers/nodes/agent/modal/hooks";
import {
    WaldiezNodeAgentModalTabs,
    WaldiezNodeGroupManagerTabs,
} from "@waldiez/containers/nodes/agent/modal/tabs";
import { getImportExportView } from "@waldiez/containers/nodes/common";
import {
    WaldiezAgentGroupManagerData,
    WaldiezNodeAgentData,
    WaldiezNodeAgentGroupManagerData,
} from "@waldiez/models";

type WaldiezNodeAgentModalProps = {
    id: string;
    data: WaldiezNodeAgentData;
    isOpen: boolean;
    onClose: () => void;
};

/**
 * Modal component for editing Waldiez Node Agent properties
 * Handles different views based on agent type and manages save/cancel operations
 */
export const WaldiezNodeAgentModal = memo((props: WaldiezNodeAgentModalProps) => {
    const { id, data, isOpen, onClose } = props;

    // Use the modal hook for state and operations
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

    /**
     * Handle save and close button click
     */
    const onSaveAndClose = useCallback(() => {
        onSave();
        onClose();
    }, [onSave, onClose]);

    /**
     * Get the import/export view based on agent type
     */
    const importExportView = useMemo(
        () =>
            data.agentType !== "group_manager"
                ? getImportExportView(flowId, id, "agent", onImport, onExport)
                : undefined,
        [data.agentType, flowId, id, onImport, onExport],
    );

    /**
     * Determine modal title based on agent type
     */
    const modalTitle = useMemo(
        () =>
            data.agentType === "group_manager"
                ? (agentData as WaldiezAgentGroupManagerData).groupName
                : agentData.label,
        [data.agentType, agentData],
    );

    /**
     * Determine which tab component to render based on agent type
     */
    const tabComponent = useMemo(() => {
        if (data.agentType === "group_manager") {
            return (
                <WaldiezNodeGroupManagerTabs
                    isModalOpen={isOpen}
                    flowId={flowId}
                    id={id}
                    data={agentData as WaldiezNodeAgentGroupManagerData}
                    onDataChange={onDataChange}
                    isDarkMode={isDarkMode}
                />
            );
        }

        return (
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
        );
    }, [
        data.agentType,
        isOpen,
        flowId,
        id,
        agentData,
        onDataChange,
        isDarkMode,
        onAgentTypeChange,
        filesToUpload,
        onFilesToUploadChange,
    ]);

    return (
        <Modal
            title={modalTitle}
            isOpen={isOpen}
            onClose={onCancel}
            onSaveAndClose={onSaveAndClose}
            beforeTitle={importExportView}
            dataTestId={`wf-${flowId}-agent-modal-${id}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body">{tabComponent}</div>
            <div className="modal-actions">
                <button
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid={`cancel-agent-data-${id}`}
                    type="button"
                    title="Cancel"
                    aria-label="Cancel"
                >
                    Cancel
                </button>
                <div className="flex-row">
                    <button
                        type="button"
                        title="Save & Close"
                        className="modal-action-submit margin-right-10"
                        onClick={onSaveAndClose}
                        data-testid={`submit-and-close-agent-data-${id}`}
                        disabled={!isDirty}
                        aria-label="Save and Close"
                    >
                        Save & Close
                    </button>
                    <button
                        type="button"
                        title={isDirty ? "Save" : "No changes to save"}
                        className="modal-action-submit"
                        onClick={onSave}
                        data-testid={`submit-agent-data-${id}`}
                        disabled={!isDirty}
                        aria-label="Save"
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
});

WaldiezNodeAgentModal.displayName = "WaldiezNodeAgentModal";
