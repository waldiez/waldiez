/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSkillType } from "@waldiez/types";

export const createdAt = new Date().toISOString();
export const updatedAt = new Date().toISOString();

export const flowId = "wf-1";
export const skillId = "ws-1";
export const skillData = {
    label: "label",
    description: "description",
    content: "content",
    skillType: "custom" as WaldiezSkillType,
    secrets: {
        skillSecretKey1: "skillSecretValue1",
        skillSecretKey2: "skillSecretValue2",
    },
    requirements: [],
    tags: [],
    createdAt,
    updatedAt,
};

export const storedNodes = [
    {
        id: skillId,
        type: "skill",
        data: skillData,
        position: { x: 0, y: 0 },
    },
];
