/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentModelsProps } from "@waldiez/containers/nodes/agent/modal/tabs/model/types";

export const WaldiezAgentModels = (props: WaldiezAgentModelsProps) => {
    const { id, data, models, onDataChange } = props;
    const [localData, setLocalData] = useState(data);
    const modelOptions = models.map(model => {
        return {
            label: model.data.label as string,
            value: model.id,
        };
    });
    const selectedModel = localData.modelId
        ? {
              label: models.find(model => model.id === localData.modelId)?.data.label as string,
              value: localData.modelId,
          }
        : null;
    const onModelChange = (option: SingleValue<{ label: string; value: string }>) => {
        if (option) {
            const modelId = option.value;
            setLocalData({
                ...localData,
                modelId,
            });
            onDataChange({ modelId });
        } else {
            setLocalData({
                ...localData,
                modelId: null,
            });
            onDataChange({ modelId: null });
        }
    };
    return (
        <div className="agent-panel agent-model-panel margin-bottom-10" data-testid="agent-model-panel">
            {models.length === 0 ? (
                <div className="margin-top-10 margin-left-10">No models found in the workspace</div>
            ) : (
                <>
                    <label htmlFor={`select-agent-model-${id}`}>Model to use:</label>
                    <Select
                        options={modelOptions}
                        value={selectedModel}
                        onChange={onModelChange}
                        isMulti={false}
                        inputId={`select-agent-model-${id}`}
                        isClearable
                    />
                </>
            )}
        </div>
    );
};
