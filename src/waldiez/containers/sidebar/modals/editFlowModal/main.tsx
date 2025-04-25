/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Modal, TabItem, TabItems } from "@waldiez/components";
import { useEditFlowModal } from "@waldiez/containers/sidebar/modals/editFlowModal/hooks";
import {
    EditFlowModalModalTabBasic,
    EditFlowModalModalTabOther,
} from "@waldiez/containers/sidebar/modals/editFlowModal/tabs";
import { EditFlowModalProps } from "@waldiez/containers/sidebar/modals/editFlowModal/types";

export const EditFlowModal = (props: EditFlowModalProps) => {
    const { flowId } = props;
    const {
        flowData,
        isOpen,
        sortedEdgesState,
        remainingEdgesState,
        selectedNewEdge,
        isDirty,
        onClose,
        onSubmit,
        onCancel,
        onDataChange,
        onSelectedNewEdgeChange,
        onAddEdge,
        onRemoveEdge,
        onMoveEdgeUp,
        onMoveEdgeDown,
        onPrerequisitesChange,
    } = useEditFlowModal(props);
    const onSaveAndClose = () => {
        onSubmit();
        onClose();
    };
    return (
        <Modal
            title="Edit Flow"
            isOpen={isOpen}
            onSaveAndClose={onSaveAndClose}
            onClose={onClose}
            className="edit-flow-modal"
            hasMaximizeBtn={false}
            dataTestId={`edit-flow-modal-${flowId}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <TabItems activeTabIndex={0}>
                <TabItem label="Properties" id={`rf-${flowId}-edit-flow-modal`}>
                    <EditFlowModalModalTabBasic
                        flowId={flowId}
                        data={flowData}
                        remainingEdges={remainingEdgesState}
                        sortedEdges={sortedEdgesState}
                        selectedNewEdge={selectedNewEdge}
                        onPrerequisitesChange={onPrerequisitesChange}
                        onSelectedNewEdgeChange={onSelectedNewEdgeChange}
                        onAddEdge={onAddEdge}
                        onRemoveEdge={onRemoveEdge}
                        onMoveEdgeUp={onMoveEdgeUp}
                        onMoveEdgeDown={onMoveEdgeDown}
                        onDataChange={onDataChange}
                    />
                </TabItem>
                <TabItem label="Other" id={`rf-${flowId}-edit-flow-modal-extras`}>
                    <EditFlowModalModalTabOther flowId={flowId} data={flowData} onDataChange={onDataChange} />
                </TabItem>
            </TabItems>
            <div className="modal-actions">
                <button
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid="edit-flow-cancel-button"
                    type="button"
                    title="Cancel"
                >
                    Cancel
                </button>
                <button
                    type="button"
                    title="Save"
                    className="modal-action-submit"
                    onClick={onSubmit}
                    data-testid="edit-flow-submit-button"
                    disabled={!isDirty}
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};
