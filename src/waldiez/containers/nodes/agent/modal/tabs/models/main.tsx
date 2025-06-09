/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useMemo } from "react";

import { MultiValue, Select, SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeModel } from "@waldiez/types";

type WaldiezAgentModelProps = {
    id: string;
    data: WaldiezNodeAgentData;
    models: WaldiezNodeModel[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for selecting the models to use with an agent
 * Allows choosing from available models in the workspace
 */
export const WaldiezAgentModels: React.FC<WaldiezAgentModelProps> = memo((props: WaldiezAgentModelProps) => {
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
     * Get the currently selected models
     */
    const selectedModels = useMemo(() => {
        if (!data.modelIds || data.modelIds.length === 0) {
            return [];
        }
        return data.modelIds.map(modelId => {
            const model = models.find(m => m.id === modelId);
            if (model) {
                return {
                    label: model.data.label as string,
                    value: model.id,
                };
            }
            return null;
        });
    }, [data.modelIds, models]);

    /**
     * Handle model selection change
     */
    const onModelsChange = useCallback(
        (
            options:
                | MultiValue<{ label: string; value: string } | null>
                | SingleValue<{ label: string; value: string } | null>,
        ) => {
            if (options) {
                const modelIds = (Array.isArray(options) ? options : [options]).map(option => option.value);
                onDataChange({
                    modelIds,
                });
            } else {
                onDataChange({ modelIds: [] });
            }
        },
        [onDataChange],
    );

    return (
        <div className="agent-panel margin-bottom-10" data-testid="agent-models-panel">
            <label htmlFor={`select-agent-models-${id}`}>
                Model{data.agentType === "rag_user_proxy" ? "" : "s"} to use:
            </label>
            <Select
                options={modelOptions}
                value={selectedModels}
                onChange={onModelsChange}
                isMulti={data.agentType !== "rag_user_proxy"}
                inputId={`select-agent-models-${id}`}
                isClearable
                aria-label={`Select agent's model${data.agentType === "rag_user_proxy" ? "" : "s"}`}
            />
        </div>
    );
});

WaldiezAgentModels.displayName = "WaldiezAgentModels";
