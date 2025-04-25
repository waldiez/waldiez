/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { WaldiezAgentSwarmHandoffsProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";
import { getSwarmAgentHandoffs, isAfterWork } from "@waldiez/store/utils";
import { WaldiezSwarmAfterWork, WaldiezSwarmHandoff, WaldiezSwarmOnCondition } from "@waldiez/types";
import { capitalize } from "@waldiez/utils";

export const WaldiezAgentSwarmHandoffs = (props: WaldiezAgentSwarmHandoffsProps) => {
    const { id, agents, agentConnections, data, edges, onDataChange } = props;
    const dataCopy = structuredClone(data);
    const swarmAgentNodes = agents.filter(agent => agent.data.agentType === "swarm");
    const agentHandoffs = getSwarmAgentHandoffs(dataCopy, agentConnections, agents, swarmAgentNodes, edges);
    const agentOnConditionHandoffs: WaldiezSwarmOnCondition[] = agentHandoffs.filter(
        handoff => !isAfterWork(handoff),
    ) as WaldiezSwarmOnCondition[];
    const [toSort, setToSort] = useState(agentOnConditionHandoffs);
    const onConditionHandoffsCount = agentOnConditionHandoffs.length;
    const afterWorkHandoffs = agentHandoffs.filter(isAfterWork);
    const onMoveAgentHandoffUp = (index: number) => {
        const tmpConditions = [...agentOnConditionHandoffs] as WaldiezSwarmOnCondition[];
        //swap the members and sort by .order
        const prev = tmpConditions[index - 1];
        const thisCondition = tmpConditions[index];
        tmpConditions[index - 1] = thisCondition;
        tmpConditions[index] = prev;
        const onConditions = tmpConditions.map((condition, i) => {
            condition.target.order = i;
            return condition;
        });
        setToSort([...onConditions]);
        const allHandoffs = [...onConditions, ...afterWorkHandoffs];
        onDataChange({ handoffs: allHandoffs });
    };
    const onMoveAgentHandoffDown = (index: number) => {
        const tmpConditions = [...agentOnConditionHandoffs];
        //swap the members and sort by .order
        const next = tmpConditions[index + 1];
        const thisCondition = tmpConditions[index];
        tmpConditions[index + 1] = thisCondition;
        tmpConditions[index] = next;
        const onConditions = tmpConditions.map((condition, i) => {
            condition.target.order = i;
            return condition;
        });
        setToSort([...onConditions]);
        const allHandoffs = [...onConditions, ...afterWorkHandoffs];
        onDataChange({ handoffs: allHandoffs });
    };
    const getAfterWorkName = (afterWork: WaldiezSwarmAfterWork) => {
        // export type WaldiezSwarmAfterWorkRecipientType = "agent" | "option" | "callable";
        // export type WaldiezSwarmAfterWorkOption = "TERMINATE" | "REVERT_TO_USER" | "STAY" | "SWARM_MANAGER";
        if (afterWork.recipientType === "agent") {
            const targetAgent = agents.find(agent => agent.id === afterWork.recipient);
            if (!targetAgent) {
                return "Unknown";
            }
            return targetAgent.data.label || "Unknown";
        }
        if (afterWork.recipientType === "option") {
            return capitalize(afterWork.recipient).replace(/_/g, " ");
        }
        return "Method";
    };
    // eslint-disable-next-line max-statements
    const getHandoffName = (handoff: WaldiezSwarmHandoff) => {
        if ("targetType" in handoff && "target" in handoff) {
            if (
                handoff.targetType === "nested_chat" &&
                typeof handoff.target === "object" &&
                handoff.target &&
                "id" in handoff.target
            ) {
                // either from data.nestedChats or from onCondition
                const targetEdge = edges.find(edge => edge.id === handoff.target.id);
                if (!targetEdge) {
                    return "Unknown (Nested Chat)";
                }
                const targetAgent = agents.find(agent => agent.id === targetEdge.target);
                if (!targetAgent) {
                    return "Unknown (Nested Chat)";
                }
                return `${targetAgent.data.label || "Unknown"} (Nested Chat)`;
            } else {
                // from connections
                const targetAgentId = handoff.target.id;
                const targetAgent = agents.find(agent => agent.id === targetAgentId);
                if (!targetAgent) {
                    return "Unknown (Swarm Agent)";
                }
                return `${targetAgent.data.label || "Unknown"} (Swarm Agent)`;
            }
        }
        if (isAfterWork(handoff)) {
            return `${getAfterWorkName(handoff as WaldiezSwarmAfterWork)} (After Work)`;
        }
        return "Unknown";
    };
    return (
        <div className="agent-panel agent-swarm-handoffs-panel">
            {agentHandoffs.length === 0 ? (
                <div className="agent-no-targets margin-top-10 margin-bottom-10">
                    <div className="agent-no-targets-text">
                        <span>No targets available for handoffs</span>
                    </div>
                </div>
            ) : (
                <div className="agent-swarm-handoff-recipients">
                    <div className="flex-column margin-bottom-10">
                        {toSort.map((handoff, index) => (
                            <div
                                key={`agent-${id}-handoff-recipient-${index}`}
                                className="agent-swarm-handoff-recipient"
                            >
                                <div
                                    style={
                                        onConditionHandoffsCount < 2
                                            ? { marginLeft: -20 }
                                            : onConditionHandoffsCount === 2
                                              ? { width: 30 }
                                              : onConditionHandoffsCount > 2
                                                ? { width: 60 }
                                                : {}
                                    }
                                    className="flex agent-swarm-order-actions margin-right-10"
                                >
                                    {index > 0 && (
                                        <button
                                            type="button"
                                            title="Move up"
                                            className="agent-swarm-order-action"
                                            data-testid={`move-handoff-up-button-${index}`}
                                            onClick={onMoveAgentHandoffUp.bind(null, index)}
                                        >
                                            &#x2191;
                                        </button>
                                    )}
                                    {index < onConditionHandoffsCount - 1 && (
                                        <button
                                            title="Move down"
                                            type="button"
                                            className="agent-swarm-order-action"
                                            data-testid={`move-handoff-down-button-${index}`}
                                            onClick={onMoveAgentHandoffDown.bind(null, index)}
                                        >
                                            &#x2193;
                                        </button>
                                    )}
                                </div>
                                <div className="agent-handoff-recipient-name">{getHandoffName(handoff)}</div>
                            </div>
                        ))}
                        {afterWorkHandoffs.length > 0 && (
                            <div className="agent-swarm-handoff-recipient">
                                <div
                                    className={`agent-handoff-recipient-name${onConditionHandoffsCount < 2 && " margin-left--10"}`}
                                >
                                    {getHandoffName(afterWorkHandoffs[0])}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
