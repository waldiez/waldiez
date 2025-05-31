/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { typeOfGet, typeOfSet } from "@waldiez/store/types";
import { reArrangeNodes } from "@waldiez/store/utils/common";

/**
 * Re-arranges the tool nodes in the flow by updating their positions
 * based on the current number of nodes and the flow's React Flow instance.
 * It updates the state with the new nodes and the current timestamp.
 * @param get - Function to get the current state.
 * @param set - Function to set the new state.
 * @returns The updated nodes after re-arrangement.
 */
export const reArrangeTools = (get: typeOfGet, set: typeOfSet) => {
    const nodes = reArrangeNodes(get().nodes, get().flowId, "tool", get().rfInstance);
    set({
        nodes,
        updatedAt: new Date().toISOString(),
    });
    return nodes;
};
