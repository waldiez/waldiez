/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { DEFAULT_CUSTOM_SKILL_CONTENT, WaldiezSkill, WaldiezSkillData } from "@waldiez/models/Skill";

describe("WaldiezSkill", () => {
    it("should create an instance", () => {
        const skillData = new WaldiezSkillData();
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const skill = new WaldiezSkill({
            id: "1",
            name: "new_skill",
            description: "Skill Description",
            tags: [],
            requirements: [],
            createdAt,
            updatedAt,
            data: skillData,
        });
        expect(skill).toBeTruthy();
        expect(skill.id).toBe("1");
        expect(skill.data.content).toBe(DEFAULT_CUSTOM_SKILL_CONTENT);
        const skill2 = WaldiezSkill.create();
        expect(skill2).toBeTruthy();
        expect(skill2.data.content).toBe(DEFAULT_CUSTOM_SKILL_CONTENT);
    });
    it("should create an instance with custom data", () => {
        const createdAt = new Date().toISOString();
        const updatedAt = new Date().toISOString();
        const skillData = new WaldiezSkillData({
            content: "custom_content",
            secrets: { secret: "value" },
            skillType: "custom",
        });
        const skill = new WaldiezSkill({
            id: "1",
            name: "custom_skill",
            description: "custom_description",
            tags: ["tag"],
            requirements: ["requirement"],
            createdAt,
            updatedAt,
            data: skillData,
            rest: { key: "42" },
        });
        expect(skill).toBeTruthy();
        expect(skill.id).toBe("1");
        expect(skill.name).toBe("custom_skill");
        expect(skill.description).toBe("custom_description");
        expect(skill.tags).toEqual(["tag"]);
        expect(skill.requirements).toEqual(["requirement"]);
        expect(skill.createdAt).toBe(createdAt);
        expect(skill.updatedAt).toBe(updatedAt);
        expect(skill.data.content).toBe("custom_content");
        expect(skill.data.secrets).toEqual({ secret: "value" });
        expect(skill.rest).toEqual({ key: "42" });
    });
});
