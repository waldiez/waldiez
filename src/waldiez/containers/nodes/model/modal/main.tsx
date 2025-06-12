/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { Modal, TabItem, TabItems } from "@waldiez/components";
import {
    WaldiezNodeModelModalAWSTab,
    WaldiezNodeModelModalAdvancedTab,
    WaldiezNodeModelModalBasicTab,
    WaldiezNodeModelModalPriceTab,
} from "@waldiez/containers/nodes/model/modal/tabs";
import { WaldiezNodeModelModalProps } from "@waldiez/containers/nodes/model/modal/types";

export const WaldiezNodeModelModal: React.FC<WaldiezNodeModelModalProps> = (
    props: WaldiezNodeModelModalProps,
) => {
    const {
        modelId,
        data,
        isOpen,
        isDirty,
        importExportView,
        onDataChange,
        onLogoChange,
        onClose,
        onSave,
        onSaveAndClose,
        onTest,
        onCancel,
    } = props;
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isOpen]);
    return (
        <Modal
            beforeTitle={importExportView}
            title={data.label}
            dataTestId={`model-modal-${modelId}`}
            isOpen={isOpen}
            onClose={onClose}
            onSaveAndClose={onSaveAndClose}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body">
                <TabItems activeTabIndex={activeTabIndex}>
                    <TabItem label="Basic" id={`model-config-basic-${modelId}`}>
                        <div className="model-panel">
                            <WaldiezNodeModelModalBasicTab
                                id={modelId}
                                data={data}
                                onDataChange={onDataChange}
                                onLogoChange={onLogoChange}
                            />
                        </div>
                    </TabItem>
                    {data.apiType === "bedrock" && (
                        <TabItem label="AWS" id={`model-config-aws-${modelId}`}>
                            <div className="model-panel">
                                <WaldiezNodeModelModalAWSTab data={data} onDataChange={onDataChange} />
                            </div>
                        </TabItem>
                    )}
                    <TabItem label="Advanced" id={`model-config-advanced-${modelId}`}>
                        <div className="model-panel">
                            <WaldiezNodeModelModalAdvancedTab data={data} onDataChange={onDataChange} />
                        </div>
                    </TabItem>
                    <TabItem label="Price" id={`model-config-price-${modelId}`}>
                        <div className="model-panel">
                            <WaldiezNodeModelModalPriceTab
                                modelId={modelId}
                                data={data}
                                onDataChange={onDataChange}
                            />
                        </div>
                    </TabItem>
                </TabItems>
                <div className="modal-actions">
                    <button
                        type="button"
                        title="Cancel"
                        className="modal-action-cancel"
                        onClick={onCancel}
                        data-testid={`modal-cancel-btn-${modelId}`}
                    >
                        Cancel
                    </button>
                    <div className="flex-row">
                        <button
                            type="button"
                            title="Test"
                            className="margin-right-10 neutral"
                            onClick={onTest}
                            data-testid={`modal-test-btn-${modelId}`}
                            disabled={isDirty}
                        >
                            Test
                        </button>
                        <button
                            title="Save & Close"
                            type="button"
                            className="save margin-right-10"
                            onClick={onSaveAndClose}
                            data-testid={`modal-submit-and-close-btn-${modelId}`}
                            disabled={!isDirty}
                        >
                            Save & Close
                        </button>
                        <button
                            type="button"
                            title="Save"
                            className="modal-action-submit"
                            onClick={onSave}
                            data-testid={`modal-submit-btn-${modelId}`}
                            disabled={!isDirty}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
};
