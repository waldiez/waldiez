/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { AiFillCode } from "react-icons/ai";

import { useWaldiezNodeAgentBody } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentData, WaldiezNodeModel, WaldiezNodeSkill } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";
import { LOGOS } from "@waldiez/theme";

type WaldiezNodeAgentBodyProps = {
    flowId: string;
    id: string;
    data: WaldiezNodeAgentData;
    isModalOpen: boolean;
    isReadOnly: boolean;
};

export const WaldiezNodeAgentBody = (props: WaldiezNodeAgentBodyProps) => {
    const { id, flowId, data, isReadOnly } = props;
    // const agentType = data.agentType;
    const agentModelsView = getAgentModelsView(id, data);
    const agentSkillsView = getAgentSkillsView(id, data);
    const { onDescriptionChange } = useWaldiezNodeAgentBody(props);
    return (
        <div className="agent-body">
            <div className="agent-models">{agentModelsView}</div>
            <div className="agent-skills">{agentSkillsView}</div>
            <div className="flex-column flex-1 agent-description-view">
                <label>Description:</label>
                <textarea
                    title="Agent description"
                    className="nodrag nopan"
                    rows={2}
                    defaultValue={data.description}
                    onChange={onDescriptionChange}
                    readOnly={isReadOnly}
                    id={`flow-${flowId}-agent-description-${id}`}
                    data-testid={`agent-description-${id}`}
                />
            </div>
        </div>
    );
};
const getAgentModelsView = (id: string, data: WaldiezNodeAgentData) => {
    const getModels = useWaldiez(s => s.getModels);
    const models = getModels() as WaldiezNodeModel[];
    const agentModelNames = data.modelIds
        .map(modelId => models.find(model => model.id === modelId)?.data.label ?? "")
        .filter(entry => entry !== "");
    const agentWaldiezModelAPITypes = data.modelIds
        .map(modelId => models.find(model => model.id === modelId)?.data.apiType ?? "")
        .filter(entry => entry !== "");
    const agentModelLogos = agentWaldiezModelAPITypes
        .map(apiType => LOGOS[apiType] ?? "")
        .filter(entry => entry !== "");
    if (agentModelNames.length === 0) {
        return <div className="agent-models-empty">No models</div>;
    }
    return (
        <div className="agent-models-preview">
            {agentModelNames.map((name, index) => (
                <div key={name} className="agent-model-preview" data-testid="agent-model-preview">
                    <div className={`agent-model-img ${agentWaldiezModelAPITypes[index]}`}>
                        <img src={agentModelLogos[index]} title={name} alt={name} />
                    </div>
                    <div className="agent-model-name" data-testid={`agent-${id}-linked-model-${index}`}>
                        {name}
                    </div>
                </div>
            ))}
        </div>
    );
};

const getAgentSkillsView = (id: string, data: WaldiezNodeAgentData) => {
    const getSkills = useWaldiez(s => s.getSkills);
    const skills = getSkills() as WaldiezNodeSkill[];
    const skillsCount = data.skills.length;
    if (skillsCount === 0) {
        return <div className="agent-skills-empty">No skills</div>;
    }
    return (
        <div className="agent-skills-preview">
            {data.skills.map((linkedSkill, index) => {
                const skill = skills.find(skill => skill.id === linkedSkill.id);
                if (!skill) {
                    return null;
                }
                return (
                    <div key={skill.id} className="agent-skill-preview" data-testid="agent-skill-preview">
                        <div className={"agent-skill-img"}>
                            <AiFillCode />
                        </div>
                        <div className="agent-skill-name" data-testid={`agent-${id}-linked-skill-${index}`}>
                            {skill.data.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
