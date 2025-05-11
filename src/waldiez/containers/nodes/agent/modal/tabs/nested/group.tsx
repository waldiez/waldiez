/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { TabItem, TabItems } from "@waldiez/components";
import { WaldiezAgentNestedChat, WaldiezEdge, WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/types";

type WaldiezAgentGroupNestedChatTabsProps = {
    id: string;
    flowId: string;
    darkMode: boolean;
    edges: WaldiezEdge[];
    data: WaldiezNodeAgentData;
    agentConnections: {
        sources: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
        targets: {
            nodes: WaldiezNodeAgent[];
            edges: WaldiezEdge[];
        };
    };
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>, markDirty?: boolean) => void;
};

const getNestedChats = (agentData: WaldiezNodeAgentData, edges: WaldiezEdge[]) => {
    const nestedChats: WaldiezAgentNestedChat[] = [];
    if (agentData.nestedChats.length > 0 && agentData.nestedChats[0].messages.length > 0) {
        nestedChats.push(agentData.nestedChats[0]);
    } else {
        nestedChats.push({
            triggeredBy: [],
            messages: [],
        });
    }
    edges.forEach(edge => {
        // if the id of the edge is not in the nested chat messages, let's add it
        if (
            nestedChats.length > 0 &&
            nestedChats[0].messages.findIndex(message => message.id === edge.id) === -1
        ) {
            nestedChats[0].messages.push({
                id: edge.id,
                isReply: false,
            });
        }
    });
    return structuredClone(nestedChats);
};

export const WaldiezAgentGroupNestedChatTabs: React.FC<WaldiezAgentGroupNestedChatTabsProps> = props => {
    const { id, flowId, agentConnections, data, edges, onDataChange } = props;
    const nestedChats: WaldiezAgentNestedChat[] = getNestedChats(data, edges);
    const nestedChatMessagesCount = nestedChats.length > 0 ? nestedChats[0].messages.length : 0;
    const getRecipientName = (edgeId: string) => {
        const edge = agentConnections.targets.edges.find(edge => edge.id === edgeId);
        if (!edge) {
            return "";
        }
        const target = agentConnections.targets.nodes.find(agent => agent.id === edge.target);
        if (!target) {
            return "";
        }
        return target.data.label;
    };
    const onMoveNestedChatUp = (index: number) => {
        const newNestedChats = [...nestedChats];
        const temp = newNestedChats[0].messages[index];
        newNestedChats[0].messages[index] = newNestedChats[0].messages[index - 1];
        newNestedChats[0].messages[index - 1] = temp;
        onDataChange({ nestedChats: newNestedChats });
    };
    const onMoveNestedChatDown = (index: number) => {
        const newNestedChats = [...nestedChats];
        const temp = newNestedChats[0].messages[index];
        newNestedChats[0].messages[index] = newNestedChats[0].messages[index + 1];
        newNestedChats[0].messages[index + 1] = temp;
        onDataChange({ nestedChats: structuredClone(newNestedChats), handoffs: [] });
    };
    return (
        <div className="agent-panel">
            <TabItems activeTabIndex={0}>
                <TabItem label="Queue" id={`wf-${flowId}-wa-${id}-nested-chats-queue`}>
                    <div className="flex-column margin-10">
                        {nestedChats[0].messages.map((message, index) => (
                            <div
                                key={`agent-${id}-nestedChat-recipient-${index}`}
                                className="flex margin-bottom-10"
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
                                    className="margin-right-10"
                                >
                                    {index > 0 && nestedChatMessagesCount > 1 && (
                                        <button
                                            type="button"
                                            title="Move up"
                                            data-testid={`move-nested-recipient-up-button-${index}`}
                                            onClick={onMoveNestedChatUp.bind(null, index)}
                                        >
                                            &#x2191;
                                        </button>
                                    )}
                                    {index < nestedChatMessagesCount - 1 && (
                                        <button
                                            title="Move down"
                                            type="button"
                                            data-testid={`move-nested-recipient-down-button-${index}`}
                                            onClick={onMoveNestedChatDown.bind(null, index)}
                                        >
                                            &#x2193;
                                        </button>
                                    )}
                                </div>
                                <div className="agent-nested-recipient-name">
                                    {getRecipientName(message.id)}
                                </div>
                            </div>
                        ))}
                    </div>
                </TabItem>
                <TabItem label="Availability" id={`wf-${flowId}-wa-${id}-nested-chat-availability`}>
                    Availability check
                    {/* <ChatAvailability data={edgeData} onDataChange={onEdgeDataChange} /> */}
                </TabItem>
            </TabItems>
        </div>
    );
};
