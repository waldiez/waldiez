/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo } from "react";

import { SingleValue } from "@waldiez/components/select";
import { WaldiezAgentReasoningProps } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning/types";
import { reasonConfigMethod } from "@waldiez/types";

export const useWaldiezAgentReasoning = (props: WaldiezAgentReasoningProps) => {
    // Props
    const { data, onDataChange } = props;

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
        () => ["mcts", "lats"].includes(data.reasonConfig.method),
        [data.reasonConfig.method],
    );

    /**
     * Method to check if current reasoning method is beam search
     */
    const isBeamSearch = useMemo(
        () => data.reasonConfig.method === "beam_search",
        [data.reasonConfig.method],
    );

    /**
     * Generic change handler for updating state
     */
    const onChange = useCallback(
        (partialData: Partial<typeof data>) => {
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
        (checked: boolean) => {
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
                        ...data.reasonConfig,
                        answerApproach: option.value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle forest size change
     */
    const onForestSizeChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        forestSize: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle reasoning method change
     */
    const onReasoningMethodChange = useCallback(
        (option: SingleValue<{ value: reasonConfigMethod; label: string }>) => {
            if (option) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        method: option.value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle max depth change
     */
    const onMaxDepthChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        maxDepth: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle rating scale change
     */
    const onRatingScaleChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        ratingScale: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle beam size change
     */
    const onBeamSizeChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        beamSize: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle number of simulations change
     */
    const onNSimChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        nsim: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    /**
     * Handle exploration constant change
     */
    const onExplorationConstantChange = useCallback(
        (value: number | null) => {
            if (value !== null) {
                onChange({
                    reasonConfig: {
                        ...data.reasonConfig,
                        explorationConstant: value,
                    },
                });
            }
        },
        [onChange, data.reasonConfig],
    );

    return {
        reasoningMethodOptions,
        answerApproachOptions,
        isSimulationBasedMethod,
        isBeamSearch,
        reasoningMethodValue,
        answerApproachValue,
        onVerboseChange,
        onAnswerApproachChange,
        onForestSizeChange,
        onReasoningMethodChange,
        onMaxDepthChange,
        onRatingScaleChange,
        onBeamSizeChange,
        onNSimChange,
        onExplorationConstantChange,
    };
};
