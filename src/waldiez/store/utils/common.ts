/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, ReactFlowInstance } from "@xyflow/react";

import { getFlowRoot } from "@waldiez/utils";

/**
 * Calculates the new position for a node based on the current number of nodes,
 * the flow wrapper dimensions, and the distance between entries.
 * It ensures that nodes are placed in a grid-like layout.
 * @param rfInstance - The React Flow instance to get the zoom level.
 * @param flowWrapper - The HTML element representing the flow area.
 * @param currentNodesCount - The current count of nodes to determine the position.
 * @param entriesDistance - The distance between entries in pixels.
 * @returns An object containing the new x and y coordinates for the node.
 */
const calculateNewNodePosition = (
    rfInstance: ReactFlowInstance | undefined,
    flowWrapper: HTMLElement,
    currentNodesCount: number,
    entriesDistance: number,
) => {
    const zoom = rfInstance?.getZoom() ?? 1;
    const flowWrapperRect = flowWrapper.getBoundingClientRect();
    // take into account the zoom level
    // to calculate the number of nodes per row
    const canvasWidth = flowWrapperRect.width / zoom;
    const maxNodesPerRow = Math.floor(canvasWidth / (entriesDistance * 1.1));
    const x = (currentNodesCount % maxNodesPerRow) * entriesDistance;
    let y = Math.floor(currentNodesCount / maxNodesPerRow) * entriesDistance;
    // if first ROW, add +10 to y to avoid overlapping with the top elements
    if (y === 0) {
        y += 10;
    } else {
        y -= 5;
    }

    return { x, y };
};

/**
 * Gets the new position for a node based on the current nodes count,
 * the flow ID, and the React Flow instance.
 * It calculates the position in a grid-like layout within the flow area.
 * @param currentNodesCount - The current count of nodes to determine the position.
 * @param flowId - The ID of the flow to get the root element.
 * @param rfInstance - The React Flow instance to get the zoom level.
 * @param entriesDistance - The distance between entries in pixels (default is 240).
 * @returns An object containing the new x and y coordinates for the node.
 */
export const getNewNodePosition = (
    currentNodesCount: number,
    flowId: string,
    rfInstance?: ReactFlowInstance,
    entriesDistance: number = 240,
) => {
    const flowRoot = getFlowRoot(flowId);
    if (!flowRoot) {
        return { x: 0, y: 0 };
    }
    // flowRoot includes the sidebar
    // flowWrapper is the actual flow area
    const flowWrapper = flowRoot.querySelector(".react-flow-wrapper");
    if (!flowWrapper) {
        return { x: 0, y: 0 };
    }
    return calculateNewNodePosition(
        rfInstance,
        flowWrapper as HTMLElement,
        currentNodesCount,
        entriesDistance,
    );
};

/**
 * Sets the viewport of the React Flow instance to a specific position.
 * It adjusts the zoom level and sets the top-left corner of the viewport.
 * @param rfInstance - The React Flow instance to set the viewport for.
 */
export const setViewPortTopLeft = (rfInstance?: ReactFlowInstance) => {
    if (rfInstance) {
        const zoom = rfInstance.getZoom();
        rfInstance.setViewport({
            zoom,
            x: 20,
            y: 40,
        });
    }
};

/**
 * Re-arranges nodes in a flow by setting their positions based on the current count of nodes
 * and the specified node type (model or tool). It ensures that nodes of the specified type
 * are placed in a grid-like layout.
 * @param nodes - The list of all nodes in the flow.
 * @param flowId - The ID of the flow to get the root element.
 * @param nodeType - The type of nodes to re-arrange (model or tool).
 * @param rfInstance - The React Flow instance to get the zoom level (optional).
 * @returns An array of nodes with updated positions for the specified node type.
 */
export const reArrangeNodes = (
    nodes: Node[],
    flowId: string,
    nodeType: "model" | "tool",
    rfInstance?: ReactFlowInstance,
) => {
    let nodesAdded = 0;
    const newNodes: Node[] = [];
    nodes.forEach(node => {
        if (node.type === nodeType) {
            const position = getNewNodePosition(nodesAdded, flowId, rfInstance);
            newNodes.push({ ...node, position });
            nodesAdded++;
        } else {
            newNodes.push(node);
        }
    });
    return newNodes;
};
