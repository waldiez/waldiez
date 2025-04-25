/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import {
    DEFAULT_CUSTOM_SKILL_CONTENT,
    WaldiezNodeSkill,
    WaldiezSkill,
    WaldiezSkillData,
    WaldiezSkillType,
} from "@waldiez/models/Skill";
import {
    getCreatedAtFromJSON,
    getDescriptionFromJSON,
    getIdFromJSON,
    getNameFromJSON,
    getNodePositionFromJSON,
    getRequirementsFromJSON,
    getRestFromJSON,
    getTagsFromJSON,
    getUpdatedAtFromJSON,
} from "@waldiez/models/mappers/common";
import { getId } from "@waldiez/utils";

export const skillMapper = {
    importSkill: (json: unknown): WaldiezSkill => {
        if (!json || typeof json !== "object") {
            return new WaldiezSkill({
                id: "ws-" + getId(),
                name: "new_skill",
                description: "A new skill",
                tags: [],
                requirements: [],
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                data: new WaldiezSkillData(),
            });
        }
        const jsonObject = json as Record<string, unknown>;
        const id = getIdFromJSON(jsonObject);
        const { name, description, tags, requirements, createdAt, updatedAt } = getNodeMeta(jsonObject);
        const rest = getRestFromJSON(jsonObject, [
            "id",
            "type",
            "name",
            "description",
            "tags",
            "requirements",
            "createdAt",
            "updatedAt",
            "data",
        ]);
        const skillType = getSkillDataType(jsonObject.data || (jsonObject as any), name);
        const content = getSkillDataContent(jsonObject.data || (jsonObject as any));
        const secrets = getSkillDataSecrets(jsonObject.data || (jsonObject as any));
        const data = new WaldiezSkillData({
            skillType,
            content,
            secrets,
        });
        return new WaldiezSkill({
            id,
            name,
            description,
            tags,
            requirements,
            createdAt,
            updatedAt,
            data,
            rest,
        });
    },
    exportSkill: (skillNode: WaldiezNodeSkill, replaceSecrets: boolean): { [key: string]: unknown } => {
        const secrets = { ...skillNode.data.secrets };
        if (replaceSecrets) {
            for (const key in secrets) {
                if (typeof secrets[key] === "string") {
                    secrets[key] = "REPLACE_ME";
                }
            }
        }
        const rest = getRestFromJSON(skillNode, ["id", "type", "parentId", "data"]);
        const skillName = skillNode.data.label;
        const skillType = skillName === "waldiez_shared" ? "shared" : skillNode.data.skillType;
        return {
            id: skillNode.id,
            type: "skill",
            name: skillName,
            description: skillNode.data.description,
            tags: skillNode.data.tags,
            requirements: skillNode.data.requirements,
            createdAt: skillNode.data.createdAt,
            updatedAt: skillNode.data.updatedAt,
            data: {
                content: skillNode.data.content,
                skillType,
                secrets,
            },
            ...rest,
        };
    },
    asNode: (skill: WaldiezSkill, position?: { x: number; y: number }): WaldiezNodeSkill => {
        const nodePosition = getNodePositionFromJSON(skill, position);
        const nodeData = {
            ...skill.data,
            label: skill.name,
            description: skill.description,
            tags: skill.tags,
            requirements: skill.requirements,
            createdAt: skill.createdAt,
            updatedAt: skill.updatedAt,
        } as { [key: string]: unknown };
        if (skill.rest && "position" in skill.rest) {
            delete skill.rest.position;
        }
        const data = nodeData as WaldiezNodeSkill["data"];
        return {
            id: skill.id,
            type: "skill",
            data,
            position: nodePosition,
            ...skill.rest,
        };
    },
};

const getSkillDataContent = (json: Record<string, unknown>): string => {
    let content = DEFAULT_CUSTOM_SKILL_CONTENT;
    if ("content" in json && typeof json.content === "string") {
        content = json.content;
    }
    return content;
};

const getSkillDataSecrets = (json: Record<string, unknown>): { [key: string]: string } => {
    let secrets: { [key: string]: string } = {};
    if ("secrets" in json && typeof json.secrets === "object") {
        if (json.secrets !== null) {
            secrets = Object.entries(json.secrets).reduce(
                (acc, [key, value]) => {
                    acc[key] = value.toString();
                    return acc;
                },
                {} as { [key: string]: string },
            );
        }
    }
    return secrets;
};

const getNodeMeta = (
    json: Record<string, unknown>,
): {
    name: string;
    description: string;
    tags: string[];
    requirements: string[];
    createdAt: string;
    updatedAt: string;
} => {
    const name = getNameFromJSON(json, "new_skill")!;
    const description = getDescriptionFromJSON(json, "A new skill");
    const tags = getTagsFromJSON(json);
    const requirements = getRequirementsFromJSON(json);
    const createdAt = getCreatedAtFromJSON(json);
    const updatedAt = getUpdatedAtFromJSON(json);
    return { name, description, tags, requirements, createdAt, updatedAt };
};

const getSkillDataType = (json: Record<string, unknown>, skillName: string): WaldiezSkillType => {
    let skillType: WaldiezSkillType = "custom";
    if (
        "skillType" in json &&
        typeof json.skillType === "string" &&
        ["shared", "custom", "langchain", "crewai"].includes(json.skillType)
    ) {
        skillType = json.skillType as WaldiezSkillType;
    }
    if (skillName === "waldiez_shared") {
        skillType = "shared";
    }
    return skillType;
};
