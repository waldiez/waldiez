/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { useHandoffs } from "@waldiez/components/handoffs/hooks";
import { WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

type HandoffsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    edges: WaldiezEdge[];
    onDataChange: (data: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for displaying agent's handoffs with ordering capability
 * Shows connections to other agents, nested chats, and any AfterWork handoff
 */
export const Handoffs = memo((props: HandoffsProps) => {
    const { id, data, agents, edges, onDataChange } = props;

    const {
        hasHandoffs,
        orderedTransitionTargets,
        afterWorkHandoff,
        getTransitionTargetName,
        getNestedChatDisplayName,
        getAfterWorkTargetName,
        moveTransitionTargetUp,
        moveTransitionTargetDown,
    } = useHandoffs(id, data, agents, edges, onDataChange);

    return (
        <div className="handoffs-container" data-testid={`handoffs-container-${id}`}>
            <div className="info margin-left--5">
                Handoffs control where the conversation flow goes from this agent. They include connections to
                other agents, nested chats, and what happens after the agent's work is done.
            </div>

            <div className="handoffs-list">
                {!hasHandoffs ? (
                    <div className="no-handoffs-message">
                        This agent has no handoffs configured. You can add connections to other agents in the
                        flow editor, configure nested chats in the agent settings, or set what happens after
                        the agent's work is done in the "Afterwards" tab.
                    </div>
                ) : (
                    <div className="handoffs-items">
                        {/* Display ordered handoffs section - includes both direct connections and nested chats */}
                        {orderedTransitionTargets.length > 0 && (
                            <div className="handoffs-section">
                                <h4 className="handoffs-section-title">Handoff Order</h4>
                                <p className="handoff-order-instructions">
                                    Use the up and down arrows to reorder handoffs. The ordering determines
                                    the sequence in which handoffs are considered.
                                </p>
                                <div className="handoff-list">
                                    {orderedTransitionTargets.map((item, index) => (
                                        <div
                                            key={item.id}
                                            className="handoff-item"
                                            data-testid={`handoff-item-${item.id}`}
                                        >
                                            {/* Reorder buttons */}
                                            <div className="reorder-buttons">
                                                {/* Move Up Button - Only shown when not first item */}
                                                {index > 0 && (
                                                    <button
                                                        type="button"
                                                        title="Move up"
                                                        className="reorder-btn up-btn"
                                                        data-testid={`move-handoff-up-button-${index}`}
                                                        onClick={() => moveTransitionTargetUp(index)}
                                                        aria-label="Move up"
                                                    >
                                                        &#x2191;
                                                    </button>
                                                )}

                                                {/* Move Down Button - Only shown when not last item */}
                                                {index < orderedTransitionTargets.length - 1 && (
                                                    <button
                                                        type="button"
                                                        title="Move down"
                                                        className="reorder-btn down-btn"
                                                        data-testid={`move-handoff-down-button-${index}`}
                                                        onClick={() => moveTransitionTargetDown(index)}
                                                        aria-label="Move down"
                                                    >
                                                        &#x2193;
                                                    </button>
                                                )}
                                            </div>

                                            <div className="handoff-item-content">
                                                <div className="handoff-order-badge">{index + 1}</div>
                                                <div className="handoff-type">
                                                    {item.target.target_type === "AgentTarget"
                                                        ? "Agent Connection"
                                                        : item.target.target_type === "NestedChatTarget"
                                                          ? "Nested Chat"
                                                          : item.target.target_type}
                                                </div>
                                                <div className="handoff-target">
                                                    <span className="target-label">Target:</span>{" "}
                                                    {item.id === "nested-chat"
                                                        ? getNestedChatDisplayName(0)
                                                        : getTransitionTargetName(item.target)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Display AfterWork handoff if exists - not re-orderable */}
                        {afterWorkHandoff && afterWorkHandoff.after_work && (
                            <div className="handoffs-section">
                                <h4 className="handoffs-section-title">After Work</h4>
                                <div
                                    className="handoff-item after-work-handoff"
                                    data-testid="handoff-after-work-item"
                                >
                                    <div className="handoff-item-content">
                                        <div className="handoff-type">AfterWork</div>
                                        <div className="handoff-target">
                                            <span className="target-label">Target:</span>{" "}
                                            {getAfterWorkTargetName(afterWorkHandoff.after_work)}
                                        </div>
                                        <div className="handoff-info">
                                            <em>AfterWork handoff always executes last</em>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

Handoffs.displayName = "Handoffs";
