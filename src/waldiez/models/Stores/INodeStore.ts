/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node, NodeChange } from "@xyflow/react";

import type { WaldiezNodeType } from "@waldiez/types";

export interface IWaldiezNodeStore {
    /**
     * Callback function to handle node changes.
     * @param changes - An array of node changes.
     */
    onNodesChange: (changes: NodeChange[]) => void;
    /**
     * Show nodes of a specific type. (hide the others)
     * @param nodeType - The type of the nodes to show.
     * @see {@link WaldiezNodeType}
     */
    showNodes: (nodeType: WaldiezNodeType) => void;
    /**
     * Re select a node by its ID.
     * @param id - The ID of the node to reselect.
     */
    reselectNode: (id: string) => void;
    /**
     * Callback function to handle node double-click events.
     * @param event - The double-click event.
     * @param node - The node that was double-clicked.
     */
    onNodeDoubleClick: (event: any, node: Node) => void;
    /**
     * Highlight a node by its ID.
     * @param id - The ID of the node to highlight.
     */
    highlightNode: (id: string) => void;
    /**
     * Get the highlighted node.
     * @returns The highlighted node, or null if no node is highlighted.
     */
    clearNodeHighlight: () => void;
}
