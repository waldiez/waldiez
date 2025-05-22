/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";

import { ChatAvailability, Modal, TabItem, TabItems } from "@waldiez/components";
import { useWaldiezEdgeModal } from "@waldiez/containers/edges/modal/hooks";
import { WaldiezEdgeBasicTab } from "@waldiez/containers/edges/modal/tabs/basic";
import { WaldiezEdgeGroupTab } from "@waldiez/containers/edges/modal/tabs/group";
import { WaldiezEdgeMessageTab } from "@waldiez/containers/edges/modal/tabs/message";
import { WaldiezEdgeNestedTab } from "@waldiez/containers/edges/modal/tabs/nested";
import { WaldiezEdgeModalProps } from "@waldiez/containers/edges/modal/types";
import { WaldiezGroupChatType, WaldiezHandoffCondition } from "@waldiez/types";

/**
 * Modal component for editing edge properties
 */
export const WaldiezEdgeModal = memo((props: WaldiezEdgeModalProps) => {
    const { edgeId, isOpen, onClose } = props;

    // Get edge data and handlers from custom hook
    const {
        flowId,
        edge,
        edgeData,
        edgeType,
        isDark,
        isDirty,
        isRagUserProxy,
        sourceAgent,
        targetAgent,
        onDataChange,
        onTypeChange,
        onCancel,
        onDelete,
        onSubmit,
    } = useWaldiezEdgeModal(props);

    // Tab state
    const [activeTabIndex, setActiveTabIndex] = useState(0);

    // Reset to first tab when modal opens
    useEffect(() => {
        if (isOpen) {
            setActiveTabIndex(0);
        }
    }, [isOpen]);

    // If missing required data, return empty fragment
    if (!edgeData || !edge || edgeType === "hidden" || !sourceAgent || !targetAgent) {
        return null;
    }

    /**
     * Save changes and close modal
     */
    const onSaveAndClose = useCallback(() => {
        onSubmit();
        onClose();
    }, [onSubmit, onClose]);

    /**
     * Update availability condition
     */
    const onAvailabilityChange = useCallback(
        (condition: WaldiezHandoffCondition | null) => {
            onDataChange({ handoffCondition: condition });
        },
        [onDataChange],
    );

    // Create delete button for modal header
    const beforeTitle = useMemo(
        () => (
            <FaTrashCan
                className="clickable"
                onClick={onDelete}
                title="Delete edge"
                aria-label="Delete edge"
            />
        ),
        [onDelete],
    );

    // Determine group chat type based on edge properties
    const groupChatType = useMemo<WaldiezGroupChatType>(() => {
        if (edgeType !== "group") {
            return "none";
        }

        if (edgeData.targetType === "group_manager") {
            return "toManager";
        }
        if (edgeData.sourceType === "group_manager") {
            return "fromManager";
        }
        if (!targetAgent.parentId) {
            return "nested";
        }

        return "handoff";
    }, [edgeType, edgeData?.targetType, edgeData?.sourceType, targetAgent?.parentId]);

    // Generate IDs for tabs
    const tabIds = useMemo(
        () => ({
            properties: `we-${flowId}-edge-properties-${edgeId}`,
            message: `we-${flowId}-edge-message-${edgeId}`,
            nested: `we-${flowId}-edge-nested-${edgeId}`,
            availability: `we-${flowId}-edge-availability-${edgeId}`,
        }),
        [flowId, edgeId],
    );

    // Set button test IDs
    const testIds = useMemo(
        () => ({
            modal: `edge-modal-${edgeId}`,
            cancel: `modal-cancel-btn-${edgeId}`,
            saveAndClose: `modal-submit-and-close-btn-${edgeId}`,
            save: `modal-submit-btn-${edgeId}`,
        }),
        [edgeId],
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSaveAndClose={onSaveAndClose}
            beforeTitle={beforeTitle}
            title={edgeData.label}
            dataTestId={testIds.modal}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body edge-modal">
                {edgeType === "group" ? (
                    <TabItems activeTabIndex={activeTabIndex}>
                        <TabItem label="Properties" id={tabIds.properties}>
                            <WaldiezEdgeGroupTab
                                edgeId={edgeId}
                                data={edgeData}
                                onDataChange={onDataChange}
                            />
                        </TabItem>
                        {groupChatType === "toManager" && (
                            <TabItem label="Message" id={tabIds.message}>
                                <WaldiezEdgeMessageTab
                                    edgeId={edgeId}
                                    data={edgeData}
                                    darkMode={isDark}
                                    skipRagOption
                                    skipCarryoverOption
                                    skipContextVarsOption
                                    onDataChange={onDataChange}
                                />
                            </TabItem>
                        )}
                        {groupChatType === "nested" && (
                            <TabItem label="Nested Chat" id={tabIds.nested}>
                                <WaldiezEdgeNestedTab
                                    flowId={flowId}
                                    edgeId={edgeId}
                                    darkMode={isDark}
                                    data={edgeData}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>
                        )}

                        {groupChatType === "handoff" && (
                            <TabItem label="Availability" id={tabIds.availability}>
                                <ChatAvailability
                                    condition={edgeData.handoffCondition}
                                    onDataChange={onAvailabilityChange}
                                />
                            </TabItem>
                        )}
                    </TabItems>
                ) : (
                    <TabItems activeTabIndex={activeTabIndex}>
                        <TabItem label="Properties" id={tabIds.properties}>
                            <WaldiezEdgeBasicTab
                                edgeId={edgeId}
                                data={edgeData}
                                edgeType={edgeType}
                                onTypeChange={onTypeChange}
                                onDataChange={onDataChange}
                            />
                        </TabItem>

                        {edgeType === "chat" && (
                            <TabItem label="Message" id={tabIds.message}>
                                <WaldiezEdgeMessageTab
                                    edgeId={edgeId}
                                    data={edgeData}
                                    darkMode={isDark}
                                    skipRagOption={!isRagUserProxy}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>
                        )}

                        {edgeType === "nested" && (
                            <TabItem label="Nested Chat" id={tabIds.nested}>
                                <WaldiezEdgeNestedTab
                                    flowId={flowId}
                                    edgeId={edgeId}
                                    darkMode={isDark}
                                    data={edgeData}
                                    onDataChange={onDataChange}
                                />
                            </TabItem>
                        )}
                    </TabItems>
                )}

                <div className="modal-actions">
                    <button
                        type="button"
                        title="Cancel"
                        className="modal-action-cancel"
                        onClick={onCancel}
                        data-testid={testIds.cancel}
                    >
                        Cancel
                    </button>

                    <div className="flex-row">
                        <button
                            title="Save & Close"
                            type="button"
                            className="modal-action-submit margin-right-10 "
                            onClick={onSaveAndClose}
                            data-testid={testIds.saveAndClose}
                            disabled={!isDirty}
                            aria-disabled={!isDirty}
                        >
                            Save & Close
                        </button>

                        <button
                            type="button"
                            title={isDirty ? "Save changes" : "No changes to save"}
                            className="modal-action-submit"
                            onClick={onSubmit}
                            data-testid={testIds.save}
                            disabled={!isDirty}
                            aria-disabled={!isDirty}
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>
        </Modal>
    );
});

WaldiezEdgeModal.displayName = "WaldiezEdgeModal";
