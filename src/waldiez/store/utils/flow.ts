/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Edge, Node } from "@xyflow/react";

import type { ImportedFlow, ThingsToImport, WaldiezNodeType } from "@waldiez/types";

/**
 * Merges the current and new tags into a single array of unique tags.
 * @param currentTags - The current array of tags.
 * @param newTags - The new array of tags to merge.
 * @returns An array of unique tags.
 */
export const mergeTags: (currentTags: string[], newTags: string[]) => string[] = (currentTags, newTags) => {
    return Array.from(new Set([...currentTags, ...newTags]));
};

/**
 * Merges the current and new requirements into a single array of unique requirements.
 * @param currentRequirements - The current array of requirements.
 * @param newRequirements - The new array of requirements to merge.
 * @returns An array of unique requirements.
 */
export const mergeRequirements: (currentRequirements: string[], newRequirements: string[]) => string[] = (
    currentRequirements,
    newRequirements,
) => {
    return Array.from(new Set([...currentRequirements, ...newRequirements]));
};

/**
 * Merges the current edges with the new edges, ensuring no duplicates and applying animations and visibility.
 * @param allNodes - The list of all nodes in the flow.
 * @param currentEdges - The current edges in the flow.
 * @param newEdges - The new edges to merge into the flow.
 * @returns An array of merged edges with animations and visibility applied.
 */
export const mergeEdges: (allNodes: Node[], currentEdges: Edge[], newEdges: Edge[]) => Edge[] = (
    allNodes,
    currentEdges,
    newEdges,
) => {
    const isEmpty = allNodes.length === 0 && currentEdges.length === 0;
    if (isEmpty) {
        return newEdges.map(edge => {
            const animated = isEdgeAnimated(edge, allNodes);
            const hidden = edge.type === "hidden";
            return { ...edge, animated, hidden };
        });
    }
    const unorderedEdges = newEdges.map(edge => {
        return { ...edge, data: { ...edge.data, order: -1 } } as Edge;
    });
    const nonDuplicateEdges = unorderedEdges.filter(
        edge => !currentEdges.find(currentEdge => currentEdge.id === edge.id),
    );
    return [...currentEdges, ...nonDuplicateEdges].map(edge => {
        const animated = isEdgeAnimated(edge, allNodes);
        const hidden = edge.type === "hidden";
        return { ...edge, animated, hidden };
    });
};

/**
 * Merges the current nodes with the new nodes, ensuring no duplicates and applying visibility based on typeShown.
 * @param currentNodes - The current nodes in the flow.
 * @param newNodes - The new nodes to merge into the flow.
 * @param typeShown - The type of nodes that should be visible.
 * @returns An array of merged nodes with visibility applied based on typeShown.
 */
export const mergeNodes: (currentNodes: Node[], newNodes: Node[], typeShown: WaldiezNodeType) => Node[] = (
    currentNodes,
    newNodes,
    typeShown,
) => {
    const nonDuplicateNodes = newNodes.filter(
        node => !currentNodes.find(currentNode => currentNode.id === node.id),
    );
    return [...currentNodes, ...nonDuplicateNodes].map(node => {
        if (node.type === typeShown) {
            return { ...node, hidden: false };
        }
        return { ...node, hidden: true };
    });
};

/**
 * Merges the current flow name with the new flow name, returning the new name if there are no nodes or edges.
 * @param currentName - The current flow name.
 * @param newName - The new flow name to merge.
 * @param currentNodes - The current nodes in the flow.
 * @param currentEdges - The current edges in the flow.
 * @returns The merged flow name.
 */
export const mergeFlowName = (
    currentName: string,
    newName: string,
    currentNodes: Node[],
    currentEdges: Edge[],
) => {
    if (currentNodes.length === 0 && currentEdges.length === 0) {
        return newName;
    }
    return currentName;
};

/**
 * Merges the current flow description with the new flow description, returning the new description if there are no nodes or edges.
 * @param currentDescription - The current flow description.
 * @param newDescription - The new flow description to merge.
 * @param currentNodes - The current nodes in the flow.
 * @param currentEdges - The current edges in the flow.
 * @returns The merged flow description.
 */
export const mergeFlowDescription = (
    currentDescription: string,
    newDescription: string,
    currentNodes: Node[],
    currentEdges: Edge[],
) => {
    if (currentNodes.length === 0 && currentEdges.length === 0) {
        return newDescription;
    }
    return currentDescription;
};

/**
 * Merges the current flow with the new flow based on the items to import.
 * It either overrides everything or selectively merges properties based on the items.
 * @param items - The items to import, specifying what to override or merge.
 * @param currentFlow - The current flow to merge into.
 * @param newFlow - The new flow to merge from.
 * @param typeShown - The type of nodes that should be visible in the merged flow.
 * @returns The merged flow.
 */
export const loadFlow: (
    items: ThingsToImport,
    currentFlow: ImportedFlow,
    newFlow: ImportedFlow,
    typeShown: WaldiezNodeType,
) => ImportedFlow = (items, currentFlow, newFlow, typeShown) => {
    let mergedFlow: ImportedFlow = items.override ? { ...newFlow, nodes: [], edges: [] } : { ...currentFlow };

    if (items.everything) {
        const mergedNodes = items.override
            ? newFlow.nodes
            : mergeNodes(currentFlow.nodes, newFlow.nodes, typeShown);
        // either override everything or merge everything
        mergedFlow = items.override
            ? newFlow
            : {
                  ...mergedFlow,
                  name: mergeFlowName(currentFlow.name, newFlow.name, currentFlow.nodes, currentFlow.edges),
                  description: mergeFlowDescription(
                      currentFlow.description,
                      newFlow.description,
                      currentFlow.nodes,
                      currentFlow.edges,
                  ),
                  tags: mergeTags(currentFlow.tags, newFlow.tags),
                  requirements: mergeRequirements(currentFlow.requirements, newFlow.requirements),
                  isAsync: newFlow.isAsync ?? currentFlow.isAsync,
                  cacheSeed: newFlow.cacheSeed ?? currentFlow.cacheSeed ?? 42,
                  nodes: mergedNodes,
                  edges: mergeEdges(mergedNodes, currentFlow.edges, newFlow.edges),
              };
    } else {
        selectivelyOverrideOrMergeFlow(items, currentFlow, newFlow, typeShown, mergedFlow);
    }

    return mergedFlow;
};

/**
 * Selectively overrides or merges the flow properties based on the items to import.
 * It updates the merged flow with the new properties from the new flow or current flow.
 * @param items - The items to import, specifying what to override or merge.
 * @param currentFlow - The current flow to merge into.
 * @param newFlow - The new flow to merge from.
 * @param typeShown - The type of nodes that should be visible in the merged flow.
 * @param mergedFlow - The flow being built up with merged properties.
 */
const selectivelyOverrideOrMergeFlow = (
    items: ThingsToImport,
    currentFlow: ImportedFlow,
    newFlow: ImportedFlow,
    typeShown: WaldiezNodeType,
    mergedFlow: ImportedFlow,
) => {
    if (items.name) {
        mergedFlow.name = newFlow.name;
    }
    if (items.description) {
        mergedFlow.description = newFlow.description;
    }
    if (items.tags) {
        mergedFlow.tags = mergeTags(currentFlow.tags, newFlow.tags);
    }
    if (items.requirements) {
        mergedFlow.requirements = mergeRequirements(currentFlow.requirements, newFlow.requirements);
    }
    if (items.isAsync) {
        mergedFlow.isAsync = newFlow.isAsync ?? currentFlow.isAsync;
    }
    if (items.cacheSeed) {
        mergedFlow.cacheSeed = newFlow.cacheSeed ?? currentFlow.cacheSeed ?? 42;
    }
    const itemNodes: Node[] = [...items.nodes.models, ...items.nodes.tools, ...items.nodes.agents];
    const itemNodeIds: string[] = itemNodes.map(node => node.id);
    const newFlowNodesToUse = newFlow.nodes.filter(node => itemNodeIds.includes(node.id));
    const mergedNodes: Node[] = items.override
        ? newFlowNodesToUse
        : mergeNodes(currentFlow.nodes, newFlowNodesToUse, typeShown);
    mergedFlow.nodes = mergedNodes;
    mergedFlow.edges = items.override
        ? newFlow.edges
        : mergeEdges(mergedNodes, currentFlow.edges, newFlow.edges);
};

/**
 * Determines if an edge should be animated based on its type and the nodes it connects.
 * @param edge - The edge to check for animation.
 * @param nodes - The list of all nodes in the flow.
 * @returns True if the edge should be animated, false otherwise.
 */
/* c8 ignore next -- @preserve */
const isEdgeAnimated = (edge: Edge, nodes: Node[]) => {
    if (edge.type === "nested") {
        return true;
    }
    const sourceNode = nodes.find(node => node.id === edge.source);
    const targetNode = nodes.find(node => node.id === edge.target);
    if (!sourceNode || !targetNode) {
        return false;
    }
    return false;
};
