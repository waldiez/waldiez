/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
/**
 * Get the root div for a specific flow.
 * This function retrieves the root div element for a given flow ID.
 * If the root div is not found and fallbackToBody is true, it returns the document body.
 * @param flowId - The ID of the flow to get the root div for.
 * @param fallbackToBody - Whether to fallback to the document body if the root div is not found.
 * @returns The root div element for the flow, or the document body if not found and fallbackToBody is true.
 */
export const getFlowRoot: (flowId: string, fallbackToBody?: boolean) => HTMLElement | null = (
    flowId: string,
    fallbackToBody = false,
) => {
    let rootDiv = document.getElementById(`rf-root-${flowId}`);
    if (!rootDiv && fallbackToBody) {
        // testing? item not inside rf-root
        rootDiv = document.body;
    }
    return rootDiv;
};
