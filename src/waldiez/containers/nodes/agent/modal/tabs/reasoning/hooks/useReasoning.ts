/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useMemo, useState } from "react";

import { SingleValue } from "@waldiez/components/select";
import { WaldiezAgentReasoningProps } from "@waldiez/containers/nodes/agent/modal/tabs/reasoning/types";
import { reasonConfigMethod } from "@waldiez/types";

export const useWaldiezAgentReasoning = (props: WaldiezAgentReasoningProps) => {
    // Props
    const { data, onDataChange } = props;

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

    return {
        // Props
        data: localData,
        onDataChange: onChange,

        // State
        reasoningMethodOptions,
        answerApproachOptions,
        isSimulationBasedMethod,
        isBeamSearch,
        reasoningMethodValue,
        answerApproachValue,

        // Handlers
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
