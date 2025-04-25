/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { OnConditionAvailable, TextInput } from "@waldiez/components";
import { WaldiezAgentSwarmNestedChatConditionProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";
import {
    WaldiezEdge,
    WaldiezNodeAgent,
    WaldiezNodeAgentSwarmData,
    WaldiezSwarmOnCondition,
    WaldiezSwarmOnConditionAvailable,
} from "@waldiez/types";

export const WaldiezAgentSwarmNestedChatCondition = (props: WaldiezAgentSwarmNestedChatConditionProps) => {
    const { flowId, data, darkMode, agentConnections, onDataChange } = props;
    const onConditionStringChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        // first check for existing Handoff with nested_chat target
        const handoffs = structuredClone(data.handoffs);
        const onConditionHandoffIndex = handoffs.findIndex(handoff => {
            if ("targetType" in handoff) {
                return handoff.targetType === "nested_chat";
            }
        });
        if (onConditionHandoffIndex === -1) {
            handoffs.push({
                target: {
                    id: getEdgeId(data, agentConnections),
                    order: 0,
                },
                targetType: "nested_chat",
                available: {
                    type: "none",
                    value: null,
                },
                condition: event.target.value,
            });
        } else {
            const currentOnCondition = handoffs[onConditionHandoffIndex] as WaldiezSwarmOnCondition;
            handoffs[onConditionHandoffIndex] = {
                ...currentOnCondition,
                condition: event.target.value,
            };
        }
        onDataChange({ handoffs }); // Retrieve the status of the order.
    };
    const edgeId = getEdgeId(data, agentConnections);
    const onConditionHandoffsNested = data.handoffs.filter(handoff => {
        if ("targetType" in handoff) {
            return handoff.targetType === "nested_chat";
        }
    });
    const onConditionAvailable: WaldiezSwarmOnConditionAvailable =
        onConditionHandoffsNested.length > 0
            ? (onConditionHandoffsNested[0] as WaldiezSwarmOnCondition).available
            : {
                  type: "none",
                  value: null,
              };
    const onCondition = getCondition(data);
    const onIsConditionAvailableChange = (onAvailableData: WaldiezSwarmOnConditionAvailable) => {
        const handoffs = structuredClone(data.handoffs);
        const onConditionHandoffIndex = handoffs.findIndex(handoff => {
            if ("targetType" in handoff) {
                return handoff.targetType === "nested_chat";
            }
        });
        if (onConditionHandoffIndex === -1) {
            handoffs.push({
                target: {
                    id: edgeId,
                    order: 0,
                },
                targetType: "nested_chat",
                available: onAvailableData,
                condition: "",
            });
        } else {
            const currentOnCondition = handoffs[onConditionHandoffIndex] as WaldiezSwarmOnCondition;
            handoffs[onConditionHandoffIndex] = {
                ...currentOnCondition,
                available: onAvailableData,
            };
        }
        onDataChange({ handoffs });
    };
    return (
        <div className="agent-panel agent-swarm-nestedChats-condition-panel">
            <div className="modal-tab-body flex-column">
                <TextInput
                    value={onCondition}
                    onChange={onConditionStringChange}
                    placeholder="Condition for this handoff..."
                    label={"Condition:"}
                    dataTestId={`edge-${edgeId}-condition-input`}
                />
                {edgeId && (
                    <OnConditionAvailable
                        data={onConditionAvailable}
                        flowId={flowId}
                        darkMode={darkMode}
                        onDataChange={onIsConditionAvailableChange}
                    />
                )}
            </div>
        </div>
    );
};

const getEdgeId = (
    data: WaldiezNodeAgentSwarmData,
    agentConnections: {
        source: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        target: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    },
) => {
    let edgeId =
        data.nestedChats.length > 0 && data.nestedChats[0].messages.length > 0
            ? data.nestedChats[0].messages[0].id
            : null;
    if (!edgeId) {
        const nonSwarmTargets = agentConnections.target.nodes.filter(node => node.data.agentType !== "swarm");
        const nonSwarmTargetEdges = agentConnections.target.edges.filter(
            edge => edge.type === "swarm" && nonSwarmTargets.some(target => target.id === edge.target),
        );
        edgeId = nonSwarmTargetEdges[0].id;
    }
    return edgeId;
};

const getCondition = (data: WaldiezNodeAgentSwarmData) => {
    const onConditionHandoffsNested = data.handoffs.filter(handoff => {
        if ("targetType" in handoff) {
            return handoff.targetType === "nested_chat";
        }
    });
    return onConditionHandoffsNested.length > 0
        ? (onConditionHandoffsNested[0] as WaldiezSwarmOnCondition).condition
        : "";
};
