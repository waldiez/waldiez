/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    WaldiezEdgeChat,
    WaldiezEdgeGroup,
    WaldiezEdgeHidden,
    WaldiezEdgeNested,
    WaldiezEdgeSwarm,
} from "@waldiez/containers/edges";
import { WaldiezNodeAgentView, WaldiezNodeModelView, WaldiezNodeSkillView } from "@waldiez/containers/nodes";

export const edgeTypes = {
    chat: WaldiezEdgeChat,
    group: WaldiezEdgeGroup,
    hidden: WaldiezEdgeHidden,
    nested: WaldiezEdgeNested,
    swarm: WaldiezEdgeSwarm,
};

export const nodeTypes = {
    agent: WaldiezNodeAgentView,
    model: WaldiezNodeModelView,
    skill: WaldiezNodeSkillView,
};
