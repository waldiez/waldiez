/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Connection, Edge, MarkerType, Node } from "@xyflow/react";

import { WaldiezEdge, chatMapper } from "@waldiez/models";
import { WaldiezChat, WaldiezChatData, WaldiezEdgeType, WaldiezNodeAgentType } from "@waldiez/models";
import { AGENT_COLORS } from "@waldiez/theme";
import { WaldiezNodeAgent, WaldiezNodeAgentData, typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

export const edgeCommonStyle = (edgeType: WaldiezEdgeType, color: string) => ({
    markerEnd:
        edgeType !== "nested"
            ? {
                  type: MarkerType.ArrowClosed,
                  color,
                  width: 10,
                  height: 10,
              }
            : undefined,
    style: {
        stroke: color,
        strokeWidth: 3,
    },
});

export const getNewEdgeNodes = (allNodes: Node[], source: string, target: string) => {
    const sourceNode = allNodes.find(node => node.id === source);
    if (!sourceNode) {
        // throw new Error(`Source node with id ${source} not found`);
        return { sourceNode: null, targetNode: null };
    }
    const targetNode = allNodes.find(node => node.id === target);
    if (!targetNode) {
        // throw new Error(`Target node with id ${target} not found`);
        return { sourceNode: null, targetNode: null };
    }
    return {
        sourceNode,
        targetNode,
    };
};
export const getNewEdgeName = (sourceNode: Node, targetNode: Node) => {
    const sourceLabel = (sourceNode.data.label as string).slice(0, 15);
    const targetLabel = (targetNode.data.label as string).slice(0, 15);
    const edgeName = `${sourceLabel} => ${targetLabel}`;
    return edgeName;
};

const isSwarmEdge = (sourceNode: Node, targetNode: Node) => {
    const sourceAgentType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const targetAgentType = targetNode.data.agentType as WaldiezNodeAgentType;
    if (sourceAgentType === "swarm") {
        return true;
    }
    if (["user", "rag_user"].includes(sourceAgentType) && targetAgentType === "swarm") {
        return true;
    }
    return false;
};

const getNewChatType: (sourceNode: Node, targetNode: Node, hidden: boolean) => WaldiezEdgeType = (
    sourceNode,
    targetNode,
    hidden,
) => {
    if (hidden) {
        return "hidden" as WaldiezEdgeType;
    }
    if (isSwarmEdge(sourceNode, targetNode)) {
        return "swarm" as WaldiezEdgeType;
    }
    const sourceAgentType = sourceNode.data.agentType as WaldiezNodeAgentType;
    let chatType: WaldiezEdgeType = sourceAgentType === "manager" ? "group" : "chat";
    if (targetNode.data.parentId) {
        chatType = "hidden";
    }
    return chatType;
};

const getSwarmEdge = (
    edges: Edge[],
    sourceNode: Node,
    targetNode: Node,
    positionGetter: (chatType: string) => number,
) => {
    // if the source is not swarm, it should not connect to any other node
    if (sourceNode.data.agentType !== "swarm") {
        const existing = edges.find(edge => edge.source === sourceNode.id);
        if (existing) {
            return null;
        }
    }
    const chatData = getSwarmChatData(sourceNode, targetNode, positionGetter);
    chatData.position = positionGetter("swarm");
    const chat = new WaldiezChat({
        id: `we-${getId()}`,
        data: chatData,
        rest: {},
    });
    const newEdge = chatMapper.asEdge(chat);
    const animated = sourceNode.data.agentType === "swarm" && targetNode.data.agentType !== "swarm";
    let color = AGENT_COLORS.swarm;
    if (sourceNode.data.agentType !== "swarm") {
        color = AGENT_COLORS[sourceNode.data.agentType as WaldiezNodeAgentType];
    }
    return {
        ...newEdge,
        type: "swarm",
        animated,
        selected: true,
        ...edgeCommonStyle("swarm", color),
    };
};

const getSwarmChatData = (
    sourceNode: Node,
    targetNode: Node,
    positionGetter: (chatType: string) => number,
) => {
    // const edgeName = getNewEdgeName(sourceNode, targetNode);
    const sourceAgentType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const targetAgentType = targetNode.data.agentType as WaldiezNodeAgentType;
    const source = sourceNode.id;
    const target = targetNode.id;
    const chatData = new WaldiezChatData();
    chatData.source = source;
    chatData.target = target;
    chatData.name = getNewEdgeName(sourceNode, targetNode);
    chatData.description = `Transfer to ${targetNode.data.label}`;
    chatData.order = -1;
    chatData.position = positionGetter("swarm");
    if (sourceAgentType !== "swarm") {
        chatData.message = {
            type: "string",
            content: "Start the chat",
            context: {},
            use_carryover: false,
        };
    }
    if (targetAgentType !== "swarm") {
        // nested chat
        chatData.nestedChat = {
            message: {
                type: "string",
                content: "",
                context: {},
                use_carryover: false,
            },
            reply: {
                type: "none",
                content: "",
                context: {},
                use_carryover: false,
            },
        };
    }
    return chatData;
};

export const getNewEdge = (
    hidden: boolean,
    positionGetter: (chatType: string) => number,
    sourceNode: Node,
    targetNode: Node,
    edges: Edge[],
) => {
    if (isSwarmEdge(sourceNode, targetNode)) {
        return getSwarmEdge(edges, sourceNode, targetNode, positionGetter);
    }
    if (["swarm", "swarm_container"].includes(targetNode.data.agentType as WaldiezNodeAgentType)) {
        return null;
    }
    const edgeName = getNewEdgeName(sourceNode, targetNode);
    const chatData = new WaldiezChatData();
    chatData.source = sourceNode.id;
    chatData.target = targetNode.id;
    chatData.name = edgeName;
    chatData.order = -1;
    const chatType = getNewChatType(sourceNode, targetNode, hidden);
    chatData.position = positionGetter(chatType);
    const chat = new WaldiezChat({
        id: `we-${getId()}`,
        data: chatData,
        rest: {},
    });
    const agentType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const newEdge = chatMapper.asEdge(chat);
    const color = AGENT_COLORS[agentType];
    return {
        ...newEdge,
        type: chatType,
        animated: false,
        selected: true,
        ...edgeCommonStyle(chatType, color),
    };
};

const getNewChatsOfType = (allEdges: Edge[], type: string) => {
    const edgesOfType = allEdges.filter(edge => edge.type === type);
    const edgesOfTypeBySource: { [source: string]: Edge[] } = {};
    edgesOfType.forEach(edge => {
        if (!edgesOfTypeBySource[edge.source]) {
            edgesOfTypeBySource[edge.source] = [];
        }
        edgesOfTypeBySource[edge.source].push(edge);
    });
    return edgesOfType.map((edge, index) => {
        return {
            ...edge,
            data: { ...edge.data, position: index + 1 },
        };
    });
};

export const getNewChatEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "chat");
};

export const getNewNestedEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "nested");
};

export const getNewGroupEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "group");
};

export const getNewHiddenEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "hidden");
};
export const resetEdgeOrdersAndPositions = (get: typeOfGet, set: typeOfSet) => {
    resetEdgePositions(get, set);
    resetEdgeOrders(get, set);
};
export const shouldReconnect = (newConnection: Connection, nodes: Node[]): boolean => {
    const newTarget = nodes.find(node => node.id === newConnection.target);
    const newSource = nodes.find(node => node.id === newConnection.source);
    if (!newSource || !newTarget) {
        return false;
    }
    const isSourceSwarmAgent = newSource.data.agentType === "swarm";
    const isTargetSwarmAgent = newTarget.data.agentType === "swarm";
    // if not a swarm connection, allow reconnect
    if (!isSourceSwarmAgent && !isTargetSwarmAgent) {
        return true;
    }
    if (isSourceSwarmAgent && ["swarm", "assistant"].includes(newTarget.data.agentType as string)) {
        return true;
    }
    // if the source is not a swarm agent, but the target is,
    // only allow user/rag_user to connect to swarm
    if (!isSourceSwarmAgent && isTargetSwarmAgent) {
        return ["user", "rag_user"].includes(newSource.data.agentType as string);
    }
    // if both are swarm agents, allow reconnect
    return isSourceSwarmAgent && isTargetSwarmAgent;
};
export const getNewEdgeConnectionProps = (
    oldEdge: Edge,
    newConnection: Connection,
    nodes: Node[],
): {
    oldSourceNode: WaldiezNodeAgent | undefined;
    oldTargetNode: WaldiezNodeAgent | undefined;
    newSourceNode: WaldiezNodeAgent | undefined;
    newTargetNode: WaldiezNodeAgent | undefined;
    color: string | undefined;
} => {
    let oldSourceNode: WaldiezNodeAgent | undefined;
    let oldTargetNode: WaldiezNodeAgent | undefined;
    let newSourceNode: WaldiezNodeAgent | undefined;
    let newTargetNode: WaldiezNodeAgent | undefined;
    let color: string | undefined;
    for (const node of nodes) {
        if (node.id === oldEdge.source) {
            oldSourceNode = node as WaldiezNodeAgent;
        }
        if (node.id === oldEdge.target) {
            oldTargetNode = node as WaldiezNodeAgent;
        }
        if (node.id === newConnection.source) {
            newSourceNode = node as WaldiezNodeAgent;
            color = AGENT_COLORS[newSourceNode.data.agentType];
        }
        if (node.id === newConnection.target) {
            newTargetNode = node as WaldiezNodeAgent;
        }
        if (oldSourceNode && oldTargetNode && newSourceNode && newTargetNode) {
            break;
        }
    }
    return {
        oldSourceNode,
        oldTargetNode,
        newSourceNode,
        newTargetNode,
        color,
    };
};
const updateNestedEdges = (get: typeOfGet, set: typeOfSet) => {
    const agentNodes = get().nodes.filter(node => node.type === "agent" && node.data.agentType !== "manager");
    const nestedEdges: Edge[] = [];
    const nestedEdgeIds: string[] = [];
    agentNodes.forEach(agentNode => {
        const nestedChats = (agentNode.data as WaldiezNodeAgentData).nestedChats ?? [];
        nestedChats.forEach(nestedChat => {
            const messages = nestedChat.messages;
            let edgeIndex = 0;
            messages.forEach(message => {
                const edge = get().edges.find(edge => edge.id === message.id);
                // only if nested chat
                // and if not already added (in case a message is registered both as a reply and not)
                if (edge && edge.type === "nested" && !nestedEdgeIds.includes(edge.id)) {
                    nestedEdges.push({
                        ...edge,
                        data: { ...edge.data, position: edgeIndex + 1 },
                    });
                    nestedEdgeIds.push(edge.id);
                    edgeIndex++;
                }
            });
        });
    });
    const otherEdges = get().edges.filter(edge => !nestedEdgeIds.includes(edge.id));
    set({
        edges: [...otherEdges, ...nestedEdges],
        updatedAt: new Date().toISOString(),
    });
};

const resetSyncEdgeOrders: (get: typeOfGet, set: typeOfSet) => void = (get, set) => {
    // if the edge.data.order is < 0, leave it as is
    // else start counting from 0
    const edges = get().edges as WaldiezEdge[];
    const newEdges = edges.map((edge, index) => {
        let edgeOrder = edge.data?.order;
        if (edgeOrder === undefined) {
            edgeOrder = -1;
        }
        return {
            ...edge,
            data: { ...edge.data, order: edgeOrder < 0 ? edgeOrder : index },
        };
    });
    set({
        edges: newEdges,
        updatedAt: new Date().toISOString(),
    });
};
const resetAsyncEdgeOrders = (get: typeOfGet, set: typeOfSet) => {
    const usedEdges = (get().edges as WaldiezEdge[]).filter(
        edge => edge.data?.order !== undefined && edge.data.order >= 0,
    );
    resetEdgePrerequisites(usedEdges, get, set);
};
export const resetEdgePrerequisites: (edges: WaldiezEdge[], get: typeOfGet, set: typeOfSet) => void = (
    edges,
    get,
    set,
) => {
    const updatedAt = new Date().toISOString();
    // const allEdges = get().edges as WaldiezEdge[];
    // const usedEdges = allEdges.filter(edge => edge.data?.order !== undefined && edge.data.order >= 0);
    // these edges should have order >= 0, and prerequisites a list of ids (could be empty)
    // all the other edges should have order = -1 and prerequisites = []
    // the order should be determined based on (and after setting) the prerequisites (of all affected edges)
    const edgesMap = new Map<string, WaldiezEdge>(edges.map(edge => [edge.id, edge]));
    const computeOrder = (edge: WaldiezEdge): number => {
        if (!edge.data || !edge.data.prerequisites || edge.data.prerequisites.length === 0) {
            return 0;
        }
        return (
            Math.max(
                ...edge.data.prerequisites.map(id => {
                    const edge = edges.find(e => e.id === id);
                    return edge?.data?.order ?? 0;
                }),
            ) + 1
        );
    };
    // Process until no changes occur
    let changed = true;
    while (changed) {
        changed = false;
        for (const edge of edges) {
            const newOrder = computeOrder(edge);
            if (edgesMap.get(edge.id)!.data?.order !== newOrder) {
                edgesMap.get(edge.id)!.data!.order = newOrder;
                changed = true;
            }
        }
    }
    const updatedEdges = Array.from(edgesMap.values());
    const remainingEdges = get()
        .edges.filter(edge => !updatedEdges.find(e => e.id === edge.id))
        .map(edge => {
            return {
                ...edge,
                data: { ...edge.data, order: -1, prerequisites: [] },
            };
        });
    set({
        edges: [...updatedEdges, ...remainingEdges],
        updatedAt,
    });
};
const resetEdgeOrders: (get: typeOfGet, set: typeOfSet) => void = (get, set) => {
    const isAsync = get().isAsync;
    isAsync === true ? resetAsyncEdgeOrders(get, set) : resetSyncEdgeOrders(get, set);
};
const resetEdgePositions = (get: typeOfGet, set: typeOfSet) => {
    const edges = get().edges as WaldiezEdge[];
    const swarmEdges = edges.filter(edge => edge.type === "swarm");
    const newEdges = edges.map(edge => {
        return {
            ...edge,
            data: { ...edge.data, position: 1 },
        };
    });
    const newChatEdges = getNewChatEdges(newEdges);
    const newNestedEdges = getNewNestedEdges(newEdges);
    const newGroupEdges = getNewGroupEdges(newEdges);
    const newHiddenEdges = getNewHiddenEdges(newEdges);
    // ensure no dupe ids
    const allEdges = [...newChatEdges, ...newNestedEdges, ...newGroupEdges, ...newHiddenEdges, ...swarmEdges];
    const edgeIds = allEdges.map(edge => edge.id);
    const uniqueEdgeIds = Array.from(new Set(edgeIds));
    const uniqueEdges = allEdges.filter(edge => uniqueEdgeIds.includes(edge.id));
    set({
        edges: uniqueEdges,
        updatedAt: new Date().toISOString(),
    });
    updateNestedEdges(get, set);
};
