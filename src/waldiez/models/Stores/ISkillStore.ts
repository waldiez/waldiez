/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeSkill, WaldiezNodeSkillData } from "@waldiez/models";

export interface IWaldiezSkillStore {
    getSkills: () => WaldiezNodeSkill[];
    getSkillById: (id: string) => WaldiezNodeSkill | null;
    addSkill: () => WaldiezNodeSkill;
    cloneSkill: (id: string) => WaldiezNodeSkill | null;
    updateSkillData: (id: string, data: Partial<WaldiezNodeSkillData>) => void;
    deleteSkill: (id: string) => void;
    importSkill: (
        skill: { [key: string]: unknown },
        skillId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeSkill;
    exportSkill: (skillId: string, hideSecrets: boolean) => { [key: string]: unknown };
}
