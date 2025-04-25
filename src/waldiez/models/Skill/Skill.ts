/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezSkillData } from "@waldiez/models/Skill/SkillData";
import { getId } from "@waldiez/utils";

/**
 * Waldiez Skill
 * @param type - The type (skill)
 * @param id - The ID
 * @param name - The name of the skill
 * @param description - The description of the skill
 * @param tags - The tags
 * @param requirements - The requirements
 * @param createdAt - The created at date
 * @param updatedAt - The updated at date
 * @param data - The data
 * @param rest - Any additional properties
 * @see {@link WaldiezSkillData}
 */
export class WaldiezSkill {
    type = "skill";
    id: string;
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
    data: WaldiezSkillData;
    rest?: { [key: string]: unknown } = {};

    constructor(props: {
        id: string;
        data: WaldiezSkillData;
        name: string;
        description: string;
        tags: string[];
        requirements: string[];
        createdAt: string;
        updatedAt: string;
        rest?: { [key: string]: unknown };
    }) {
        this.id = props.id;
        this.name = props.name;
        this.description = props.description;
        this.tags = props.tags;
        this.requirements = props.requirements;
        this.createdAt = props.createdAt;
        this.updatedAt = props.updatedAt;
        this.data = props.data;
        this.rest = props.rest;
    }

    static create(): WaldiezSkill {
        return new WaldiezSkill({
            id: `ws-${getId()}`,
            name: "new_skill",
            description: "A new skill",
            tags: [],
            requirements: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            data: new WaldiezSkillData(),
        });
    }
}
