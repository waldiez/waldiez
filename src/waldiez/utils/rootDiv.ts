/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
export const getFlowRoot = (flowId: string, fallbackToBody = false) => {
    let rootDiv = document.getElementById(`rf-root-${flowId}`);
    if (!rootDiv && fallbackToBody) {
        // testing? item not inside rf-root
        rootDiv = document.body;
    }
    return rootDiv;
};
