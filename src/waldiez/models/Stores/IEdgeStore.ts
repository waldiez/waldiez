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

export interface IWaldiezEdgeStore {
    getEdges: () => WaldiezEdge[];
    getEdgeById: (id: string) => WaldiezEdge | undefined;
    deleteEdge: (id: string) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    updateEdgeData: (id: string, data: Partial<WaldiezEdgeData>) => void;
    updateEdgePath: (id: string, agentType: WaldiezNodeAgentType) => void;
    getEdgeSourceAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    getEdgeTargetAgent: (edge: WaldiezEdge) => WaldiezNodeAgent | undefined;
    updateEdgeType: (id: string, type: WaldiezEdgeType) => void;
    addEdge: (params: { flowId: string; connection: Connection; hidden: boolean }) => WaldiezEdge | null;
    onEdgeDoubleClick: (event: React.MouseEvent, edge: WaldiezEdge) => void;
    onReconnect: (oldEdge: Edge, newConnection: Connection) => void;
}
