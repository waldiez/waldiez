/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, XYPosition, useReactFlow } from "@xyflow/react";

import { useCallback } from "react";

import { WaldiezNodeAgentType } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useDnD = (onNewAgent: () => void) => {
    const { screenToFlowPosition, getIntersectingNodes } = useReactFlow();
    const addAgent = useWaldiez(s => s.addAgent);
    const addEdge = useWaldiez(s => s.addEdge);
    const setAgentGroup = useWaldiez(s => s.setAgentGroup);
    const addGroupMember = useWaldiez(s => s.addGroupMember);
    const getRfInstance = useWaldiez(s => s.getRfInstance);
    const highlightNode = useWaldiez(s => s.highlightNode);
    const clearNodeHighlight = useWaldiez(s => s.clearNodeHighlight);
    const getAgentType = (event: React.DragEvent<HTMLDivElement>) => {
        const nodeTypeData = event.dataTransfer.getData("application/node");
        let agentType: WaldiezNodeAgentType | undefined;
        if (nodeTypeData === "agent") {
            const agentTypeData = event.dataTransfer.getData("application/agent");
            if (
                ["user_proxy", "assistant", "rag_user_proxy", "reasoning", "captain", "manager"].includes(
                    agentTypeData,
                )
            ) {
                agentType = agentTypeData as WaldiezNodeAgentType;
            }
        }
        if (nodeTypeData !== "agent" || !agentType) {
            agentType = undefined;
        }
        return agentType;
    };
    const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        document.body.classList.add("dragging");
    }, []);
    const getIntersectingParent = (intersectingNodes: Node[]) => {
        let parent: Node | undefined;
        const isIntersectingWithParent = intersectingNodes.some(
            node => node.type === "agent" && node.data.agentType === "manager",
        );
        if (isIntersectingWithParent) {
            const parentNode = intersectingNodes.find(
                node => node.type === "agent" && node.data.agentType === "manager",
            );
            if (parentNode) {
                parent = parentNode;
            }
        }
        return parent;
    };
    const getDroppedAgentParent = (position: XYPosition) => {
        let parent: Node | undefined;
        const { x, y } = position;
        const nodeRect = {
            x,
            y,
            width: 100,
            height: 100,
        };
        let intersectingNodes: Node[] = [];
        try {
            intersectingNodes = getIntersectingNodes(nodeRect);
        } catch (_) {
            // testing/no dom: Cannot read properties of undefined (reading 'parentId')
        }
        if (intersectingNodes.length > 0) {
            parent = getIntersectingParent(intersectingNodes);
        }
        return parent;
    };
    const getParentPosition = (parent: Node) => {
        const rfInstance = getRfInstance();
        if (rfInstance) {
            const parentPos = rfInstance.getInternalNode(parent.id);
            if (parentPos) {
                const parentX = parentPos.internals.positionAbsolute.x;
                const parentY = parentPos.internals.positionAbsolute.y;
                return {
                    x: parentX,
                    y: parentY,
                };
            }
        }
        return undefined;
    };
    const getAgentPositionAndParent: (
        event: React.DragEvent<HTMLDivElement> | React.MouseEvent,
        parentNode?: Node,
    ) => {
        position: XYPosition;
        parent: Node | undefined;
    } = (event, parentNode) => {
        let position = screenToFlowPosition(
            {
                x: event.clientX,
                y: event.clientY,
            },
            {
                snapToGrid: false,
            },
        );
        const parent = parentNode || getDroppedAgentParent(position);
        if (parent) {
            const parentPos = getParentPosition(parent);
            if (parentPos) {
                const clientX = (event?.clientX as number) || 0;
                const clientY = (event?.clientY as number) || 0;
                const screenPos = screenToFlowPosition({
                    x: clientX,
                    y: clientY,
                });
                position = {
                    x: screenPos.x - parentPos.x - 50,
                    y: screenPos.y - parentPos.y - 50,
                };
            }
        }
        return { position, parent };
    };
    const addParentNodeEdge = (parent: Node, newNode: Node) => {
        addEdge({ source: parent.id, target: newNode.id, sourceHandle: null, targetHandle: null }, true);
        setTimeout(() => {
            setAgentGroup(newNode.id, parent.id);
        }, 0);
    };
    const addAgentNode = (event: React.DragEvent<HTMLDivElement>, agentType: WaldiezNodeAgentType) => {
        const { position, parent } = getAgentPositionAndParent(event);
        const newNode = addAgent(agentType, position, parent?.id);
        if (parent) {
            newNode.parentId = parent.id;
            addParentNodeEdge(parent, newNode);
        }
        return newNode;
    };
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
        [screenToFlowPosition],
    );
    const getIntersectingGroupManager = (_event: React.MouseEvent, node: Node) => {
        try {
            const intersectingNodes = getIntersectingNodes(node);
            const intersections = intersectingNodes.filter(
                node => node.type === "agent" && node.data.agentType === "manager",
            );
            if (intersections.length === 1) {
                return intersections[0];
            }
        } catch (_) {
            // testing/no dom: Cannot read properties of undefined (reading 'parentId')
        }
        return undefined;
    };
    const onNodeDrag = useCallback((event: React.MouseEvent, node: Node) => {
        if (!node.parentId && node.data.agentType !== "manager") {
            const groupManager = getIntersectingGroupManager(event, node);
            if (groupManager) {
                highlightNode(groupManager.id);
            } else {
                clearNodeHighlight();
            }
        } else {
            clearNodeHighlight();
        }
    }, []);
    const onNodeDragStop = useCallback((event: React.MouseEvent, node: Node) => {
        if (!node.parentId && node.data.agentType !== "manager") {
            const groupManager = getIntersectingGroupManager(event, node);
            if (groupManager) {
                const { position } = getAgentPositionAndParent(event, groupManager);
                addGroupMember(groupManager.id, node.id, position);
                //         const parentPos = getParentPosition(groupManager);
                //         let position: XYPosition | undefined = undefined;
                //         if (parentPos) {
                //             const clientX = (event?.clientX as number) || 0;
                //             const clientY = (event?.clientY as number) || 0;
                //             const screenPos = screenToFlowPosition({
                //                 x: clientX,
                //                 y: clientY,
                //             });
                //             position = {
                //                 x: screenPos.x - parentPos.x - 50,
                //                 y: screenPos.y - parentPos.y - 50,
                //             };
                //         }

                // const intersectingManagers = getIntersectingGroupManagers(event, node);
                // if (intersectingManagers.length === 1) {
                //     const groupManager = intersectingManagers[0];
                //     const parentPos = getParentPosition(groupManager);
                //     let position: XYPosition | undefined = undefined;
                //     if (parentPos) {
                //         const clientX = (event?.clientX as number) || 0;
                //         const clientY = (event?.clientY as number) || 0;
                //         const screenPos = screenToFlowPosition({
                //             x: clientX,
                //             y: clientY,
                //         });
                //         position = {
                //             x: screenPos.x - parentPos.x - 50,
                //             y: screenPos.y - parentPos.y - 50,
                //         };
                //     }
                // addGroupMember(groupManager.id, node.id, position);
            }
        }
        clearNodeHighlight();
    }, []);
    return { onDragOver, onDrop, onNodeDrag, onNodeDragStop };
};
