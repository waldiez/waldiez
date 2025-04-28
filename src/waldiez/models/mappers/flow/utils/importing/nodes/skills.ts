/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezSkill } from "@waldiez/models";
import { getIdFromJSON } from "@waldiez/models/mappers/common";
import { skillMapper } from "@waldiez/models/mappers/skill";

export const getSkills = (json: Record<string, unknown>, nodes: Node[]) => {
    const skills: WaldiezSkill[] = [];
    if (!("skills" in json) || !Array.isArray(json.skills)) {
        return skills;
    }
    const jsonSkills = json.skills as Record<string, unknown>[];
    nodes.forEach(node => {
        if (node.type === "skill") {
            const skillJson = jsonSkills.find(skillJson => {
                return getIdFromJSON(skillJson) === node.id;
            });
            if (skillJson) {
                const nodeExtras = { ...node } as Record<string, unknown>;
                delete nodeExtras.id;
                delete nodeExtras.data;
                delete nodeExtras.type;
                delete nodeExtras.parentId;
                const waldiezModel = skillMapper.importSkill({
                    ...skillJson,
                    ...nodeExtras,
                });
                skills.push(waldiezModel);
            }
        }
    });
    return skills;
};
