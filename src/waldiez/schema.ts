/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezFlowData as FlowData, WaldiezFlow } from "@waldiez/types";

/**
 * WaldiezFlowData
 * @param nodes - The nodes of the flow
 * @param edges - The edges of the flow
 * @param viewport - The viewport of the flow
 * @see {@link FlowData}
 */
export type WaldiezFlowData = Omit<FlowData, "nodes" | "edges" | "viewport"> & {
    nodes: object[];
    edges: object[];
    viewport?: object;
};

// noinspection JSUnusedGlobalSymbols
export type WaldiezFlowSchema = Omit<WaldiezFlow, "data"> & {
    data: WaldiezFlowData;
};
