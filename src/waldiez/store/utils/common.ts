/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, ReactFlowInstance } from "@xyflow/react";

import { getFlowRoot } from "@waldiez/utils";

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

export const reArrangeNodes = (
    nodes: Node[],
    flowId: string,
    nodeType: "model" | "skill",
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
