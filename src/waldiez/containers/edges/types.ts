/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { EdgeProps } from "@xyflow/react";

import { WaldiezEdge, WaldiezEdgeType } from "@waldiez/models";

export type WaldiezEdgeProps = EdgeProps<WaldiezEdge> & {
    type: WaldiezEdgeType;
};
