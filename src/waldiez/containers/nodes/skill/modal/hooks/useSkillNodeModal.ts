/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeSkillModalProps } from "@waldiez/containers/nodes/skill/modal/types";
import { DEFAULT_SKILL_CONTENT_MAP, WaldiezSkillType } from "@waldiez/models";

export const useSkillNodeModal = (props: WaldiezNodeSkillModalProps) => {
    const { data, onDataChange } = props;
    const onUpdateSecrets = (secrets: { [key: string]: unknown }) => {
        onDataChange({ secrets });
    };
    const onDeleteSecret = (key: string) => {
        const secrets = { ...data.secrets };
        if (Object.keys(secrets).includes(key)) {
            delete secrets[key];
        }
        onDataChange({ secrets });
    };
    const onAddSecret = (key: string, value: string) => {
        const secrets = { ...data.secrets };
        secrets[key] = value;
        onDataChange({ secrets });
    };
    const onSkillContentChange = (value: string | undefined) => {
        if (value) {
            onDataChange({ content: value });
        }
    };
    const onSkillLabelChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onDataChange({ label: e.target.value });
    };
    const onSkillDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onDataChange({ description: e.target.value });
    };
    const onSkillTypeChange = (skillType: WaldiezSkillType) => {
        const newContent = DEFAULT_SKILL_CONTENT_MAP[skillType];
        onDataChange({ skillType, content: newContent });
    };
    const onAddTag = (tag: string) => {
        const tags = [...data.tags, tag];
        props.onDataChange({ tags });
    };
    const onDeleteTag = (tag: string) => {
        const tags = data.tags.filter(t => t !== tag);
        props.onDataChange({ tags });
    };
    const onTagChange = (oldItem: string, newItem: string) => {
        const tags = data.tags.map(t => (t === oldItem ? newItem : t));
        props.onDataChange({ tags });
    };
    const onAddRequirement = (requirement: string) => {
        const requirements = [...data.requirements, requirement];
        props.onDataChange({ requirements });
    };
    const onDeleteRequirement = (requirement: string) => {
        const requirements = data.requirements.filter(r => r !== requirement);
        props.onDataChange({ requirements });
    };
    const onRequirementChange = (oldRequirement: string, newRequirement: string) => {
        const requirements = data.requirements.map(r => (r === oldRequirement ? newRequirement : r));
        props.onDataChange({ requirements });
    };
    return {
        onUpdateSecrets,
        onDeleteSecret,
        onAddSecret,
        onSkillContentChange,
        onSkillLabelChange,
        onSkillDescriptionChange,
        onSkillTypeChange,
        onAddTag,
        onDeleteTag,
        onTagChange,
        onAddRequirement,
        onDeleteRequirement,
        onRequirementChange,
    };
};
