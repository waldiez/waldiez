/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { MultiValue, Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentModelsProps } from "@waldiez/containers/nodes/agent/modal/tabs/models/types";

export const WaldiezAgentModels = (props: WaldiezAgentModelsProps) => {
    const { id, data, models, onDataChange } = props;
    const [localData, setLocalData] = useState(data);
    const modelOptions = models.map(model => {
        return {
            label: model.data.label as string,
            value: model.id,
        };
    });
    const selectedModels = localData.modelIds.map(modelId => {
        const model = models.find(model => model.id === modelId);
        return {
            label: model?.data.label as string,
            value: modelId,
        };
    });
    const onModelsChange = (
        options: MultiValue<{ label: string; value: string }> | SingleValue<{ label: string; value: string }>,
    ) => {
        if (options) {
            const modelIds = (Array.isArray(options) ? options : [options]).map(option => option.value);
            setLocalData({
                ...localData,
                modelIds,
            });
            onDataChange({ modelIds });
        } else {
            setLocalData({
                ...localData,
                modelIds: [],
            });
            onDataChange({ modelIds: [] });
        }
    };
    return (
        <div className="agent-panel agent-models-panel margin-bottom-10" data-testid="agent-models-panel">
            {models.length === 0 ? (
                <div className="select-models-label margin-top-10">No models found in the workspace</div>
            ) : (
                <>
                    <label className="select-models-label" htmlFor={`select-agent-models-${id}`}>
                        Model{localData.agentType !== "rag_user_proxy" ? "s" : ""} to link to agent:
                    </label>
                    <Select
                        options={modelOptions}
                        value={selectedModels}
                        onChange={onModelsChange}
                        isMulti={localData.agentType !== "rag_user_proxy"}
                        inputId={`select-agent-models-${id}`}
                        isClearable
                    />
                </>
            )}
        </div>
    );
};
