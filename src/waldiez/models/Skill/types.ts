/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { Node } from "@xyflow/react";

export type WaldiezSkillType = "shared" | "custom" | "langchain" | "crewai";

export type WaldiezSkillDataCommon = {
    content: string;
    skillType: WaldiezSkillType;
    description: string;
    secrets: { [key: string]: string };
    requirements: string[];
    tags: string[];
    createdAt: string;
    updatedAt: string;
};

export type WaldiezNodeSkillData = WaldiezSkillDataCommon & {
    label: string;
};

export type WaldiezNodeSkill = Node<WaldiezNodeSkillData, "skill">;
