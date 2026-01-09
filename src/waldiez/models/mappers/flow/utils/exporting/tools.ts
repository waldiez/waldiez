/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezNodeTool } from "@waldiez/models/Tool";
import { toolMapper } from "@waldiez/models/mappers/tool";

export const exportTool = (tool: WaldiezNodeTool, nodes: Node[], hideSecrets: boolean) => {
    const waldiezTool = toolMapper.exportTool(tool, hideSecrets) as any;
    const toolNode = nodes.find(node => node.id === tool.id);
    if (toolNode) {
        Object.keys(toolNode).forEach(key => {
            if (!["id", "type", "data"].includes(key)) {
                delete waldiezTool[key];
            }
        });
    }
    return waldiezTool;
};
