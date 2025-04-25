/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { WaldiezAgentSkillsProps } from "@waldiez/containers/nodes/agent/modal/tabs/skills/types";
import { WaldiezAgentLinkedSkill, WaldiezNodeAgent, WaldiezNodeSkill } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useWaldiezAgentSkills = (props: WaldiezAgentSkillsProps) => {
    const { id, data, skills, agents, onDataChange } = props;
    const updateAgentData = useWaldiez(state => state.updateAgentData);
    const [selectedSkill, setSelectedSkill] = useState<{
        label: string;
        value: WaldiezNodeSkill;
    } | null>(null);
    const [selectedExecutor, setSelectedExecutor] = useState<{
        label: string;
        value: WaldiezNodeAgent;
    } | null>(null);
    const currentSkills = data.skills;
    useEffect(() => {
        // if a skill was removed, but previously linked to the agent, remove it
        const currentSkillIds = skills.map(skill => skill.id);
        const newSkills = currentSkills.filter(skill => currentSkillIds.includes(skill.id));
        if (newSkills.length !== currentSkills.length) {
            // onDataChange({ skills: newSkills });
            updateAgentData(id, { skills: newSkills });
        }
    }, [data.skills]);
    const skillOptions: { label: string; value: WaldiezNodeSkill }[] = skills.map(skill => {
        return {
            label: (skill.data.label as string) ?? "Unknown skill",
            value: skill,
        };
    });
    const agentOptions: { label: string; value: WaldiezNodeAgent }[] = agents.map(agent => {
        return {
            label: (agent.data.label as string) ?? "Unknown Agent",
            value: agent,
        };
    });
    const getSkillName = (linkedSkill: WaldiezAgentLinkedSkill) => {
        const skillFound = skills.find(skill => skill.id === linkedSkill.id);
        if (!skillFound) {
            return "Unknown skill";
        }
        return skillFound.data.label as string;
    };
    const getAgentName = (linkedSkill: WaldiezAgentLinkedSkill) => {
        const agentFound = agents.find(agent => agent.id === linkedSkill.executorId);
        if (!agentFound) {
            return "Unknown Agent";
        }
        return agentFound.data.label as string;
    };
    const onAddSkill = () => {
        if (!selectedSkill || !selectedExecutor) {
            return;
        }
        const linkedSkill = selectedSkill.value;
        const linkedSkillExecutor = selectedExecutor.value;
        const skillAlready = currentSkills.find(
            entry => entry.executorId === linkedSkillExecutor.id && entry.id === linkedSkill.id,
        );
        const newSkill = {
            id: linkedSkill.id,
            executorId: linkedSkillExecutor.id,
        };
        if (!skillAlready) {
            const newSkills = [...currentSkills, newSkill];
            onDataChange({ skills: newSkills });
            setSelectedSkill(null);
            setSelectedExecutor(null);
        }
    };
    const onRemoveSkill = (index: number) => {
        const newSkills = currentSkills.filter((_, i) => i !== index);
        onDataChange({ skills: newSkills });
    };
    return {
        skillOptions,
        agentOptions,
        selectedSkill,
        selectedExecutor,
        getSkillName,
        getAgentName,
        onSelectedSkillChange: setSelectedSkill,
        onSelectedExecutorChange: setSelectedExecutor,
        onAddSkill,
        onRemoveSkill,
    };
};
