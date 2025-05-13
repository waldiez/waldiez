/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo, useCallback, useMemo, useState } from "react";

import { InfoCheckbox, NumberInput, Select, SingleValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeAgentReasoningData, reasonConfigMethod } from "@waldiez/models";

type WaldiezAgentReasoningProps = {
    id: string;
    data: WaldiezNodeAgentReasoningData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};

/**
 * Component for configuring reasoning agent settings
 * Manages reasoning methods, depth, forest size, and other algorithm-specific parameters
 */
export const WaldiezAgentReasoning = memo((props: WaldiezAgentReasoningProps) => {
    const { id, data, onDataChange } = props;

    // Local state
    const [localData, setLocalData] = useState(data);

    /**
     * Options for reasoning method dropdown
     */
    const reasoningMethodOptions = useMemo(
        () => [
            { value: "beam_search" as reasonConfigMethod, label: "Beam Search" },
            { value: "mcts" as reasonConfigMethod, label: "Monte Carlo Tree Search" },
            { value: "lats" as reasonConfigMethod, label: "Language Agent Tree Search" },
            { value: "dfs" as reasonConfigMethod, label: "Depth First Search" },
        ],
        [],
    );

    /**
     * Current reasoning method selection
     */
    const reasoningMethodValue = useMemo(
        () => ({
            value: data.reasonConfig.method,
            label:
                reasoningMethodOptions.find(option => option.value === data.reasonConfig.method)?.label ||
                "Beam Search",
        }),
        [data.reasonConfig.method, reasoningMethodOptions],
    );

    /**
     * Options for answer approach dropdown
     */
    const answerApproachOptions = useMemo(
        () => [
            { value: "pool" as const, label: "Pool" },
            { value: "best" as const, label: "Best" },
        ],
        [],
    );

    /**
     * Current answer approach selection
     */
    const answerApproachValue = useMemo(
        () => ({
            value: data.reasonConfig.answerApproach,
            label:
                answerApproachOptions.find(option => option.value === data.reasonConfig.answerApproach)
                    ?.label || "Pool",
        }),
        [data.reasonConfig.answerApproach, answerApproachOptions],
    );

    /**
     * Method to check if current reasoning method requires simulation settings
     */
    const isSimulationBasedMethod = useMemo(
        () => ["mcts", "lats"].includes(localData.reasonConfig.method),
        [localData.reasonConfig.method],
    );

    /**
     * Method to check if current reasoning method is beam search
     */
    const isBeamSearch = useMemo(
        () => localData.reasonConfig.method === "beam_search",
        [localData.reasonConfig.method],
    );

    /**
     * Generic change handler for updating state
     */
    const onChange = useCallback(
        (partialData: Partial<typeof localData>) => {
            setLocalData(prevData => ({
                ...prevData,
                ...partialData,
            }));

            onDataChange({
                ...partialData,
            });
        },
        [onDataChange],
    );

    /**
     * Handle verbose toggle change
     */
    const onVerboseChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const checked = event.target.checked;
            onChange({
                verbose: checked,
            });
        },
        [onChange],
    );

    /**
     * Handle answer approach change
     */
    const onAnswerApproachChange = useCallback(
        (option: SingleValue<{ value: "pool" | "best"; label: string }>) => {
            if (option) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        answerApproach: option.value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle forest size change
     */
    const onForestSizeChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        forestSize: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle reasoning method change
     */
    const onReasoningMethodChange = useCallback(
        (option: SingleValue<{ value: reasonConfigMethod; label: string }>) => {
            if (option) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        method: option.value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle max depth change
     */
    const onMaxDepthChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        maxDepth: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle rating scale change
     */
    const onRatingScaleChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        ratingScale: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle beam size change
     */
    const onBeamSizeChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        beamSize: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle number of simulations change
     */
    const onNSimChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        nsim: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    /**
     * Handle exploration constant change
     */
    const onExplorationConstantChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...localData.reasonConfig,
                        explorationConstant: value,
                    },
                });
            }
        },
        [onChange, localData.reasonConfig],
    );

    return (
        <div className="agent-panel agent-codeExecution-panel margin-top--10">
            {/* Verbose Toggle */}
            <InfoCheckbox
                label="Verbose"
                info="When enabled, the agent will provide additional information about the reasoning process."
                checked={localData.verbose === true}
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
                value={localData.reasonConfig.maxDepth}
                onChange={onMaxDepthChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-max-depth-${id}`}
                aria-label="Maximum depth for reasoning"
            />

            <NumberInput
                label="Forest Size:"
                value={localData.reasonConfig.forestSize}
                onChange={onForestSizeChange}
                min={1}
                max={10}
                dataTestId={`agent-reasoning-forest-size-${id}`}
                aria-label="Forest size for reasoning"
            />

            <NumberInput
                label="Rating Scale:"
                value={localData.reasonConfig.ratingScale}
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
                        value={localData.reasonConfig.beamSize}
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
                        value={localData.reasonConfig.nsim}
                        onChange={onNSimChange}
                        min={1}
                        max={10}
                        dataTestId={`agent-reasoning-nsim-${id}`}
                        aria-label="Number of simulations for MCTS/LATS"
                    />

                    <NumberInput
                        label="Exploration Constant:"
                        value={localData.reasonConfig.explorationConstant}
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
