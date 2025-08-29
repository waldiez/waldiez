/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

import type { WaldiezNodeModel } from "@waldiez/models";
import { modelMapper } from "@waldiez/models/mappers/model";

export const exportModel = (model: WaldiezNodeModel, nodes: Node[], hideSecrets: boolean) => {
    const waldiezModel = modelMapper.exportModel(model, hideSecrets) as any;
    const modelNode = nodes.find(node => node.id === model.id);
    if (modelNode) {
        Object.keys(modelNode).forEach(key => {
            if (!["id", "type", "data"].includes(key)) {
                delete waldiezModel[key];
            }
        });
    }
    return waldiezModel;
};
