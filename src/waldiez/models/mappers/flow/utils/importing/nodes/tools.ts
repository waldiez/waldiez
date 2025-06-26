/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezTool } from "@waldiez/models";
import { getIdFromJSON } from "@waldiez/models/mappers/common";
import { toolMapper } from "@waldiez/models/mappers/tool";

export const getTools = (json: Record<string, unknown>, nodes: Node[]) => {
    const tools: WaldiezTool[] = [];
    if (!("tools" in json) || !Array.isArray(json.tools)) {
        return tools;
    }
    const jsonTools = json.tools as Record<string, unknown>[];
    nodes.forEach(node => {
        if (node.type === "tool") {
            const toolJson = jsonTools.find(toolJson => {
                return getIdFromJSON(toolJson) === node.id;
            });
            if (toolJson) {
                const nodeExtras = { ...node } as Record<string, unknown>;
                delete nodeExtras.id;
                delete nodeExtras.data;
                delete nodeExtras.type;
                delete nodeExtras.parentId;
                const waldiezTool = toolMapper.importTool({
                    ...toolJson,
                    ...nodeExtras,
                });
                tools.push(waldiezTool);
            }
        }
    });
    return tools;
};
