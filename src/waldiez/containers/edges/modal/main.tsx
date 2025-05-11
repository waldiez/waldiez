/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";

import { ChatAvailability, Modal, TabItem, TabItems } from "@waldiez/components";
import { useWaldiezEdgeModal } from "@waldiez/containers/edges/modal/hooks";
import { WaldiezEdgeBasicTab } from "@waldiez/containers/edges/modal/tabs/basic";
import { WaldiezEdgeGroupTab } from "@waldiez/containers/edges/modal/tabs/group";
import { WaldiezEdgeMessageTab } from "@waldiez/containers/edges/modal/tabs/message";
import { WaldiezEdgeNestedTab } from "@waldiez/containers/edges/modal/tabs/nested";
import { WaldiezEdgeModalProps } from "@waldiez/containers/edges/modal/types";
import { WaldiezGroupChatType } from "@waldiez/types";

export const WaldiezEdgeModal = (props: WaldiezEdgeModalProps) => {
    const { edgeId, isOpen, onClose } = props;
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
    const [activeTabIndex, setActiveTabIndex] = useState(0);
    useEffect(() => {
        setActiveTabIndex(0);
    }, [isOpen]);
    const onSaveAndClose = () => {
        onSubmit();
        onClose();
    };
    if (!edgeData || !edge || edgeType === "hidden" || !sourceAgent || !targetAgent) {
        return <></>;
    }
    const beforeTitle = <FaTrashCan className="clickable" onClick={onDelete} />;
    const groupChatType: WaldiezGroupChatType =
        edgeType !== "group"
            ? "none"
            : edgeData.targetType === "group_manager"
              ? "toManager"
              : edgeData.sourceType === "group_manager"
                ? "fromManager"
                : !targetAgent.parentId
                  ? "nested"
                  : "handoff";
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            onSaveAndClose={onSaveAndClose}
            beforeTitle={beforeTitle}
            title={edgeData.label}
            dataTestId={`edge-modal-${edgeId}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body edge-modal">
                {edgeType === "group" ? (
                    <TabItems activeTabIndex={activeTabIndex}>
                        <TabItem label="Properties" id={`we-${flowId}-edge-properties-${edgeId}`}>
                            <WaldiezEdgeGroupTab
                                edgeId={edgeId}
                                data={edgeData}
                                onDataChange={onDataChange}
                            />
                        </TabItem>
                        {groupChatType === "nested" && (
                            <TabItem label="Nested Chat" id={`we-${flowId}-edge-nested-${edgeId}`}>
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
                            <TabItem label="Availability" id={`we-${flowId}-edge-availability-${edgeId}`}>
                                <ChatAvailability data={edgeData} onDataChange={onDataChange} />
                            </TabItem>
                        )}
                    </TabItems>
                ) : (
                    <TabItems activeTabIndex={activeTabIndex}>
                        <TabItem label="Properties" id={`we-${flowId}-edge-properties-${edgeId}`}>
                            <WaldiezEdgeBasicTab
                                edgeId={edgeId}
                                data={edgeData}
                                edgeType={edgeType}
                                onTypeChange={onTypeChange}
                                onDataChange={onDataChange}
                            />
                        </TabItem>
                        {edgeType === "chat" && (
                            <TabItem label="Message" id={`we-${flowId}-edge-message-${edgeId}`}>
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
                            <TabItem label="Nested Chat" id={`we-${flowId}-edge-nested-${edgeId}`}>
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
                        data-testid={`modal-cancel-btn-${edgeId}`}
                    >
                        Cancel
                    </button>
                    <div className="flex-row">
                        <button
                            title="Save & Close"
                            type="button"
                            className="modal-action-submit margin-right-10 "
                            onClick={onSaveAndClose}
                            data-testid={`modal-submit-and-close-btn-${edgeId}`}
                            disabled={!isDirty}
                        >
                            Save & Close
                        </button>
                        <button
                            type="button"
                            title={isDirty ? "Save changes" : "No changes to save"}
                            className="modal-action-submit"
                            onClick={onSubmit}
                            data-testid={`modal-submit-btn-${edgeId}`}
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
