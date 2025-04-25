/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import {
    DEFAULT_CUSTOM_SKILL_CONTENT,
    WaldiezNodeSkill,
    WaldiezSkill,
    WaldiezSkillData,
} from "@waldiez/models";
import { skillMapper } from "@waldiez/models/mappers";

describe("skillMapper", () => {
    it("should import a skill", () => {
        const skillJson = {
            type: "skill",
            id: "1",
            name: "custom_skill",
            description: "custom_description",
            tags: ["tag2"],
            requirements: ["requirement1"],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: {
                content: "custom_content",
                secrets: { secret: "value" },
            },
        };
        const skill = skillMapper.importSkill(skillJson);
        expect(skill).toBeTruthy();
        expect(skill.id).toBe("1");
        expect(skill.name).toBe("custom_skill");
        expect(skill.description).toBe("custom_description");
        expect(skill.tags).toEqual(["tag2"]);
        expect(skill.requirements).toEqual(["requirement1"]);
        expect(skill.createdAt).toBe(skillJson.createdAt);
        expect(skill.updatedAt).toBe(skillJson.updatedAt);
        expect(skill.data.content).toBe("custom_content");
        expect(skill.data.secrets).toEqual({ secret: "value" });
    });
    it("should import a skill with invalid json", () => {
        const skill = skillMapper.importSkill(4);
        expect(skill).toBeTruthy();
        expect(skill.id).toBeTypeOf("string");
        expect(skill.name).toBe("new_skill");
        expect(skill.data.content).toBe(DEFAULT_CUSTOM_SKILL_CONTENT);
    });
    it("should import a skill with no data in json", () => {
        const skill = skillMapper.importSkill({
            type: "skill",
            id: "1",
        });
        expect(skill).toBeTruthy();
        expect(skill.id).toBe("1");
        expect(skill.name).toBe("new_skill");
        expect(skill.data.content).toBe(DEFAULT_CUSTOM_SKILL_CONTENT);
    });
    it("should use the label when no name is provided", () => {
        const skill = skillMapper.importSkill({
            type: "skill",
            id: "1",
            label: "custom_label",
        });
        expect(skill).toBeTruthy();
        expect(skill.id).toBe("1");
        expect(skill.name).toBe("custom_label");
        expect(skill.data.content).toBe(DEFAULT_CUSTOM_SKILL_CONTENT);
    });
    it("should export a skill node", () => {
        const skillData = new WaldiezSkillData();
        const skillNode = {
            id: "1",
            data: { ...skillData, label: "skillName" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeSkill;
        const skillJson = skillMapper.exportSkill(skillNode, false);
        expect(skillJson).toBeTruthy();
        expect(skillJson.id).toBe("1");
        expect(skillJson.type).toBe("skill");
        expect(skillJson.name).toBe(skillNode.data.label);
        expect(skillJson.description).toBe(skillNode.data.description);
        expect(skillJson.tags).toEqual(skillNode.data.tags);
        expect(skillJson.requirements).toEqual(skillNode.data.requirements);
        expect(skillJson.createdAt).toBe(skillNode.data.createdAt);
        expect(skillJson.updatedAt).toBe(skillNode.data.updatedAt);
    });
    it("should export a skill node with secrets replaced", () => {
        const skillData = new WaldiezSkillData();
        skillData.secrets = { secret: "value" };
        const skillNode = {
            id: "1",
            data: { ...skillData, label: "new_skill" },
            position: { x: 0, y: 0 },
        } as WaldiezNodeSkill;
        const skillJson = skillMapper.exportSkill(skillNode, true);
        expect(skillJson).toBeTruthy();
        expect(skillJson.id).toBe("1");
        expect(skillJson.type).toBe("skill");
        expect((skillJson.data as any).secrets).toEqual({ secret: "REPLACE_ME" });
    });
    it("should convert a skill to a skill node", () => {
        const skillData = new WaldiezSkillData();
        const skill = new WaldiezSkill({
            id: "1",
            name: "skill_name",
            description: "skill_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: skillData,
            rest: { position: { x: 10, y: 11 } },
        });
        const skillNode = skillMapper.asNode(skill);
        expect(skillNode).toBeTruthy();
        expect(skillNode.id).toBe("1");
        expect(skillNode.data.label).toBe("skill_name");
        expect(skillNode.data.content).toBe(skillData.content);
        expect(skillNode.data.description).toBe("skill_description");
        expect(skillNode.data.secrets).toEqual(skillData.secrets);
        expect(skillNode.position).toEqual({ x: 10, y: 11 });
    });
    it("should convert a skill to a skill node with custom position", () => {
        const skillData = new WaldiezSkillData();
        const skill = new WaldiezSkill({
            id: "1",
            name: "skill_name",
            description: "skill_description",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: skillData,
            rest: { position: {} },
        });
        const skillNode = skillMapper.asNode(skill, { x: 20, y: 21 });
        expect(skillNode).toBeTruthy();
        expect(skillNode.id).toBe("1");
        expect(skillNode.data.label).toBe("skill_name");
        expect(skillNode.data.content).toBe(skillData.content);
        expect(skillNode.data.description).toBe("skill_description");
        expect(skillNode.data.secrets).toEqual(skillData.secrets);
        expect(skillNode.position).toEqual({ x: 20, y: 21 });
    });
});
