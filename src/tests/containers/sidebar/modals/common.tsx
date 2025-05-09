/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { render } from "@testing-library/react";

import { ReactFlow, ReactFlowProvider } from "@xyflow/react";

import { edgeTypes, nodeTypes } from "@waldiez/containers/rfTypes";
import { SideBar, SidebarProvider } from "@waldiez/containers/sidebar";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, description, edgesCount, flowId, name, requirements, tags, updatedAt } from "./data";

export const onChange = vi.fn();

export const edges: any[] = [];
for (let i = 0; i < edgesCount; i++) {
    edges.push({
        id: `edge-${i}`,
        source: `node-${i}`,
        target: `node-${i + 1}`,
        type: "chat",
        sourceX: 100 * i,
        sourceY: 100 * i,
        targetX: 200 * i,
        targetY: 200 * i,
        data: {
            label: `Edge ${i}`,
            message: {
                type: i % 2 === 0 ? "string" : "none",
                content: "Message content",
                context: {},
                useCarryover: false,
            },
            summary: {
                type: "lastMsg",
                prompt: "Prompt",
                args: {},
            },
            position: i,
            prerequisites: [],
            order: i > 4 ? (i > 6 ? -2 : -1) : i,
        },
    });
}

const nodes = edges.map((edge, index) => {
    return {
        id: index % 2 === 0 ? edge.source : edge.target,
        type: "agent",
        position: {
            x: edge.sourceX,
            y: edge.sourceY,
        },
        data: {
            label: `Node ${index}`,
            agentType: index % 3 === 0 ? "user_proxy" : "assistant",
            nestedChats: [],
            tools: [],
            modelIds: [],
            functions: [],
        },
    };
});

export const renderFlow = (edgePositions: number[] = [0, 1, 2, 3]) => {
    const storeEdges = edges.map((edge, index) => {
        return {
            ...edge,
            data: {
                ...edge.data,
                position: edgePositions[index % edgePositions.length],
                order: edgePositions[index % edgePositions.length],
            },
        };
    });
    render(
        <WaldiezThemeProvider>
            <ReactFlowProvider>
                <SidebarProvider>
                    <WaldiezProvider
                        flowId={flowId}
                        storageId={flowId}
                        name={name}
                        description={description}
                        tags={tags}
                        requirements={requirements}
                        nodes={nodes}
                        edges={storeEdges}
                        createdAt={createdAt}
                        updatedAt={updatedAt}
                        onChange={onChange}
                    >
                        <div id={`rf-root-${flowId}`}>
                            <div className="flow-main">
                                <SideBar
                                    onSelectNodeType={vi.fn()}
                                    selectedNodeType="agent"
                                    isReadonly={false}
                                />
                                <div className="react-flow-wrapper">
                                    <ReactFlow
                                        id={flowId}
                                        nodesDraggable={false}
                                        nodes={nodes}
                                        edges={storeEdges}
                                        edgeTypes={edgeTypes}
                                        nodeTypes={nodeTypes}
                                    />
                                </div>
                            </div>
                        </div>
                    </WaldiezProvider>
                </SidebarProvider>
            </ReactFlowProvider>
        </WaldiezThemeProvider>,
    );
};
