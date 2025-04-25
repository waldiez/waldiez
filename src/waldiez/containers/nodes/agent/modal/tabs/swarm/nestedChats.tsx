/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentSwarmNestedChatCondition } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/nestedChatCondition";
import { WaldiezAgentSwarmNestedChatsProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";
import {
    WaldiezAgentNestedChat,
    WaldiezNodeAgent,
    WaldiezNodeAgentData,
    WaldiezNodeAgentSwarmData,
} from "@waldiez/models";

const getNestedChats = (
    agentData: WaldiezNodeAgentData,
    agentConnections: { target: { nodes: WaldiezNodeAgent[]; edges: any[] } },
) => {
    const hasNestedChatsConfigured =
        agentData.nestedChats.length > 0 && agentData.nestedChats[0].messages.length > 0;
    const nonSwarmTargets = agentConnections.target.nodes.filter(node => node.data.agentType !== "swarm");
    const nonSwarmTargetEdges = agentConnections.target.edges.filter(
        edge => edge.type === "swarm" && nonSwarmTargets.some(target => target.id === edge.target),
    );
    const nestedChats: WaldiezAgentNestedChat[] = hasNestedChatsConfigured
        ? structuredClone(agentData.nestedChats)
        : [
              {
                  triggeredBy: [],
                  messages: nonSwarmTargetEdges.map(edge => {
                      return { id: edge.id, isReply: false };
                  }),
              },
          ];
    return nestedChats;
};

export const WaldiezAgentSwarmNestedChats = (props: WaldiezAgentSwarmNestedChatsProps) => {
    const { id, flowId, darkMode, agents, data, edges, agentConnections, onDataChange } = props;
    const nonSwarmTargets = agentConnections.target.nodes.filter(node => node.data.agentType !== "swarm");
    const nestedChats = getNestedChats(data, agentConnections);
    const nestedChatMessagesCount = nestedChats.length > 0 ? nestedChats[0].messages.length : 0;
    const onMoveNestedChatUp = (index: number) => {
        const newNestedChats = [...nestedChats];
        const temp = newNestedChats[0].messages[index];
        newNestedChats[0].messages[index] = newNestedChats[0].messages[index - 1];
        newNestedChats[0].messages[index - 1] = temp;
        onDataChange({ nestedChats: [...newNestedChats] });
    };
    const onMoveNestedChatDown = (index: number) => {
        const newNestedChats = [...nestedChats];
        const temp = newNestedChats[0].messages[index];
        newNestedChats[0].messages[index] = newNestedChats[0].messages[index + 1];
        newNestedChats[0].messages[index + 1] = temp;
        onDataChange({ nestedChats: [...newNestedChats] });
    };
    const getRecipientName = (edgeId: string, agents: WaldiezNodeAgent[]) => {
        const edge = edges.find(edge => edge.id === edgeId);
        if (!edge) {
            return "";
        }
        const target = agents.find(agent => agent.id === edge.target);
        if (!target) {
            return "";
        }
        return target.data.label;
    };
    return (
        <div className="agent-panel agent-swarm-nestedChats-panel">
            {nonSwarmTargets.length === 0 ? (
                <div className="agent-no-agents margin-top-10 margin-bottom-10">
                    No nested chat handoffs found for this agent.
                </div>
            ) : (
                <TabItems activeTabIndex={0}>
                    <TabItem label="Queue" id={`wf-${flowId}-agent-swarm-nested-order-${id}`}>
                        <div className="agent-swarm-nestedChat-recipients">
                            <div className="flex-column margin-bottom-10">
                                <label>Chat queue:</label>
                                {nestedChats[0].messages.map((message, index) => (
                                    <div
                                        key={`agent-${id}-nestedChat-recipient-${index}`}
                                        className="agent-swarm-nestedChat-recipient"
                                    >
                                        <div
                                            style={
                                                nestedChatMessagesCount === 1
                                                    ? { marginLeft: -20 }
                                                    : nestedChatMessagesCount === 2
                                                      ? { width: 30 }
                                                      : nestedChatMessagesCount > 2
                                                        ? { width: 60 }
                                                        : {}
                                            }
                                            className="agent-swarm-order-actions margin-right-10"
                                        >
                                            {index > 0 && nestedChatMessagesCount > 1 && (
                                                <button
                                                    type="button"
                                                    title="Move up"
                                                    className="agent-swarm-order-action"
                                                    data-testid={`move-nestedChat-up-button-${index}`}
                                                    onClick={onMoveNestedChatUp.bind(null, index)}
                                                >
                                                    &#x2191;
                                                </button>
                                            )}
                                            {index < nestedChatMessagesCount - 1 && (
                                                <button
                                                    title="Move down"
                                                    type="button"
                                                    className="agent-swarm-order-action"
                                                    data-testid={`move-nestedChat-down-button-${index}`}
                                                    onClick={onMoveNestedChatDown.bind(null, index)}
                                                >
                                                    &#x2193;
                                                </button>
                                            )}
                                        </div>
                                        <div className="agent-nestedChat-recipient-name">
                                            {getRecipientName(message.id, agents)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabItem>
                    <TabItem label="Condition" id={`wf-${flowId}-agent-swarm-nested-condition-${id}`}>
                        <WaldiezAgentSwarmNestedChatCondition
                            data={data as WaldiezNodeAgentSwarmData}
                            agentConnections={agentConnections}
                            onDataChange={onDataChange}
                            flowId={flowId}
                            darkMode={darkMode}
                        />
                    </TabItem>
                </TabItems>
            )}
        </div>
    );
};
