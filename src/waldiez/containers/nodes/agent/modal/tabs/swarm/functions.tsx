/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MultiValue, Select } from "@waldiez/components";
import { WaldiezAgentSwarmFunctionsProps } from "@waldiez/containers/nodes/agent/modal/tabs/swarm/types";

export const WaldiezAgentSwarmFunctions = (props: WaldiezAgentSwarmFunctionsProps) => {
    const { id, data, skills } = props;
    const functionOptions = skills.map(skill => {
        return {
            label: skill.data.label as string,
            value: skill.id,
        };
    });
    const selectedFunctions = data.functions.map(skillId => {
        const skill = skills.find(skill => skill.id === skillId);
        return {
            label: skill?.data.label as string,
            value: skillId,
        };
    });
    const onFunctionsChange = (options: MultiValue<{ label: string; value: string }>) => {
        if (options) {
            const functionIds = options.map(option => option.value);
            props.onDataChange({ functions: functionIds });
        } else {
            props.onDataChange({ functions: [] });
        }
    };
    return (
        <div className="agent-panel agent-swarm-functions-panel">
            {skills.length === 0 ? (
                <div className="agent-no-skills margin-top-10 margin-bottom-10">
                    No skills found in the workspace
                </div>
            ) : (
                <>
                    <label className="select-models-label" htmlFor={`select-agent-models-${id}`}>
                        Skills available to the agent:
                    </label>
                    <Select
                        options={functionOptions}
                        value={selectedFunctions}
                        onChange={onFunctionsChange}
                        isMulti
                        inputId={`select-agent-swarm-functions-${id}`}
                        isClearable
                    />
                </>
            )}
        </div>
    );
};
