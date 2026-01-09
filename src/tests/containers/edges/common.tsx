/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { act, fireEvent, render, screen } from "@testing-library/react";

import { ReactFlow, ReactFlowProvider, applyEdgeChanges } from "@xyflow/react";

import { edgeTypes, nodeTypes } from "@waldiez/containers/rfTypes";
import type { WaldiezEdgeType } from "@waldiez/models/types";
import { WaldiezProvider } from "@waldiez/store";
import { WaldiezThemeProvider } from "@waldiez/theme";

import { createdAt, edgeData, edgeId, edgeProps, flowId, nodes, updatedAt } from "./data";

export const renderEdge = (
    edgeType: WaldiezEdgeType,
    dataOverrides: { [key: string]: any } = {},
    openModal: boolean = true,
) => {
    const flowNodes = structuredClone(nodes);
    const edges = [
        {
            id: edgeId,
            source: edgeProps.source,
            target: edgeProps.target,
            hidden: edgeType === "hidden",
            animated: edgeType === "nested",
            type: edgeType,
            data: structuredClone({ ...edgeData, ...dataOverrides }),
        },
        {
            id: "edge-2",
            source: edgeProps.target,
            target: edgeProps.source,
            type: "chat",
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
