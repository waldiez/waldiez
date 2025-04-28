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
    const getFlowInfo = useWaldiez(s => s.getFlowInfo);
    const getRfInstance = useWaldiez(s => s.getRfInstance);
    const addAgent = useWaldiez(s => s.addAgent);
    const addEdge = useWaldiez(s => s.addEdge);
    const reselectNode = useWaldiez(s => s.reselectNode);
    const setAgentGroup = useWaldiez(s => s.setAgentGroup);
    const ensureSwarmContainer = useWaldiez(s => s.ensureSwarmContainer);
    const getSwarmAgents = useWaldiez(s => s.getSwarmAgents);
    const getIntersectingParent = (intersectingNodes: Node[], agentType: "manager" | "swarm_container") => {
        let parent: Node | undefined;
        const isIntersectingWithParent = intersectingNodes.some(
            node => node.type === "agent" && node.data.agentType === agentType,
        );
        if (isIntersectingWithParent) {
            const parentNode = intersectingNodes.find(
                node => node.type === "agent" && node.data.agentType === agentType,
            );
            if (parentNode) {
                parent = parentNode;
            }
        }
        return parent;
    };
    const getDroppedAgentParent = (agentType: "manager" | "swarm_container", position: XYPosition) => {
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
            parent = getIntersectingParent(intersectingNodes, agentType);
        }
        return parent;
    };
    const getAgentType = (event: React.DragEvent<HTMLDivElement>) => {
        const nodeTypeData = event.dataTransfer.getData("application/node");
        let agentType: WaldiezNodeAgentType | undefined;
        if (nodeTypeData === "agent") {
            const agentTypeData = event.dataTransfer.getData("application/agent");
            if (
                ["user", "assistant", "manager", "swarm", "rag_user", "reasoning", "captain"].includes(
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
    }, []);
    const addAgentNode = (event: React.DragEvent<HTMLDivElement>, agentType: WaldiezNodeAgentType) => {
        let position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        const parent = getDroppedAgentParent("manager", position);
        if (parent) {
            position = parent.position;
        }
        const newNode = addAgent(agentType, position, parent?.id);
        if (parent) {
            addParentNodeEdge(parent, newNode);
        }
        return newNode;
    };
    const ensureSwarmContainerNode = (event: React.DragEvent<HTMLDivElement>) => {
        const position = screenToFlowPosition({
            x: event.clientX,
            y: event.clientY,
        });
        const { flowId } = getFlowInfo();
        const parent = ensureSwarmContainer(flowId, position);
        return { position, parent };
    };
    const addParentNodeEdge = (parent: Node, newNode: Node) => {
        addEdge(
            {
                source: parent.id,
                target: newNode.id,
                sourceHandle: null,
                targetHandle: null,
            },
            true,
        );
        setTimeout(() => {
            setAgentGroup(newNode.id, parent.id);
        }, 0);
        setTimeout(() => {
            reselectNode(parent.id);
        }, 100);
    };
    const getNewSwarmNodePosition = () => {
        const currentSwarmAgents = getSwarmAgents();
        const newNodePosition = {
            x: 40,
            y: 50,
        };
        if (currentSwarmAgents.length > 0) {
            const lastAgent = currentSwarmAgents[currentSwarmAgents.length - 1];
            newNodePosition.x = lastAgent.position.x + 50;
            newNodePosition.y = lastAgent.position.y + 50;
        }
        return newNodePosition;
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
        return null;
    };
    const getSwarmNodePosition = (event: React.DragEvent<HTMLDivElement>) => {
        const clientX = (event?.clientX as number) || 0;
        const clientY = (event?.clientY as number) || 0;
        const screenPos = screenToFlowPosition({
            x: clientX,
            y: clientY,
        });
        const parent = getDroppedAgentParent("swarm_container", screenPos);
        if (parent) {
            const parentPosition = getParentPosition(parent);
            if (parentPosition) {
                const posX = screenPos.x - parentPosition.x - 50;
                const posY = screenPos.y - parentPosition.y - 50;
                return {
                    x: posX,
                    y: posY,
                };
            }
        }
        return getNewSwarmNodePosition();
    };
    const addSwarmNode = (event: React.DragEvent<HTMLDivElement>, parent: Node) => {
        const newNodePosition = getSwarmNodePosition(event);
        addAgent("swarm", newNodePosition, parent.id);
    };
    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            const agentType = getAgentType(event);
            if (agentType) {
                if (agentType === "swarm") {
                    const { parent } = ensureSwarmContainerNode(event);
                    addSwarmNode(event, parent);
                } else {
                    addAgentNode(event, agentType);
                }
                onNewAgent();
            }
        },
        [screenToFlowPosition],
    );
    return { onDragOver, onDrop };
};
