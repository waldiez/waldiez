/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { Modal, TabItem, TabItems } from "@waldiez/components";
import { getImportExportView } from "@waldiez/containers/nodes/common";
import { WaldiezToolAdvancedTab, WaldiezToolBasicTab } from "@waldiez/containers/nodes/tool/modal/tabs";
import { WaldiezNodeToolModalProps } from "@waldiez/containers/nodes/tool/modal/types";

export const WaldiezNodeToolModal: React.FC<WaldiezNodeToolModalProps> = props => {
    const {
        toolId,
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
    const importExportView = getImportExportView(flowId, toolId, "tool", onImport, onExport);
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
                    <TabItem label="Basic" id={`tool-basic-tab-${toolId}`}>
                        <div className="tool-panel">
                            <WaldiezToolBasicTab {...props} />
                        </div>
                    </TabItem>
                    {data.toolType !== "predefined" && (
                        <TabItem label="Advanced" id={`tool-advanced-tab-${toolId}`}>
                            <div className="tool-panel">
                                <WaldiezToolAdvancedTab {...props} />
                            </div>
                        </TabItem>
                    )}
                </TabItems>
            </div>
            <div className="modal-actions">
                <button
                    type="button"
                    title="Cancel"
                    className="modal-action-cancel"
                    onClick={onCancel}
                    data-testid={`modal-cancel-btn-${toolId}`}
                >
                    Cancel
                </button>
                <button
                    title="Save & Close"
                    type="button"
                    className="modal-action-submit margin-right-10 "
                    onClick={onSaveAndClose}
                    data-testid={`modal-submit-and-close-btn-${toolId}`}
                    disabled={!isDirty}
                >
                    Save & Close
                </button>
                <button
                    title="Save"
                    type="button"
                    className="modal-action-submit"
                    onClick={onSave}
                    data-testid={`modal-submit-btn-${toolId}`}
                    disabled={!isDirty}
                >
                    Save
                </button>
            </div>
        </Modal>
    );
};
