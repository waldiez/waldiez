/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { Modal, TabItem, TabItems } from "@waldiez/components";
import { getImportExportView } from "@waldiez/containers/nodes/common";
import { WaldiezSkillAdvancedTab, WaldiezSkillBasicTab } from "@waldiez/containers/nodes/skill/modal/tabs";
import { WaldiezNodeSkillModalProps } from "@waldiez/containers/nodes/skill/modal/types";

export const WaldiezNodeSkillModal = (props: WaldiezNodeSkillModalProps) => {
    const {
        skillId,
        flowId,
        data,
        isModalOpen,
        isDirty,
        onClose,
        onCancel,
        onSave,
        onSaveAndClose,
        onImport,
        onExport,
    } = props;
    const importExportView = getImportExportView(flowId, skillId, "skill", onImport, onExport);
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isModalOpen]);
    return (
        <Modal
            beforeTitle={importExportView}
            title={data.label}
            isOpen={isModalOpen}
            onSaveAndClose={onSaveAndClose}
            onClose={onClose}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body">
                <TabItems activeTabIndex={activeTabIndex}>
                    <TabItem label="Basic" id={`skill-basic-tab-${skillId}`}>
                        <WaldiezSkillBasicTab {...props} />
                    </TabItem>
                    <TabItem label="Advanced" id={`skill-advanced-tab-${skillId}`}>
                        <WaldiezSkillAdvancedTab {...props} />
                    </TabItem>
                </TabItems>
            </div>
            <div className="modal-actions">
                <button
                    type="button"
                    title="Cancel"
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid={`modal-cancel-btn-${skillId}`}
                >
                    Cancel
                </button>
                <div className="modal-actions flex-center margin-top--10 margin-bottom--10">
                    <button
                        title="Save & Close"
                        type="button"
                        className="modal-action-submit margin-right-10 "
                        onClick={onSaveAndClose}
                        data-testid={`modal-submit-and-close-btn-${skillId}`}
                        disabled={!isDirty}
                    >
                        Save & Close
                    </button>
                    <button
                        title="Save"
                        type="button"
                        className="modal-action-submit"
                        onClick={onSave}
                        data-testid={`modal-submit-btn-${skillId}`}
                        disabled={!isDirty}
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};
