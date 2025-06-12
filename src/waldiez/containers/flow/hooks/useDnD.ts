/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, XYPosition, useReactFlow } from "@xyflow/react";

import { useCallback, useMemo } from "react";

import { ValidAgentTypes, WaldiezNodeAgentType } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for handling drag and drop operations in the flow
 */
export const useDnD = (onNewAgent: () => void) => {
    // Get flow utilities and state management functions
    const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();
    const addAgent = useWaldiez(s => s.addAgent);
    const setAgentGroup = useWaldiez(s => s.setAgentGroup);
    const addGroupMember = useWaldiez(s => s.addGroupMember);
    const getRfInstance = useWaldiez(s => s.getRfInstance);
    const highlightNode = useWaldiez(s => s.highlightNode);
    const clearNodeHighlight = useWaldiez(s => s.clearNodeHighlight);

    /**
     * Extract agent type from drag event data
     */
    const getAgentType = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        const nodeTypeData = event.dataTransfer.getData("application/node");

        if (nodeTypeData !== "agent") {
            return undefined;
        }

        const agentTypeData = event.dataTransfer.getData("application/agent");

        if (ValidAgentTypes.includes(agentTypeData)) {
            return agentTypeData as WaldiezNodeAgentType;
        }

        return undefined;
    }, []);

    /**
     * Handle drag over events
     */
    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        document.body.classList.add("dragging");
    }, []);

    /**
     * Find a group manager node that intersects with the given nodes
     */
    const getIntersectingParent = useCallback((intersectingNodes: Node[]) => {
        return intersectingNodes.find(
            node => node.type === "agent" && node.data.agentType === "group_manager",
        );
    }, []);

    /**
     * Find a parent node at the given position
     */
    const getDroppedAgentParent = useCallback(
        (position: XYPosition) => {
            const { x, y } = position;
            const nodeRect = { x, y, width: 100, height: 100 };

            try {
                const intersectingNodes = getIntersectingNodes(nodeRect);
                if (intersectingNodes.length > 0) {
                    return getIntersectingParent(intersectingNodes);
                }
            } catch (_) {
                // testing/no dom: Cannot read properties of undefined (reading 'parentId')
            }

            return undefined;
        },
        [getIntersectingNodes, getIntersectingParent],
    );

    /**
     * Get absolute position of a parent node
     */
    const getParentPosition = useCallback(
        (parent: Node) => {
            const rfInstance = getRfInstance();

            if (!rfInstance) {
                return undefined;
            }

            const parentPos = rfInstance.getInternalNode(parent.id);

            if (parentPos?.internals.positionAbsolute) {
                return {
                    x: parentPos.internals.positionAbsolute.x,
                    y: parentPos.internals.positionAbsolute.y,
                };
            }

            return undefined;
        },
        [getRfInstance],
    );

    /**
     * Calculate position and find parent for a dragged element
     */
    const getAgentPositionAndParent = useCallback(
        (event: React.DragEvent<HTMLDivElement> | React.MouseEvent, parentNode?: Node) => {
            // Convert screen coordinates to flow coordinates
            let position = screenToFlowPosition(
                {
                    x: event.clientX,
                    y: event.clientY,
                },
                {
                    snapToGrid: false,
                },
            );

            // Find parent node if not provided
            const parent = parentNode || getDroppedAgentParent(position);

            // Adjust position relative to parent if needed
            if (parent) {
                const parentPos = getParentPosition(parent);

                if (parentPos) {
                    const screenPos = screenToFlowPosition({
                        x: event.clientX,
                        y: event.clientY,
                    });

                    position = {
                        x: screenPos.x - parentPos.x - 50,
                        y: screenPos.y - parentPos.y - 50,
                    };
                }
            }

            return { position, parent };
        },
        [screenToFlowPosition, getDroppedAgentParent, getParentPosition],
    );

    /**
     * Add a new agent node at the drop position
     */
    const addAgentNode = useCallback(
        (event: React.DragEvent<HTMLDivElement>, agentType: WaldiezNodeAgentType) => {
            const { position, parent } = getAgentPositionAndParent(event);
            const newNode = addAgent(agentType, position, parent?.id);

            if (parent) {
                newNode.parentId = parent.id;
                newNode.data.parentId = parent.id;

                // Use a more reliable approach than setTimeout
                window.requestAnimationFrame(() => {
                    setAgentGroup(newNode.id, parent.id);
                });
            }

            return newNode;
        },
        [getAgentPositionAndParent, addAgent, setAgentGroup],
    );

    /**
     * Handle drop events
     */
    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            document.body.classList.remove("dragging");
            const agentType = getAgentType(event);

            if (agentType) {
                event.preventDefault();
                addAgentNode(event, agentType);
                onNewAgent();
            }
        },
        [getAgentType, addAgentNode, onNewAgent],
    );

    /**
     * Find an intersecting group manager for a dragged node
     */
    const getIntersectingGroupManager = useCallback(
        (_event: React.MouseEvent, node: Node) => {
            try {
                const intersectingNodes = getIntersectingNodes(node);
                const intersections = intersectingNodes.filter(
                    node => node.type === "agent" && node.data.agentType === "group_manager",
                );

                if (intersections.length === 1) {
                    return intersections[0];
                }
            } catch (_) {
                // testing/no dom: Cannot read properties of undefined (reading 'parentId')
            }

            return undefined;
        },
        [getIntersectingNodes],
    );

    /**
     * Handle node drag events
     */
    const onNodeDrag = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (!node.parentId && node.data.agentType !== "group_manager") {
                const groupManager = getIntersectingGroupManager(event, node);

                if (groupManager) {
                    highlightNode(groupManager.id);
                } else {
                    clearNodeHighlight();
                }
            } else {
                clearNodeHighlight();
            }
        },
        [getIntersectingGroupManager, highlightNode, clearNodeHighlight],
    );

    /**
     * Handle node drag stop events
     */
    const onNodeDragStop = useCallback(
        (event: React.MouseEvent, node: Node) => {
            if (!node.parentId && node.data.agentType !== "group_manager") {
                const groupManager = getIntersectingGroupManager(event, node);

                if (groupManager) {
                    const { position } = getAgentPositionAndParent(event, groupManager);
                    addGroupMember(groupManager.id, node.id, position);
                }
            }

            clearNodeHighlight();
        },
        [getIntersectingGroupManager, getAgentPositionAndParent, addGroupMember, clearNodeHighlight],
    );

    // Return the memoized handlers
    return useMemo(
        () => ({
            onDragOver,
            onDrop,
            onNodeDrag,
            onNodeDragStop,
        }),
        [onDragOver, onDrop, onNodeDrag, onNodeDragStop],
    );
};
