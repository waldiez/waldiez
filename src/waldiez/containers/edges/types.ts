/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { EdgeProps } from "@xyflow/react";

import type { WaldiezEdge, WaldiezEdgeType } from "@waldiez/models";

/**
 * WaldiezEdgeProps
 * Represents the properties of a Waldiez edge in the context of a flow.
 * It extends the EdgeProps from xyflow/react and includes a type property.
 * @param type - The type of the edge, which can be one of the predefined WaldiezEdgeType values.
 * @see {@link WaldiezEdgeType}
 */
export type WaldiezEdgeProps = EdgeProps<WaldiezEdge> & {
    type: WaldiezEdgeType;
};
