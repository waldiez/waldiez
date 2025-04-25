/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node } from "@xyflow/react";

import { WaldiezNodeSkill } from "@waldiez/models/Skill";
import { skillMapper } from "@waldiez/models/mappers/skill";

export const exportSkill = (skill: WaldiezNodeSkill, nodes: Node[], hideSecrets: boolean) => {
    const waldiezSkill = skillMapper.exportSkill(skill, hideSecrets) as any;
    const skillNode = nodes.find(node => node.id === skill.id);
    if (skillNode) {
        Object.keys(skillNode).forEach(key => {
            if (!["id", "type", "data"].includes(key)) {
                delete waldiezSkill[key];
            }
        });
    }
    return waldiezSkill;
};
