/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { createdAt, edgeData, edgeId, edgeProps, flowId, nodes, updatedAt } from "./data";
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ReactFlow, ReactFlowProvider, applyEdgeChanges } from "@xyflow/react";

import { edgeTypes, nodeTypes } from "@waldiez/containers/rfTypes";
import { WaldiezEdgeType } from "@waldiez/models";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

export const renderEdge = (
    edgeType: WaldiezEdgeType,
    dataOverrides: { [key: string]: any } = {},
    openModal: boolean = true,
    swarmType: "trigger" | "handoff" | "nested" = "trigger",
) => {
    const flowNodes = structuredClone(nodes);
    if (edgeType === "swarm") {
        if (swarmType === "trigger" || swarmType === "handoff") {
            // target: swarm
            flowNodes[1].data = { ...flowNodes[1].data, agentType: "swarm", functions: [] } as any;
        }
        if (swarmType === "handoff" || swarmType === "nested") {
            // source: swarm
            flowNodes[0].data = { ...flowNodes[0].data, agentType: "swarm", functions: [] } as any;
        }
        if (swarmType === "nested") {
            // target: assistant
            flowNodes[1].data = { ...flowNodes[1].data, agentType: "assistant" };
        }
    }
    const edges = [
        {
            id: edgeId,
            source: edgeProps.source,
            target: edgeProps.target,
            hidden: edgeType === "hidden",
            animated: edgeType === "nested" || (edgeType === "swarm" && swarmType === "nested"),
            type: edgeType,
            data: structuredClone({ ...edgeData, ...dataOverrides }),
        },
        {
            id: "edge-2",
            source: edgeProps.target,
            target: edgeProps.source,
            type: "group",
            animated: false,
            hidden: false,
            data: {
                ...edgeData,
            },
        },
    ];

    act(() => {
        render(
            <WaldiezThemeProvider>
                <ReactFlowProvider>
                    <WaldiezProvider
                        flowId={flowId}
                        storageId="test-storage"
                        name="flow name"
                        description="flow description"
                        requirements={[]}
                        tags={[]}
                        nodes={flowNodes}
                        edges={edges}
                        createdAt={createdAt}
                        updatedAt={updatedAt}
                    >
                        <div id={`rf-root-${flowId}`}>
                            <ReactFlow
                                id={flowId}
                                nodesDraggable={false}
                                nodes={flowNodes}
                                edges={edges}
                                edgeTypes={edgeTypes}
                                nodeTypes={nodeTypes}
                                onEdgesChange={changes => applyEdgeChanges(changes, edges)}
                            />
                        </div>
                    </WaldiezProvider>
                </ReactFlowProvider>
            </WaldiezThemeProvider>,
        );
    });
    if (openModal && edgeType !== "hidden") {
        const toGainFocus = screen.getByTestId(`edge-${edgeId}-box`);
        fireEvent.click(toGainFocus);
        const idToClick = `open-edge-modal-${edgeProps.id}`;
        fireEvent.click(screen.getByTestId(idToClick));
        const dialog = screen.getByTestId(`edge-modal-${edgeId}`);
        expect(dialog).not.toBeNull();
        const closeBtn = dialog.querySelector(".modal-close-btn");
        expect(closeBtn).not.toBeNull();
    }
};
