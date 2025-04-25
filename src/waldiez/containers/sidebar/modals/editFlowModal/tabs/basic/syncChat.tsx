/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Select } from "@waldiez/components";
import { EditFlowModalModalTabBasicProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/types";

export const HandleSyncChatOrder = (props: EditFlowModalModalTabBasicProps) => {
    const {
        sortedEdges,
        remainingEdges,
        selectedNewEdge,
        onSelectedNewEdgeChange,
        onAddEdge,
        onRemoveEdge,
        onMoveEdgeUp,
        onMoveEdgeDown,
    } = props;
    return (
        <div className="flow-chat-order-wrapper">
            <div className="info">
                Specify the chats to run when the flow initializes and their order (if more than one). You
                should remove the ones that are expected to be triggered during the flow (like in nested
                chats).
            </div>
            {sortedEdges.map((edge, index) => {
                return (
                    <div key={edge.id} className="flow-order-item-wrapper">
                        <div className="flow-order-item">
                            <span className="flow-order-item-entry">{edge.data?.label as string}</span>
                        </div>
                        {sortedEdges.length > 1 && (
                            <div className="flow-order-item-actions">
                                {index > 0 && sortedEdges.length > 1 && (
                                    <button
                                        type="button"
                                        title="Move up"
                                        className="flow-order-item-action"
                                        data-testid={`move-edge-up-button-${index}`}
                                        onClick={onMoveEdgeUp.bind(null, index)}
                                    >
                                        &#x2191;
                                    </button>
                                )}
                                {index < sortedEdges.length - 1 && (
                                    <button
                                        title="Move down"
                                        type="button"
                                        className="flow-order-item-action"
                                        data-testid={`move-edge-down-button-${index}`}
                                        onClick={onMoveEdgeDown.bind(null, index)}
                                    >
                                        &#x2193;
                                    </button>
                                )}
                                {sortedEdges.length > 1 && (
                                    <button
                                        type="button"
                                        title="Remove"
                                        className="flow-order-item-action"
                                        data-testid={`remove-edge-button-${index}`}
                                        onClick={onRemoveEdge.bind(null, edge)}
                                    >
                                        Remove
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                );
            })}
            {remainingEdges.length > 0 && (
                <div className="flow-order-add-wrapper">
                    <div className="flex-1 margin-right-10">
                        {/* for testing Select by label */}
                        <label htmlFor="new-edge-select" className="hidden">
                            Add new chat
                        </label>
                        <Select
                            options={remainingEdges.map(edge => ({
                                value: edge,
                                label: edge.data?.label as string,
                            }))}
                            value={
                                selectedNewEdge
                                    ? {
                                          value: selectedNewEdge,
                                          label: selectedNewEdge.data?.label as string,
                                      }
                                    : null
                            }
                            onChange={onSelectedNewEdgeChange}
                            inputId="new-edge-select"
                        />
                    </div>
                    <button
                        type="button"
                        title="Add chat"
                        className="flow-order-add-button"
                        disabled={!selectedNewEdge}
                        onClick={onAddEdge}
                        data-testid="add-edge-to-flow-button"
                    >
                        Add
                    </button>
                </div>
            )}
        </div>
    );
};
