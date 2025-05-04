/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdgeChat, WaldiezEdgeHidden, WaldiezEdgeNested } from "@waldiez/containers/edges";
import { WaldiezNodeAgentView, WaldiezNodeModelView, WaldiezNodeSkillView } from "@waldiez/containers/nodes";

export const edgeTypes = {
    chat: WaldiezEdgeChat,
    hidden: WaldiezEdgeHidden,
    nested: WaldiezEdgeNested,
};

export const nodeTypes = {
    agent: WaldiezNodeAgentView,
    model: WaldiezNodeModelView,
    skill: WaldiezNodeSkillView,
};
