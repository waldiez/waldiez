/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { InfoCheckbox, NumberInput, Select } from "@waldiez/components";
import { useWaldiezAgentReasoning } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning/hooks";
import { WaldiezAgentReasoningProps } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning/types";

/**
 * Component for configuring reasoning agent settings
 * Manages reasoning methods, depth, forest size, and other algorithm-specific parameters
 */
export const WaldiezAgentReasoning = memo((props: WaldiezAgentReasoningProps) => {
    const { id } = props;
    const {
        data,
        reasoningMethodOptions,
        reasoningMethodValue,
        answerApproachOptions,
        answerApproachValue,
        isBeamSearch,
        isSimulationBasedMethod,
        onVerboseChange,
        onReasoningMethodChange,
        onMaxDepthChange,
        onForestSizeChange,
        onRatingScaleChange,
        onBeamSizeChange,
        onAnswerApproachChange,
        onNSimChange,
        onExplorationConstantChange,
    } = useWaldiezAgentReasoning(props);
    return (
        <div className="agent-panel agent-codeExecution-panel margin-top--10">
            {/* Verbose Toggle */}
            <InfoCheckbox
                label="Verbose"
                info="When enabled, the agent will provide additional information about the reasoning process."
                checked={data.verbose === true}
                onChange={onVerboseChange}
                dataTestId={`agent-reasoning-verbose-toggle-${id}`}
                aria-label="Enable verbose reasoning output"
            />

            {/* Reasoning Method Selection */}
            <label className="agent-panel-label" htmlFor={`agent-reasoning-method-${id}`}>
                Reasoning Method:
            </label>
            <Select
                options={reasoningMethodOptions}
                value={reasoningMethodValue}
                onChange={onReasoningMethodChange}
                inputId={`agent-reasoning-method-${id}`}
                aria-label="Select reasoning method"
            />

            {/* Common Settings for All Methods */}
            <NumberInput
                label="Max Depth:"
                value={data.reasonConfig.maxDepth}
                onChange={onMaxDepthChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-max-depth-${id}`}
                aria-label="Maximum depth for reasoning"
            />

            <NumberInput
                label="Forest Size:"
                value={data.reasonConfig.forestSize}
                onChange={onForestSizeChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-forest-size-${id}`}
                aria-label="Forest size for reasoning"
            />

            <NumberInput
                label="Rating Scale:"
                value={data.reasonConfig.ratingScale}
                onChange={onRatingScaleChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-rating-scale-${id}`}
                aria-label="Rating scale for reasoning"
            />

            {/* Beam Search Specific Settings */}
            {isBeamSearch && (
                <>
                    <NumberInput
                        label="Beam Size:"
                        value={data.reasonConfig.beamSize}
                        onChange={onBeamSizeChange}
                        min={1}
                        max={10}
                        dataTestId={`agent-reasoning-beam-size-${id}`}
                        aria-label="Beam size for beam search"
                    />

                    <label className="agent-panel-label" htmlFor={`agent-reasoning-answer-approach-${id}`}>
                        Answer Approach:
                    </label>
                    <Select
                        options={answerApproachOptions}
                        value={answerApproachValue}
                        onChange={onAnswerApproachChange}
                        inputId={`agent-reasoning-answer-approach-${id}`}
                        aria-label="Select answer approach"
                    />
                </>
            )}

            {/* MCTS/LATS Specific Settings */}
            {isSimulationBasedMethod && (
                <>
                    <NumberInput
                        label="Number of Simulations:"
                        value={data.reasonConfig.nsim}
                        onChange={onNSimChange}
                        min={1}
                        max={10}
                        dataTestId={`agent-reasoning-nsim-${id}`}
                        aria-label="Number of simulations for MCTS/LATS"
                    />

                    <NumberInput
                        label="Exploration Constant:"
                        value={data.reasonConfig.explorationConstant}
                        onChange={onExplorationConstantChange}
                        min={0}
                        max={10}
                        step={0.01}
                        dataTestId={`agent-reasoning-exploration-constant-${id}`}
                        aria-label="Exploration constant for MCTS/LATS"
                    />
                </>
            )}
        </div>
    );
});

WaldiezAgentReasoning.displayName = "WaldiezAgentReasoning";
