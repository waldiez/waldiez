/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useMemo } from "react";
import { AiFillCode } from "react-icons/ai";

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

/**
 * Component for rendering the body section of a Waldiez Node Agent
 * Displays model information, tools, and a description editor
 */
export const WaldiezNodeAgentBody = memo((props: WaldiezNodeAgentBodyProps) => {
    const { id, data } = props;
    const agentType = data.agentType;

    // If this is a group manager, don't render anything
    if (agentType === "group_manager") {
        return null;
    }

    // Get model and tools views via hooks
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const agentModelsView = useAgentModelsView(id, data);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const agentToolsView = useAgentToolsView(id, data);

    return (
        <div className="agent-body">
            <div className="agent-models">{agentModelsView}</div>
            <div className="agent-tools">{agentToolsView}</div>
        </div>
    );
});

WaldiezNodeAgentBody.displayName = "WaldiezNodeAgentBody";

/**
 * Custom hook for rendering the agent's models names and logos
 */
const useAgentModelsView = (id: string, data: WaldiezNodeAgentData) => {
    const getModels = useWaldiez(s => s.getModels);

    return useMemo(() => {
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
    }, [getModels, data.modelIds, id]);
};

/**
 * Custom hook for rendering the agent's tools
 */
const useAgentToolsView = (id: string, data: WaldiezNodeAgentData) => {
    const getTools = useWaldiez(s => s.getTools);

    return useMemo(() => {
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
                            <div className="agent-tool-img">
                                <AiFillCode aria-hidden="true" />
                            </div>
                            <div className="agent-tool-name" data-testid={`agent-${id}-linked-tool-${index}`}>
                                {tool.data.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }, [getTools, data.tools, id]);
};
