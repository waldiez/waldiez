/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Select } from "@waldiez/components";
import { useWaldiezAgentSkills } from "@waldiez/containers/nodes/agent/modal/tabs/skills/hooks";
import { WaldiezAgentSkillsProps } from "@waldiez/containers/nodes/agent/modal/tabs/skills/types";

export const WaldiezAgentSkills = (props: WaldiezAgentSkillsProps) => {
    const { id, data, skills } = props;
    const {
        skillOptions,
        agentOptions,
        selectedSkill,
        selectedExecutor,
        getSkillName,
        getAgentName,
        onSelectedSkillChange,
        onSelectedExecutorChange,
        onAddSkill,
        onRemoveSkill,
    } = useWaldiezAgentSkills(props);
    return (
        <div className="agent-panel agent-skills-panel">
            {skills.length === 0 ? (
                <div className="agent-no-skills margin-top-10 margin-bottom-10">
                    No skills found in the workspace
                </div>
            ) : (
                <div>
                    <div className="agent-panel-add-skill">
                        <label htmlFor={`select-agent-skill-${id}`}>Skill:</label>
                        <Select
                            options={skillOptions}
                            onChange={onSelectedSkillChange}
                            value={selectedSkill}
                            inputId={`select-agent-skill-${id}`}
                        />
                        <label htmlFor={`select-agent-skill-executor-${id}`}>Executor:</label>
                        <Select
                            options={agentOptions}
                            onChange={onSelectedExecutorChange}
                            value={selectedExecutor}
                            inputId={`select-agent-skill-executor-${id}`}
                        />
                        <button
                            type="button"
                            title="Add skill"
                            disabled={!selectedSkill || !selectedExecutor}
                            onClick={onAddSkill}
                            data-testid={`add-agent-skill-${id}`}
                        >
                            Add
                        </button>
                    </div>
                    {data.skills.length > 0 && (
                        <div className="agent-panel-current-skills margin-top-10">
                            <div className="agent-panel-current-skills-heading">Current skills:</div>
                            {data.skills.map((skill, index) => {
                                return (
                                    <div key={index} className="agent-panel-current-skill">
                                        <div className="agent-panel-current-skill-entry">
                                            <div className="skill-item">
                                                Skill:{" "}
                                                <div
                                                    className="skill-name"
                                                    data-testid={`skill-name-${id}-${index}`}
                                                >
                                                    {getSkillName(skill)}
                                                </div>
                                            </div>
                                            <div className="agent-item">
                                                Executor:{" "}
                                                <div
                                                    className="agent-name"
                                                    data-testid={`agent-name-${id}-${index}`}
                                                >
                                                    {getAgentName(skill)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                title="Remove skill"
                                                onClick={onRemoveSkill.bind(null, index)}
                                                data-testid={`remove-agent-skill-${id}-${index}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
