/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { describe, expect, it } from "vitest";

import { WaldiezSkillData } from "@waldiez/models";
import { getSkills } from "@waldiez/models/mappers/flow/utils";

describe("getSkills", () => {
    it("should return the correct skills", () => {
        const json = {
            skills: [
                {
                    id: "123",
                    type: "skill",
                    name: "Test Skill",
                    description: "A test skill",
                    tags: ["test", "skill"],
                    requirements: ["test"],
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    data: {},
                },
            ],
        };
        const nodes = [
            {
                id: "123",
                type: "skill",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
            {
                id: "456",
                type: "skill",
                position: { x: 0, y: 0 },
                parentId: undefined,
                data: {},
            },
        ];
        const skills = getSkills(json, nodes);
        expect(skills).toEqual([
            {
                id: "123",
                type: "skill",
                name: "Test Skill",
                description: "A test skill",
                tags: ["test", "skill"],
                requirements: ["test"],
                createdAt: json.skills[0].createdAt,
                updatedAt: json.skills[0].updatedAt,
                data: new WaldiezSkillData(),
                rest: {
                    position: { x: 0, y: 0 },
                },
            },
        ]);
    });
    it("should not return skills if skills is not an array", () => {
        const json = {
            skills: {},
        };
        const nodes: any[] = [];
        const skills = getSkills(json, nodes);
        expect(skills).toEqual([]);
    });
});
