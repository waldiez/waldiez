/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Connection, Edge, EdgeChange } from "@xyflow/react";

import {
    WaldiezEdge,
    WaldiezEdgeData,
    WaldiezEdgeType,
    WaldiezNodeAgent,
    WaldiezNodeAgentType,
} from "@waldiez/models";

/* eslint-disable tsdoc/syntax */

export interface IWaldiezEdgeStore {
    /**
     * Get the stored edges.
     * @returns An array of edges.
     * @see {@link WaldiezEdge}
     */
    getEdges: () => WaldiezEdge[];
    /**
     * Get a specific edge by its ID.
     * @param id - The ID of the edge.
     * @returns The edge with the specified ID, or undefined if not found.
     * @see {@link WaldiezEdge}
     */
    getEdgeById: (id: string) => WaldiezEdge | undefined;
    /**
     * Add a new edge to the store.
     * @param params - The parameters for the new edge.
     * @param params.flowId - The ID of the flow.
     * @param params.connection - The connection data for the edge.
     * @param params.hidden - Whether the edge is hidden.
     * @returns The newly added edge, or null if not added.
     * @see {@link WaldiezEdge}
     */
    addEdge: (params: { flowId: string; connection: Connection; hidden: boolean }) => WaldiezEdge | null;
    /**
     * Delete a specific edge from the store.
     * @param id - The ID of the edge to delete.
     * @see {@link WaldiezEdge}
     */
    deleteEdge: (id: string) => void;
    /**
     * Callback function to handle edge changes.
     * @param changes - An array of edge changes.
     */
    onEdgesChange: (changes: EdgeChange[]) => void;
    /**
     * Update the data of a specific edge.
     * @param id - The ID of the edge to update.
     * @param data - The new data for the edge.
     * @see {@link WaldiezEdgeData}
     */
    updateEdgeData: (id: string, data: Partial<WaldiezEdgeData>) => void;
    /**
     * Update the path of a specific edge.
     * @param id - The ID of the edge to update.
     * @param agentType - The type of the agent.
     */
    updateEdgePath: (id: string, agentType: WaldiezNodeAgentType) => void;
    /**
     * Get the source agent of a specific edge.
     * @param edge - The edge to get the source agent from.
     * @returns The source agent of the edge, or undefined if not found.
     * @see {@link WaldiezNodeAgent}
     */
    getEdgeSourceAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    /**
     * Get the target agent of a specific edge.
     * @param edge - The edge to get the target agent from.
     * @returns The target agent of the edge, or undefined if not found.
     * @see {@link WaldiezNodeAgent}
     */
    getEdgeTargetAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    /**
     * Update the type of a specific edge.
     * @param id - The ID of the edge to update.
     * @param type - The new type for the edge.
     * @see {@link WaldiezEdgeType}
     */
    updateEdgeType: (id: string, type: WaldiezEdgeType) => void;
    /**
     * Callback function to handle edge double-click events.
     * @param event - The double-click event.
     * @param edge - The edge that was double-clicked.
     */
    onEdgeDoubleClick: (event: React.MouseEvent, edge: WaldiezEdge) => void;
    /**
     * Callback function to handle edge connection events.
     * @param oldEdge - The old edge before the connection.
     * @param newConnection - The new connection data.
     */
    onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
}
