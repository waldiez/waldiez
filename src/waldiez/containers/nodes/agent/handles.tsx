/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Handle, OnConnect, Position } from "@xyflow/react";

import { useMemo } from "react";

import { WaldiezNodeAgentType } from "@waldiez/types";

/**
 * Creates connection handles for an agent node based on its type
 * Group managers only have target handles, while other types have both source and target handles
 */
export const useCreateHandles = (
    agentType: WaldiezNodeAgentType,
    id: string,
    handleClassNameBase: string,
    onEdgeConnection: OnConnect,
) => {
    return useMemo(() => {
        const positions = [
            { pos: Position.Top, label: "top" },
            { pos: Position.Bottom, label: "bottom" },
            { pos: Position.Left, label: "left" },
            { pos: Position.Right, label: "right" },
        ];

        // For group managers, only create target handles
        if (agentType === "group_manager") {
            return positions.map(({ pos, label }) => (
                <Handle
                    key={`target-${label}`}
                    className={`${handleClassNameBase}handle ${label} target`}
                    type="target"
                    isConnectableEnd
                    position={pos}
                    onConnect={onEdgeConnection}
                    data-testid={`agent-handle-${label}-target-${id}`}
                    id={`agent-handle-${label}-target-${id}`}
                />
            ));
        }

        // For other types, create both source and target handles with positioning
        const handleStyles = {
            [Position.Top]: { target: { left: "75%" }, source: { left: "25%" } },
            [Position.Bottom]: { target: { left: "25%" }, source: { left: "75%" } },
            [Position.Left]: { target: { top: "25%" }, source: { top: "75%" } },
            [Position.Right]: { target: { top: "75%" }, source: { top: "25%" } },
        };

        return positions.flatMap(({ pos, label }) => [
            <Handle
                key={`target-${label}`}
                className={`${handleClassNameBase}handle ${label} target`}
                type="target"
                isConnectableEnd
                position={pos}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-${label}-target-${id}`}
                id={`agent-handle-${label}-target-${id}`}
                style={handleStyles[pos].target}
            />,
            <Handle
                key={`source-${label}`}
                className={`${handleClassNameBase}handle ${label} source`}
                type="source"
                isConnectableStart
                position={pos}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-${label}-source-${id}`}
                id={`agent-handle-${label}-source-${id}`}
                style={handleStyles[pos].source}
            />,
        ]);
    }, [agentType, id, handleClassNameBase, onEdgeConnection]);
};

// For backward compatibility, keep the original function but make it use the hook internally
export const createHandles = (
    agentType: WaldiezNodeAgentType,
    id: string,
    handleClassNameBase: string,
    onEdgeConnection: OnConnect,
) => {
    // This implementation works without hooks for direct function calls
    const positions = [
        { pos: Position.Top, label: "top" },
        { pos: Position.Bottom, label: "bottom" },
        { pos: Position.Left, label: "left" },
        { pos: Position.Right, label: "right" },
    ];

    // For group managers, only create target handles
    if (agentType === "group_manager") {
        return positions.map(({ pos, label }) => (
            <Handle
                key={`target-${label}`}
                className={`${handleClassNameBase}handle ${label} target`}
                type="target"
                isConnectableEnd
                position={pos}
                onConnect={onEdgeConnection}
                data-testid={`agent-handle-${label}-target-${id}`}
                id={`agent-handle-${label}-target-${id}`}
            />
        ));
    }

    // For other types, create both source and target handles with positioning
    const handleStyles = {
        [Position.Top]: { target: { left: "75%" }, source: { left: "25%" } },
        [Position.Bottom]: { target: { left: "25%" }, source: { left: "75%" } },
        [Position.Left]: { target: { top: "25%" }, source: { top: "75%" } },
        [Position.Right]: { target: { top: "75%" }, source: { top: "25%" } },
    };

    return positions.flatMap(({ pos, label }) => [
        <Handle
            key={`target-${label}`}
            className={`${handleClassNameBase}handle ${label} target`}
            type="target"
            isConnectableEnd
            position={pos}
            onConnect={onEdgeConnection}
            data-testid={`agent-handle-${label}-target-${id}`}
            id={`agent-handle-${label}-target-${id}`}
            style={handleStyles[pos].target}
        />,
        <Handle
            key={`source-${label}`}
            className={`${handleClassNameBase}handle ${label} source`}
            type="source"
            isConnectableStart
            position={pos}
            onConnect={onEdgeConnection}
            data-testid={`agent-handle-${label}-source-${id}`}
            id={`agent-handle-${label}-source-${id}`}
            style={handleStyles[pos].source}
        />,
    ]);
};
