/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Editor, Select, SingleValue } from "@waldiez/components";
import { useSkillNodeModal } from "@waldiez/containers/nodes/skill/modal/hooks";
import { WaldiezNodeSkillModalProps } from "@waldiez/containers/nodes/skill/modal/types";
import { WaldiezSkillType } from "@waldiez/models";

export const WaldiezSkillBasicTab = (props: WaldiezNodeSkillModalProps) => {
    const { skillId, data, darkMode } = props;
    const { onSkillContentChange, onSkillLabelChange, onSkillDescriptionChange, onSkillTypeChange } =
        useSkillNodeModal(props);
    const skillTypeOptions: { value: WaldiezSkillType; label: string }[] = [
        { value: "shared", label: "Shared" },
        { value: "custom", label: "Custom" },
        { value: "langchain", label: "Langchain" },
        { value: "crewai", label: "CrewAI" },
    ];
    const onSkillTypeSelectChange = (option: SingleValue<{ value: WaldiezSkillType; label: string }>) => {
        if (option) {
            onSkillTypeChange(option.value);
        }
    };
    return (
        <div className="flex-column margin-top-10">
            <div className="info">
                Enter the skill details below. You can follow the instructions for each skill type in the
                comments of the content editor.
            </div>
            <label htmlFor={`skill-type-select-${skillId}`}>Type:</label>
            <Select
                options={skillTypeOptions}
                value={skillTypeOptions.find(option => option.value === data.skillType)}
                onChange={onSkillTypeSelectChange}
                data-testid={`skill-type-select-${skillId}`}
            />
            <label htmlFor={`skill-label-input-${skillId}`}>Name:</label>
            <input
                title="Name"
                type="text"
                value={data.label}
                data-testid={`skill-label-input-${skillId}`}
                id={`skill-label-input-${skillId}`}
                onChange={onSkillLabelChange}
            />
            <label>Description:</label>
            <textarea
                title="Description"
                rows={2}
                value={data.description}
                data-testid={`skill-description-input-${skillId}`}
                onChange={onSkillDescriptionChange}
            />
            <label>Content:</label>
            <Editor value={data.content} onChange={onSkillContentChange} darkMode={darkMode} />
        </div>
    );
};
