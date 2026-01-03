/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import {
    WaldiezEdgeChat,
    WaldiezEdgeGroup,
    WaldiezEdgeHidden,
    WaldiezEdgeNested,
} from "@waldiez/containers/edges";
import { WaldiezNodeAgentView, WaldiezNodeModelView, WaldiezNodeToolView } from "@waldiez/containers/nodes";

export const edgeTypes = {
    chat: WaldiezEdgeChat,
    hidden: WaldiezEdgeHidden,
    nested: WaldiezEdgeNested,
    group: WaldiezEdgeGroup,
};

export const nodeTypes = {
    agent: WaldiezNodeAgentView,
    model: WaldiezNodeModelView,
    tool: WaldiezNodeToolView,
};
