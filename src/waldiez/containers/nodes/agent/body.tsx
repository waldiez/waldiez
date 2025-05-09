/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { AiFillCode } from "react-icons/ai";

import { useWaldiezNodeAgentBody } from "@waldiez/containers/nodes/agent/hooks";
import { WaldiezNodeAgentData, WaldiezNodeModel, WaldiezNodeTool } from "@waldiez/models";
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
    const agentType = data.agentType;
    const agentModelsView = getAgentModelsView(id, data);
    const agentToolsView = getAgentToolsView(id, data);
    const { onDescriptionChange } = useWaldiezNodeAgentBody(props);
    // c8 ignore next 3
    if (agentType === "group_manager") {
        return null;
    }
    return (
        <div className="agent-body">
            <div className="agent-models">{agentModelsView}</div>
            <div className="agent-tools">{agentToolsView}</div>

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

const getAgentToolsView = (id: string, data: WaldiezNodeAgentData) => {
    const getTools = useWaldiez(s => s.getTools);
    const tools = getTools() as WaldiezNodeTool[];
    const toolsCount = data.tools.length;
    if (toolsCount === 0) {
        return <div className="agent-tools-empty">No tools</div>;
    }
    return (
        <div className="agent-tools-preview">
            {data.tools.map((linkedTool, index) => {
                const tool = tools.find(tool => tool.id === linkedTool.id);
                if (!tool) {
                    return null;
                }
                return (
                    <div key={tool.id} className="agent-tool-preview" data-testid="agent-tool-preview">
                        <div className={"agent-tool-img"}>
                            <AiFillCode />
                        </div>
                        <div className="agent-tool-name" data-testid={`agent-${id}-linked-tool-${index}`}>
                            {tool.data.label}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
