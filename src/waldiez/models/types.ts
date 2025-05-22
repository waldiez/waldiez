/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */

export type * from "@waldiez/models/Agent/types";
export type * from "@waldiez/models/Chat/types";
export type * from "@waldiez/models/Flow";
export type * from "@waldiez/models/Model/types";
export type * from "@waldiez/models/Stores";
export type * from "@waldiez/models/Tool/types";

/**
 * WaldiezNodeType
 * A react-flow node type.
 * It can be one of the following:
 * @param agent - An agent node.
 * @param model - A model node.
 * @param tool - A tool node.
 */
export type WaldiezNodeType = "agent" | "model" | "tool";
