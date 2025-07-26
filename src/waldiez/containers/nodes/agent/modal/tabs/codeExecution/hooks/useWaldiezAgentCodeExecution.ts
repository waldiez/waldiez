/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import React, { useCallback, useMemo } from "react";

import { MultiValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models";

/**
 * Custom hook for managing Waldiez Agent Code Execution functionality
 * Handles code execution configuration, settings, and tool integration
 */
export const useWaldiezAgentCodeExecution = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    tools: WaldiezNodeTool[];
}) => {
    const { data, onDataChange, tools } = props;
    /**
     * Get tool name by ID
     */
    const getToolName = useCallback(
        (toolId: string) => {
            const tool = tools.find(tool => tool.id === toolId);
            return (tool?.data.label ?? "Unknown Tool") as string;
        },
        [tools],
    );

    /**
     * Generate code execution function options for the dropdown
     */
    const codeExecutionFunctionOptions = useMemo(
        () =>
            tools.map(tool => ({
                label: (tool.data.label ?? "Unknown Tool") as string,
                value: tool.id,
            })),
        [tools],
    );

    /**
     * Generate current selection values for the dropdown
     */
    const codeExecutionValue = useMemo(() => {
        if (data.codeExecutionConfig === false) {
            return [] as { label: string; value: string }[];
        }

        return (data.codeExecutionConfig?.functions ?? []).map(func => ({
            label: getToolName(func),
            value: func,
        }));
    }, [data.codeExecutionConfig, getToolName]);

    /**
     * Handle toggle for enabling/disabling code execution
     */
    const onUseCodeExecutionChange = useCallback(
        (checked: boolean) => {
            const newConfig = checked ? { ...data.codeExecutionConfig } : false;
            onDataChange({
                codeExecutionConfig: newConfig,
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    /**
     * Handle work directory path changes
     */
    const onCodeExecutionWorkDirChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const workDir = event.target.value;
            onDataChange({
                codeExecutionConfig:
                    typeof data.codeExecutionConfig === "object"
                        ? { ...data.codeExecutionConfig, workDir }
                        : { workDir },
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    /**
     * Handle last N messages setting changes
     */
    const onCodeExecutionLastNMessagesChange = useCallback(
        (value: number | "auto" | null) => {
            const lastNMessages = value ?? 0;
            onDataChange({
                codeExecutionConfig:
                    typeof data.codeExecutionConfig === "object"
                        ? { ...data.codeExecutionConfig, lastNMessages }
                        : { lastNMessages },
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    /**
     * Handle timeout setting changes
     */
    const onCodeExecutionTimeoutChange = useCallback(
        (value: number | null) => {
            const timeout = value ?? 0;
            onDataChange({
                codeExecutionConfig:
                    typeof data.codeExecutionConfig === "object"
                        ? { ...data.codeExecutionConfig, timeout }
                        : { timeout },
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    /**
     * Handle Docker usage toggle
     */
    const onCodeExecutionUseDockerChange = useCallback(
        (checked: boolean) => {
            onDataChange({
                codeExecutionConfig:
                    typeof data.codeExecutionConfig === "object"
                        ? { ...data.codeExecutionConfig, useDocker: checked }
                        : { useDocker: checked },
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    /**
     * Handle execution functions selection changes
     */
    const onExecutionFunctionsChange = useCallback(
        (
            newValue: MultiValue<{
                label: string;
                value: string;
            } | null>,
        ) => {
            if (!newValue) {
                return;
            }
            const selectedFunctions = Array.isArray(newValue) ? newValue : [newValue];
            const selectedFunctionIds = selectedFunctions.map(f => f?.value as string).filter(Boolean);
            onDataChange({
                codeExecutionConfig:
                    typeof data.codeExecutionConfig === "object"
                        ? { ...data.codeExecutionConfig, functions: selectedFunctionIds }
                        : { functions: selectedFunctionIds },
            });
        },
        [data.codeExecutionConfig, onDataChange],
    );

    return {
        codeExecutionValue,
        codeExecutionFunctionOptions,
        getToolName,
        onUseCodeExecutionChange,
        onCodeExecutionWorkDirChange,
        onCodeExecutionLastNMessagesChange,
        onCodeExecutionTimeoutChange,
        onCodeExecutionUseDockerChange,
        onExecutionFunctionsChange,
    };
};
