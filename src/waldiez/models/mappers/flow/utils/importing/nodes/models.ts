/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezModel } from "@waldiez/models";
import { getIdFromJSON } from "@waldiez/models/mappers/common";
import { modelMapper } from "@waldiez/models/mappers/model";

export const getModels = (json: Record<string, unknown>, nodes: Node[]) => {
    const models: WaldiezModel[] = [];
    if (!("models" in json) || !Array.isArray(json.models)) {
        return models;
    }
    const jsonModels = json.models as Record<string, unknown>[];
    nodes.forEach(node => {
        if (node.type === "model") {
            const modelJson = jsonModels.find(modelJson => {
                return getIdFromJSON(modelJson) === node.id;
            });
            if (modelJson) {
                const nodeExtras = { ...node } as Record<string, unknown>;
                delete nodeExtras.id;
                delete nodeExtras.data;
                delete nodeExtras.type;
                delete nodeExtras.parentId;
                const waldiezModel = modelMapper.importModel({
                    ...modelJson,
                    ...nodeExtras,
                });
                models.push(waldiezModel);
            }
        }
    });
    return models;
};
