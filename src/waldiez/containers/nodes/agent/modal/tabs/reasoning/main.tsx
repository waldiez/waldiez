/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { InfoCheckbox, NumberInput, Select, SingleValue } from "@waldiez/components";
import { WaldiezAgentReasoningProps } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning/types";
import { ReasoningConfigMethod } from "@waldiez/models";

export const WaldiezAgentReasoning = (props: WaldiezAgentReasoningProps) => {
    const { id, data, onDataChange } = props;
    const [localData, setLocalData] = useState(data);

    const reasoningMethodOptions: { value: ReasoningConfigMethod; label: string }[] = [
        { value: "beam_search", label: "Beam Search" },
        { value: "mcts", label: "Monte Carlo Tree Search" },
        { value: "lats", label: "Language Agent Tree Search" },
        { value: "dfs", label: "Depth First Search" },
    ];

    const reasoningMethodValue = {
        value: data.reasonConfig.method,
        label: reasoningMethodOptions.find(option => option.value === data.reasonConfig.method)!.label,
    };

    const answerApproachOptions: { value: "pool" | "best"; label: string }[] = [
        { value: "pool", label: "Pool" },
        { value: "best", label: "Best" },
    ];

    const answerApproachValue = {
        value: data.reasonConfig.answer_approach,
        label: answerApproachOptions.find(option => option.value === data.reasonConfig.answer_approach)!
            .label,
    };

    const onChange = (partialData: Partial<typeof localData>) => {
        setLocalData({
            ...localData,
            ...partialData,
        });
        onDataChange({
            ...partialData,
        });
    };

    const onVerboseChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const checked = event.target.checked;
        onChange({
            verbose: checked,
        });
    };

    const onAnswerApproachChange = (option: SingleValue<{ value: "pool" | "best"; label: string }>) => {
        if (option) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    answer_approach: option.value,
                },
            });
        }
    };

    const onForestSizeChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    forest_size: value,
                },
            });
        }
    };

    const onReasoningMethodChange = (
        option: SingleValue<{ value: ReasoningConfigMethod; label: string }>,
    ) => {
        if (option) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    method: option.value,
                },
            });
        }
    };
    const onMaxDepthChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    max_depth: value,
                },
            });
        }
    };

    const onRatingScaleChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    rating_scale: value,
                },
            });
        }
    };

    const onBeamSizeChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    beam_size: value,
                },
            });
        }
    };

    const onNSimChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    nsim: value,
                },
            });
        }
    };

    const onExplorationConstantChange = (value: number | null) => {
        if (value) {
            onChange({
                reasonConfig: {
                    ...localData.reasonConfig,
                    exploration_constant: value,
                },
            });
        }
    };

    return (
        <div className="agent-panel agent-codeExecution-panel margin-top--10">
            <InfoCheckbox
                label={"Verbose"}
                info={
                    "When enabled, the agent will provide additional information about the reasoning process."
                }
                checked={localData.verbose === true}
                onChange={onVerboseChange}
                dataTestId={`agent-reasoning-verbose-toggle-${id}`}
            />
            <label className="agent-panel-label" htmlFor={`agent-reasoning-method-${id}`}>
                Reasoning Method:
            </label>
            <Select
                options={reasoningMethodOptions}
                value={reasoningMethodValue}
                onChange={onReasoningMethodChange}
                inputId={`agent-reasoning-method-${id}`}
            />
            <NumberInput
                label={"Max Depth:"}
                value={localData.reasonConfig.max_depth}
                onChange={onMaxDepthChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-max-depth-${id}`}
            />
            <NumberInput
                label={"Forest Size:"}
                value={localData.reasonConfig.forest_size}
                onChange={onForestSizeChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-forest-size-${id}`}
            />
            <NumberInput
                label={"Rating Scale:"}
                value={localData.reasonConfig.rating_scale}
                onChange={onRatingScaleChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-rating-scale-${id}`}
            />
            {localData.reasonConfig.method === "beam_search" && (
                <>
                    <NumberInput
                        label={"Beam Size:"}
                        value={localData.reasonConfig.beam_size}
                        onChange={onBeamSizeChange}
                        min={1}
                        max={10}
                        dataTestId={`agent-reasoning-beam-size-${id}`}
                    />
                    <label className="agent-panel-label" htmlFor={`agent-reasoning-answer-approach-${id}`}>
                        Answer Approach:
                    </label>
                    <Select
                        options={answerApproachOptions}
                        value={answerApproachValue}
                        onChange={onAnswerApproachChange}
                        inputId={`agent-reasoning-answer-approach-${id}`}
                    />
                </>
            )}
            {["mcts", "lats"].includes(localData.reasonConfig.method) && (
                <>
                    <NumberInput
                        label={"Number of Simulations:"}
                        value={localData.reasonConfig.nsim}
                        onChange={onNSimChange}
                        min={1}
                        max={10}
                        dataTestId={`agent-reasoning-nsim-${id}`}
                    />
                    <NumberInput
                        label={"Exploration Constant:"}
                        value={localData.reasonConfig.exploration_constant}
                        onChange={onExplorationConstantChange}
                        min={0}
                        max={10}
                        step={0.01}
                        dataTestId={`agent-reasoning-exploration-constant-${id}`}
                    />
                </>
            )}
        </div>
    );
};
