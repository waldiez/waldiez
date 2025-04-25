/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, NodeChange } from "@xyflow/react";

import { WaldiezNodeType } from "@waldiez/types";

export interface IWaldiezNodeStore {
    onNodesChange: (changes: NodeChange[]) => void;
    showNodes: (nodeType: WaldiezNodeType) => void;
    reselectNode: (id: string) => void;
    onNodeDoubleClick: (event: any, node: Node) => void;
}
