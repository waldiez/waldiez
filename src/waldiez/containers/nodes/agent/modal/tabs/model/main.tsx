/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useMemo } from "react";

import { Select, SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeModel } from "@waldiez/types";

type WaldiezAgentModelProps = {
    id: string;
    data: WaldiezNodeAgentData;
    models: WaldiezNodeModel[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for selecting a model to use with an agent
 * Allows choosing from available models in the workspace
 */
export const WaldiezAgentModel = memo((props: WaldiezAgentModelProps) => {
    const { id, data, models, onDataChange } = props;

    /**
     * Generate model options for the dropdown
     */
    const modelOptions = useMemo(
        () =>
            models.map(model => ({
                label: model.data.label as string,
                value: model.id,
            })),
        [models],
    );

    /**
     * Get the currently selected model
     */
    const selectedModel = useMemo(() => {
        if (!data.modelId) {
            return null;
        }

        const selectedModelData = models.find(model => model.id === data.modelId);
        if (!selectedModelData) {
            return null;
        }

        return {
            label: selectedModelData.data.label as string,
            value: data.modelId,
        };
    }, [data.modelId, models]);

    /**
     * Handle model selection change
     */
    const onModelChange = useCallback(
        (option: SingleValue<{ label: string; value: string }>) => {
            if (option) {
                const modelId = option.value;
                onDataChange({ modelId });
            } else {
                onDataChange({ modelId: null });
            }
        },
        [onDataChange],
    );

    return (
        <div className="agent-panel agent-model-panel margin-bottom-10" data-testid="agent-model-panel">
            <label htmlFor={`select-agent-model-${id}`}>Model to use:</label>
            <Select
                options={modelOptions}
                value={selectedModel}
                onChange={onModelChange}
                isMulti={false}
                inputId={`select-agent-model-${id}`}
                isClearable
                aria-label="Select model for agent"
            />
        </div>
    );
});

WaldiezAgentModel.displayName = "WaldiezAgentModel";
