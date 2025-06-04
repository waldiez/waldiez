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

/**
 * Gets the common style for an edge based on its type and color.
 * @param edgeType - The type of the edge (e.g., "chat", "group").
 * @param color - The color to use for the edge.
 * @returns An object containing the common style properties for the edge.
 */
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
        strokeWidth: 2,
    },
});

/**
 * Retrieves the source and target nodes for a new edge based on their IDs.
 * If either node is not found, it returns null for both nodes.
 * @param allNodes - The list of all nodes in the graph.
 * @param source - The ID of the source node.
 * @param target - The ID of the target node.
 * @returns An object containing the source and target nodes, or null if not found.
 */
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

/**
 * Generates a new edge name based on the labels of the source and target nodes.
 * The labels are truncated to 15 characters to ensure the edge name is concise.
 * @param sourceNode - The source node of the edge.
 * @param targetNode - The target node of the edge.
 * @returns A string representing the new edge name.
 */
export const getNewEdgeName = (sourceNode: Node, targetNode: Node) => {
    const sourceLabel = (sourceNode.data.label as string).slice(0, 15);
    const targetLabel = (targetNode.data.label as string).slice(0, 15);
    const edgeName = `${sourceLabel} => ${targetLabel}`;
    return edgeName;
};

/**
 * Determines the type of a new chat based on the source and target nodes.
 * If the edge is hidden, it returns "hidden".
 * If either node is a group manager, it returns "group".
 * If either node has a parent ID, it also returns "group".
 * Otherwise, it returns "chat".
 * @param sourceNode - The source node of the edge.
 * @param targetNode - The target node of the edge.
 * @param hidden - A boolean indicating if the edge is hidden.
 * @returns The type of the new chat as a WaldiezEdgeType.
 */
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

/**
 * Checks if the edge between two nodes is a group edge.
 * A group edge is defined as an edge where either node is a group member or a group manager.
 * @param sourceNode - The source node of the edge.
 * @param targetNode - The target node of the edge.
 * @returns A boolean indicating whether the edge is a group edge.
 */
const isGroupEdge = (sourceNode: Node, targetNode: Node) => {
    // Check if any of the nodes is either a group member or a group manager
    return (
        sourceNode.data.parentId !== undefined ||
        targetNode.data.parentId !== undefined ||
        sourceNode.data.agentType === "group_manager" ||
        targetNode.data.agentType === "group_manager"
    );
};

/**
 * Checks if a group edge should not be created based on the source and target nodes.
 * It validates the agent types, checks for existing connections, and ensures proper group management rules.
 * @param sourceNode - The source node of the edge.
 * @param targetNode - The target node of the edge.
 * @param allEdges - The list of all edges in the graph.
 * @param flowId - The ID of the flow to show error messages.
 * @returns A boolean indicating whether the group edge should not be created.
 */
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

/**
 * Creates a new edge between two nodes in the flow.
 * It checks if the edge is a group edge and validates it before creating the edge.
 * The edge is styled based on the agent type of the source node and whether it is animated.
 * @param params - An object containing parameters for creating the new edge.
 * @returns A new Edge object or null if the edge should not be created.
 */
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

/**
 * Creates a new chat object based on the source and target nodes.
 * It generates a unique edge name, sets the source and target IDs, and initializes the chat data.
 * The chat type is determined based on the agent types of the source and target nodes.
 * @param sourceNode - The source node of the chat.
 * @param targetNode - The target node of the chat.
 * @param hidden - A boolean indicating if the chat is hidden.
 * @param positionGetter - A function to get the position of the chat based on its type.
 * @returns An object containing the new chat and its type.
 */
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
    chatData.sourceType = sourceType;
    chatData.targetType = targetType;
    chatData.description = `${sourceNode.data.label} to ${targetNode.data.label}`;
    chatData.condition = {
        conditionType: "string_llm",
        prompt: "",
    };
    chatData.name = edgeName;
    chatData.order = -1;
    const chatType = getNewChatType(sourceNode, targetNode, hidden);
    chatData.position = positionGetter(chatType);
    const chat = new WaldiezChat({
        id: `wc-${getId()}`,
        data: chatData,
        type: chatType,
        source: sourceNode.id,
        target: targetNode.id,
        rest: {},
    });
    return { chat, chatType };
};

/**
 * Filters and maps edges of a specific type, assigning a position based on their index.
 * It groups edges by their source node and returns them with updated data.
 * @param allEdges - The list of all edges in the graph.
 * @param type - The type of edges to filter (e.g., "chat", "nested").
 * @returns An array of edges of the specified type with updated positions.
 */
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

/**
 * Retrieves new edges of type "chat" from the provided list of edges.
 * It filters edges based on their type and assigns a position based on their index.
 * @param allEdges - The list of all edges in the graph.
 * @returns An array of edges of type "chat" with updated positions.
 */
export const getNewChatEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "chat");
};

/**
 * Retrieves new edges of type "nested" from the provided list of edges.
 * It filters edges based on their type and assigns a position based on their index.
 * @param allEdges - The list of all edges in the graph.
 * @returns An array of edges of type "nested" with updated positions.
 */
export const getNewNestedEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "nested");
};

/**
 * Retrieves new edges of type "hidden" from the provided list of edges.
 * It filters edges based on their type and assigns a position based on their index.
 * @param allEdges - The list of all edges in the graph.
 * @returns An array of edges of type "hidden" with updated positions.
 */
export const getNewHiddenEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "hidden");
};
/**
 * Retrieves new edges of type "group" from the provided list of edges.
 * It filters edges based on their type and assigns a position based on their index.
 * @param allEdges - The list of all edges in the graph.
 * @returns An array of edges of type "group" with updated positions.
 */
export const getNewGroupEdges = (allEdges: Edge[]) => {
    return getNewChatsOfType(allEdges, "group");
};

/**
 * Resets the edge orders and positions in the flow.
 * It first resets the edge positions, then resets the edge orders.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
export const resetEdgeOrdersAndPositions = (get: typeOfGet, set: typeOfSet) => {
    resetEdgePositions(get, set);
    resetEdgeOrders(get, set);
};

/**
 * Checks if a new connection should be re-established based on the provided connection and nodes.
 * It verifies that both the source and target nodes exist in the provided nodes list.
 * @param newConnection - The new connection to check.
 * @param nodes - The list of all nodes in the graph.
 * @returns A boolean indicating whether the connection should be re-established.
 */
export const shouldReconnect = (newConnection: Connection, nodes: Node[]): boolean => {
    const newTarget = nodes.find(node => node.id === newConnection.target);
    const newSource = nodes.find(node => node.id === newConnection.source);
    if (!newSource || !newTarget) {
        return false;
    }
    return true;
};

/**
 * Retrieves properties of a new edge connection based on the old edge, new connection, and nodes.
 * It finds the old source and target nodes, as well as the new source and target nodes,
 * and assigns a color based on the agent type of the new source node.
 * @param oldEdge - The old edge to base the connection on.
 * @param newConnection - The new connection to establish.
 * @param nodes - The list of all nodes in the graph.
 * @returns An object containing the old and new source and target nodes, and the color for the new edge.
 */
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

/**
 * Updates the nested edges in the flow based on the agent nodes and their nested chats.
 * It filters the edges to find those that are nested and updates their positions accordingly.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
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

/**
 * Resets the edge orders synchronously by setting the order based on their index.
 * If the edge's data.order is less than 0, it leaves it as is.
 * Otherwise, it starts counting from 0.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
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

/**
 * Resets the edge orders asynchronously by recalculating the order based on prerequisites.
 * It filters edges that have a valid order and prerequisites, then updates their orders accordingly.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
const resetAsyncEdgeOrders = (get: typeOfGet, set: typeOfSet) => {
    const usedEdges = (get().edges as WaldiezEdge[]).filter(
        edge => edge.data?.order !== undefined && edge.data.order >= 0,
    );
    resetEdgePrerequisites(usedEdges, get, set);
};

/**
 * Resets the prerequisites of edges and recalculates their orders based on the prerequisites.
 * It updates the edges' data with new orders and clears prerequisites for edges that are not used.
 * @param edges - The list of edges to reset.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
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

/**
 * Resets the edge orders based on whether the flow is asynchronous or synchronous.
 * It calls the appropriate reset function based on the isAsync flag in the state.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
const resetEdgeOrders: (get: typeOfGet, set: typeOfSet) => void = (get, set) => {
    const isAsync = get().isAsync;
    isAsync === true ? resetAsyncEdgeOrders(get, set) : resetSyncEdgeOrders(get, set);
};

/**
 * Resets the edge positions in the flow.
 * It updates the positions of all edges to 1 and recalculates the new edges based on their types.
 * It ensures no duplicate edge IDs and updates the state with the new edges.
 * @param get - The function to get the current state.
 * @param set - The function to set the new state.
 */
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
