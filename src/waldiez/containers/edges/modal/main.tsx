/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";
import { FaTrashCan } from "react-icons/fa6";

import { Modal, TabItem, TabItems } from "@waldiez/components";
import { useWaldiezEdgeModal } from "@waldiez/containers/edges/modal/hooks";
import { WaldiezEdgeBasicTab } from "@waldiez/containers/edges/modal/tabs/basic";
import { WaldiezEdgeMessageTab } from "@waldiez/containers/edges/modal/tabs/message";
import { WaldiezEdgeNestedTab } from "@waldiez/containers/edges/modal/tabs/nested";
import { WaldiezEdgeSwarmTabs } from "@waldiez/containers/edges/modal/tabs/swarm";
import { WaldiezEdgeModalProps } from "@waldiez/containers/edges/modal/types";

export const WaldiezEdgeModal = (props: WaldiezEdgeModalProps) => {
    const { edgeId, isOpen, onClose } = props;
    const {
        flowId,
        edge,
        edgeData,
        edgeType,
        isDark,
        isDirty,
        isRagUser,
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
    if (!edgeData || !edge || edgeType === "hidden" || !sourceAgent || !targetAgent) {
        return <></>;
    }
    const isSwarmChat = edgeType === "swarm";
    const isGroupChat = edgeType === "group";
    const beforeTitle = <FaTrashCan className="clickable" onClick={onDelete} />;
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            beforeTitle={beforeTitle}
            title={edgeData.label}
            dataTestId={`edge-modal-${edgeId}`}
            hasUnsavedChanges={isDirty}
            preventCloseIfUnsavedChanges
        >
            <div className="modal-body edge-modal">
                {!isGroupChat && !isSwarmChat ? (
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
                                    skipRagOption={!isRagUser}
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
                ) : !isSwarmChat ? (
                    <WaldiezEdgeBasicTab
                        edgeId={edgeId}
                        data={edgeData}
                        edgeType="group"
                        onDataChange={onDataChange}
                        onTypeChange={onTypeChange}
                    />
                ) : (
                    <WaldiezEdgeSwarmTabs
                        isOpen={isOpen}
                        flowId={flowId}
                        edgeId={edgeId}
                        darkMode={isDark}
                        edgeData={edgeData}
                        sourceAgent={sourceAgent}
                        targetAgent={targetAgent}
                        onDataChange={onDataChange}
                    />
                )}
                <div className="modal-actions padding-10">
                    <button
                        type="button"
                        title="Cancel"
                        className="modal-action-cancel"
                        onClick={onCancel}
                        data-testid="modal-cancel-btn"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        title={isDirty ? "Save changes" : "No changes to save"}
                        className="modal-action-submit"
                        onClick={onSubmit}
                        data-testid="modal-submit-btn"
                        disabled={!isDirty}
                    >
                        Save
                    </button>
                </div>
            </div>
        </Modal>
    );
};
