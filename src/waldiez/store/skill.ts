/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, ReactFlowInstance } from "@xyflow/react";

import { IWaldiezSkillStore, WaldiezNodeSkill, WaldiezNodeSkillData, WaldiezSkill } from "@waldiez/models";
import { skillMapper } from "@waldiez/models/mappers";
import { getNewNodePosition, reArrangeSkills, setViewPortTopLeft } from "@waldiez/store/utils";
import { WaldiezNodeAgent, typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

export class WaldiezSkillStore implements IWaldiezSkillStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezSkillStore(get, set);
    }
    getSkills = () => {
        return this.get().nodes.filter(node => node.type === "skill") as WaldiezNodeSkill[];
    };
    getSkillById = (id: string) => {
        const skill = this.get().nodes.find(node => node.id === id);
        if (!skill || skill.type !== "skill") {
            return null;
        }
        return skill as WaldiezNodeSkill;
    };
    addSkill = () => {
        const existingSkills = this.get().nodes.filter(node => node.type === "skill");
        const flowId = this.get().flowId;
        const rfInstance = this.get().rfInstance;
        const skillCount = existingSkills.length;
        const position = getNewNodePosition(skillCount, flowId, rfInstance);
        const newSkill = WaldiezSkill.create();
        const newNode = skillMapper.asNode(newSkill, position);
        this.set({
            nodes: [
                ...this.get().nodes,
                {
                    ...newNode,
                    type: "skill",
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeSkills(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const skillWithNewPosition = this.get().nodes.find(node => node.id === newNode.id);
        return skillWithNewPosition as WaldiezNodeSkill;
    };
    cloneSkill = (id: string) => {
        const skill = this.get().nodes.find(node => node.id === id);
        if (!skill || skill.type !== "skill") {
            return null;
        }
        const rfInstance = this.get().rfInstance;
        const newSkill = this.getClonedSkill(skill as WaldiezNodeSkill, rfInstance);
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, selected: false };
                    }
                    return node;
                }),
                {
                    ...newSkill,
                    type: "skill",
                    selected: true,
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeSkills(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const skillWithNewPosition = this.get().nodes.find(node => node.id === newSkill.id);
        return skillWithNewPosition as WaldiezNodeSkill;
    };
    updateSkillData = (id: string, data: Partial<WaldiezNodeSkillData>) => {
        const skill = this.get().nodes.find(node => node.id === id);
        if (!skill || skill.type !== "skill") {
            return;
        }
        const updatedAt = new Date().toISOString();
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.type === "skill" && node.id === id) {
                        return {
                            ...node,
                            data: { ...skill.data, ...data, updatedAt },
                        };
                    }
                    return node;
                }),
            ],
            updatedAt,
        });
    };
    deleteSkill = (id: string) => {
        const rfInstance = this.get().rfInstance;
        const allNodes = this.getAgentsAfterSkillDeletion(id, rfInstance);
        this.set({
            nodes: allNodes,
            updatedAt: new Date().toISOString(),
        });
        reArrangeSkills(this.get, this.set);
        setViewPortTopLeft(rfInstance);
    };
    importSkill = (
        skill: { [key: string]: unknown },
        skillId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => {
        const newSkill = skillMapper.importSkill(skill);
        const skillNode = skillMapper.asNode(newSkill, position);
        skillNode.id = skillId;
        if (position) {
            skillNode.position = position;
        }
        if (save) {
            this.set({
                nodes: this.get().nodes.map(node => (node.id === skillId ? skillNode : node)),
            });
        }
        return skillNode;
    };
    exportSkill = (skillId: string, hideSecrets: boolean) => {
        const skill = this.get().nodes.find(node => node.id === skillId);
        if (!skill || skill.type !== "skill") {
            return {};
        }
        return skillMapper.exportSkill(skill as WaldiezNodeSkill, hideSecrets);
    };
    private getClonedSkill: (
        skill: WaldiezNodeSkill,
        rfInstance: ReactFlowInstance | undefined,
    ) => WaldiezNodeSkill = (skill, rfInstance) => {
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;
        const skillsCount = this.get().nodes.filter(node => node.type === "skill").length;
        const flowId = this.get().flowId;
        const position = getNewNodePosition(skillsCount, flowId, rfInstance);
        const label = skill.data.label + " (copy)";
        const clonedSkill = {
            ...skill,
            id: `ws-${getId()}`,
            data: { ...skill.data, label, createdAt, updatedAt },
            position,
        };
        return clonedSkill;
    };
    private getAgentAfterSkillDeletion = (skillId: string, agent: WaldiezNodeAgent) => {
        const skills = agent.data.skills;
        const newSkills = skills.filter(skill => skill.id !== skillId);
        const codeExecution = agent.data.codeExecutionConfig;
        if (typeof codeExecution === "boolean") {
            return {
                ...agent,
                data: {
                    ...agent.data,
                    skills: newSkills,
                },
            };
        }
        const functions = codeExecution.functions ?? [];
        const newFunctions = functions.filter(func => func !== skillId);
        return {
            ...agent,
            data: {
                ...agent.data,
                skills: newSkills,
                codeExecutionConfig: {
                    ...codeExecution,
                    functions: newFunctions,
                },
            },
        };
    };
    private getAgentsAfterSkillDeletion = (skillId: string, rfInstance: ReactFlowInstance | undefined) => {
        const newSkillNodes = this.get().nodes.filter(node => node.type === "skill" && node.id !== skillId);
        const newSkillNodesCount = newSkillNodes.length;
        const flowId = this.get().flowId;
        for (let i = 0; i < newSkillNodesCount; i++) {
            const node = newSkillNodes[i];
            const position = getNewNodePosition(i, flowId, rfInstance);
            newSkillNodes[i] = { ...node, position };
        }
        const allNodes = newSkillNodes.concat(this.get().nodes.filter(node => node.type !== "skill"));
        // check if the skill is linked to any agent
        const newNodes = [] as Node[];
        allNodes.forEach(node => {
            if (node.type === "agent") {
                const agent = this.getAgentAfterSkillDeletion(skillId, node as WaldiezNodeAgent);
                newNodes.push(agent);
            } else {
                newNodes.push(node);
            }
        });
        return newNodes;
    };
}
