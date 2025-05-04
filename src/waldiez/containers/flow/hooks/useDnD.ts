/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useReactFlow } from "@xyflow/react";

import { useCallback } from "react";

import { WaldiezNodeAgentType } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useDnD = (onNewAgent: () => void) => {
    const { screenToFlowPosition } = useReactFlow();
    const addAgent = useWaldiez(s => s.addAgent);
    const getAgentType = (event: React.DragEvent<HTMLDivElement>) => {
        const nodeTypeData = event.dataTransfer.getData("application/node");
        let agentType: WaldiezNodeAgentType | undefined;
        if (nodeTypeData === "agent") {
            const agentTypeData = event.dataTransfer.getData("application/agent");
            if (["user", "assistant", "rag_user", "reasoning", "captain"].includes(agentTypeData)) {
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
    const getAgentPositionAndParent = (event: React.DragEvent<HTMLDivElement>) => {
        const position = screenToFlowPosition(
            {
                x: event.clientX,
                y: event.clientY,
            },
            {
                snapToGrid: false,
            },
        );
        return { position };
    };
    const addAgentNode = (event: React.DragEvent<HTMLDivElement>, agentType: WaldiezNodeAgentType) => {
        const { position } = getAgentPositionAndParent(event);
        const newNode = addAgent(agentType, position, undefined);
        return newNode;
    };
    const onDrop = useCallback(
        (event: React.DragEvent<HTMLDivElement>) => {
            const agentType = getAgentType(event);
            if (agentType) {
                event.preventDefault();
                addAgentNode(event, agentType);
                onNewAgent();
            }
        },
        [screenToFlowPosition],
    );
    return { onDragOver, onDrop };
};
