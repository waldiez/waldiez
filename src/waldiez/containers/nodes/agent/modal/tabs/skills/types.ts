/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgent, WaldiezNodeAgentData, WaldiezNodeSkill } from "@waldiez/models";

export type WaldiezAgentSkillsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    skills: WaldiezNodeSkill[];
    agents: WaldiezNodeAgent[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
