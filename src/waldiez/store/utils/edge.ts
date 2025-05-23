/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Connection, Edge, MarkerType, Node } from "@xyflow/react";

import { showSnackbar } from "@waldiez/components";
import {
    WaldiezChat,
    WaldiezChatData,
    WaldiezEdge,
    WaldiezEdgeType,
    WaldiezNodeAgentType,
    chatMapper,
} from "@waldiez/models";
import { AGENT_COLORS } from "@waldiez/theme";
import { WaldiezNodeAgent, WaldiezNodeAgentData, typeOfGet, typeOfSet } from "@waldiez/types";
import { getFriendlyString, getId } from "@waldiez/utils";

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

const getNewChatType: (sourceNode: Node, targetNode: Node, hidden: boolean) => WaldiezEdgeType = (
    sourceNode,
    targetNode,
    hidden,
) => {
    if (hidden) {
        return "hidden";
    }
    if (sourceNode.data.agentType === "group_manager" || targetNode.data.agentType === "group_manager") {
        // from/to group manager
        return "group" as WaldiezEdgeType;
    }
    if (sourceNode.data.parentId !== undefined || targetNode.data.parentId !== undefined) {
        // between group members
        return "group" as WaldiezEdgeType;
    }
    return "chat" as WaldiezEdgeType;
};

const isGroupEdge = (sourceNode: Node, targetNode: Node) => {
    // Check if any of the nodes is either a group member or a group manager
    return (
        sourceNode.data.parentId !== undefined ||
        targetNode.data.parentId !== undefined ||
        sourceNode.data.agentType === "group_manager" ||
        targetNode.data.agentType === "group_manager"
    );
};

const shouldNotCreateGroupEdge = (sourceNode: Node, targetNode: Node, allEdges: Edge[], flowId: string) => {
    if (typeof sourceNode.data.agentType !== "string" || typeof targetNode.data.agentType !== "string") {
        showSnackbar({
            flowId,
            message: `Could not create a connection from ${sourceNode.data.label} to ${targetNode.data.label}`,
            level: "warning",
            details: "Invalid agent type",
            withCloseButton: true,
        });
        return true;
    }
    // only user sources to group manager, or group_manager (as source) to other nodes
    if (
        !sourceNode.data.parentId &&
        !["user_proxy", "rag_user_proxy", "group_manager"].includes(sourceNode.data.agentType)
    ) {
        showSnackbar({
            flowId,
            message: `Invalid source agent type: ${getFriendlyString(sourceNode.data.agentType)}`,
            level: "warning",
            details: undefined,
            withCloseButton: true,
        });
        return true;
    }
    // no direct connection from non-group member to group member (only through group manager)
    if (!sourceNode.data.parentId && targetNode.data.parentId) {
        showSnackbar({
            flowId,
            message: "A connection from a non-group member to a group member is not allowed",
            level: "warning",
            details: undefined,
            withCloseButton: true,
        });
        return true;
    }
    // only one edge to group target
    if (targetNode.data.agentType === "group_manager") {
        const edgesWithTheSameTarget = allEdges.filter(edge => edge.target === targetNode.id);
        if (edgesWithTheSameTarget.length > 0) {
            showSnackbar({
                flowId,
                message: "A connection to this group manager already exists",
                level: "warning",
                details: undefined,
                withCloseButton: true,
            });
            return true;
        }
    }
    return false;
};

export const getNewEdge = (params: {
    flowId: string;
    hidden: boolean;
    positionGetter: (chatType: string) => number;
    sourceNode: Node;
    targetNode: Node;
    edges: Edge[];
}) => {
    const { flowId, hidden, positionGetter, sourceNode, targetNode, edges } = params;
    if (isGroupEdge(sourceNode, targetNode)) {
        if (shouldNotCreateGroupEdge(sourceNode, targetNode, edges, flowId)) {
            return null;
        }
    }
    const sourceType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const { chat, chatType } = getNewChat(sourceNode, targetNode, hidden, positionGetter);
    const newEdge = chatMapper.asEdge(chat);
    const color = AGENT_COLORS[sourceType];
    const isFromGroupToOutside = !!sourceNode.data.parentId && !targetNode.data.parentId;
    return {
        ...newEdge,
        type: chatType,
        animated: isFromGroupToOutside,
        selected: true,
        ...edgeCommonStyle(chatType, color),
    };
};

const getNewChat = (
    sourceNode: Node,
    targetNode: Node,
    hidden: boolean,
    positionGetter: (chatType: string) => number,
) => {
    const edgeName = getNewEdgeName(sourceNode, targetNode);
    const sourceType = sourceNode.data.agentType as WaldiezNodeAgentType;
    const targetType = targetNode.data.agentType as WaldiezNodeAgentType;
    const chatData = new WaldiezChatData();
    chatData.source = sourceNode.id;
    chatData.target = targetNode.id;
    chatData.sourceType = sourceType;
    chatData.targetType = targetType;
    chatData.name = edgeName;
    chatData.order = -1;
    const chatType = getNewChatType(sourceNode, targetNode, hidden);
    chatData.position = positionGetter(chatType);
    const chat = new WaldiezChat({
        id: `we-${getId()}`,
        data: chatData,
        rest: {},
    });
    return { chat, chatType };
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

export const getNewHiddenEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "hidden");
};
export const getNewGroupEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "group");
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
    return true;
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
    const agentNodes = get().nodes.filter(node => node.type === "agent");
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
    const newEdges = edges.map(edge => {
        return {
            ...edge,
            data: { ...edge.data, position: 1 },
        };
    });
    const newChatEdges = getNewChatEdges(newEdges);
    const newNestedEdges = getNewNestedEdges(newEdges);
    const newHiddenEdges = getNewHiddenEdges(newEdges);
    const newGroupEdges = getNewGroupEdges(newEdges);
    // ensure no dupe ids
    const allEdges = [...newChatEdges, ...newNestedEdges, ...newHiddenEdges, ...newGroupEdges];
    const edgeIds = allEdges.map(edge => edge.id);
    const uniqueEdgeIds = Array.from(new Set(edgeIds));
    const uniqueEdges = allEdges.filter(edge => uniqueEdgeIds.includes(edge.id));
    set({
        edges: uniqueEdges,
        updatedAt: new Date().toISOString(),
    });
    updateNestedEdges(get, set);
};
