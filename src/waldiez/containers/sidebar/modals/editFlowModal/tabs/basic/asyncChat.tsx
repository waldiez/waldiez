/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MultiValue, Select } from "@waldiez/components";
import { EditFlowModalModalTabBasicProps } from "@waldiez/containers/sidebar/modals/editFlowModal/tabs/basic/types";
import { WaldiezEdge } from "@waldiez/models";

export const HandleASyncChatOrderAndPrerequisites = (props: EditFlowModalModalTabBasicProps) => {
    const {
        sortedEdges,
        remainingEdges,
        selectedNewEdge,
        onSelectedNewEdgeChange,
        onAddEdge,
        onRemoveEdge,
        onPrerequisitesChange,
    } = props;

    const onSetChatPrerequisitesChange = (
        edge: WaldiezEdge,
        options: MultiValue<{ label: string; value: WaldiezEdge }>,
    ) => {
        if (options) {
            const prerequisites = options.map(option => option.value.id);
            onPrerequisitesChange(edge, prerequisites);
        } else {
            onPrerequisitesChange(edge, []);
        }
    };

    return (
        <div className="flow-chat-prerequisites-wrapper">
            <div className="info">
                Specify the chats to run when the flow initializes and their prerequisites (if more than one).
                You should remove the ones that are expected to be triggered during the flow (like in nested
                chats).
            </div>
            {sortedEdges.map((edge, index) => {
                return (
                    <div key={edge.id} className="flow-chat-prerequisites">
                        <div className="flow-chat-prerequisite-source">
                            <span>{edge.data?.label as string}</span>
                        </div>
                        {sortedEdges.length > 1 && (
                            <div className="flow-chat-prerequisite-actions">
                                <label htmlFor="chat-pre-requisites-select">Prerequisites:</label>
                                <Select
                                    placeholder="Select prerequisites..."
                                    options={sortedEdges
                                        .filter(e => e.id !== edge.id)
                                        .map(edge => ({
                                            value: edge,
                                            label: edge.data?.label as string,
                                        }))}
                                    value={edge.data?.prerequisites.map(prerequisite => {
                                        const edge = sortedEdges.find(e => e.id === prerequisite);
                                        return edge
                                            ? {
                                                  value: edge,
                                                  label: edge.data?.label as string,
                                              }
                                            : ([] as any);
                                    })}
                                    onChange={onSetChatPrerequisitesChange.bind(null, edge)}
                                    isMulti
                                    inputId="chat-pre-requisites-select"
                                />
                                {sortedEdges.length > 1 && (
                                    <div className="flow-chat-remove">
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
