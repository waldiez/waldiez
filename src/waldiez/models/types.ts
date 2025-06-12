/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeAgent } from "@waldiez/models/Agent/types";
import type { WaldiezEdge } from "@waldiez/models/Chat/types";

export type * from "@waldiez/models/Agent/types";
export type * from "@waldiez/models/Chat/types";
export type * from "@waldiez/models/common";
export type * from "@waldiez/models/Flow";
export type * from "@waldiez/models/Model/types";
export type * from "@waldiez/models/Stores";
export type * from "@waldiez/models/Tool/types";

/**
 * WaldiezAgentConnections
 * Represents the connections of an agent in terms of its source and target nodes.
 * It contains two properties:
 * @param sources - An object containing nodes and edges that the agent is a source for.
 * @param targets - An object containing nodes and edges that the agent is a target for.
 * Each property has the following structure:
 * - nodes: An array of WaldiezNodeAgent objects representing the nodes.
 * - edges: An array of WaldiezEdge objects representing the edges connecting the nodes.
 */
export type WaldiezAgentConnections = {
    sources: {
        nodes: WaldiezNodeAgent[];
        edges: WaldiezEdge[];
    };
    targets: {
        nodes: WaldiezNodeAgent[];
        edges: WaldiezEdge[];
    };
};
/**
 * WaldiezNodeType
 * A react-flow node type.
 * It can be one of the following:
 * @param agent - An agent node.
 * @param model - A model node.
 * @param tool - A tool node.
 */
export type WaldiezNodeType = "agent" | "model" | "tool";
