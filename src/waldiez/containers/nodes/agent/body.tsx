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
    const agentModelView = getAgentModelView(id, data);
    const agentToolsView = getAgentToolsView(id, data);
    const { onDescriptionChange } = useWaldiezNodeAgentBody(props);
    // c8 ignore next 3
    if (agentType === "group_manager") {
        return null;
    }
    return (
        <div className="agent-body">
            <div className="agent-model">{agentModelView}</div>
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
const getAgentModelView = (id: string, data: WaldiezNodeAgentData) => {
    const getModels = useWaldiez(s => s.getModels);
    const models = getModels() as WaldiezNodeModel[];
    const agentModel = data.modelId ? models.find(model => model.id === data.modelId) : null;
    if (!agentModel) {
        return <div className="agent-model-empty">No model</div>;
    }
    const agentModelName = agentModel.data.label;
    const agentWaldiezModelAPIType = agentModel.data.apiType;
    const agentModelLogo = LOGOS[agentWaldiezModelAPIType] ?? "";
    return (
        <div className="agent-model-preview">
            <div className={`agent-model-img ${agentWaldiezModelAPIType}`}>
                <img src={agentModelLogo} title={agentModelName} alt={agentModelName} />
            </div>
            <div className="agent-model-name" data-testid={`agent-${id}-linked-model`}>
                {agentModelName}
            </div>
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
