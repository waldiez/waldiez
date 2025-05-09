/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useState } from "react";

import { MultiValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models";

export const useWaldiezAgentCodeExecution = (props: {
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
    tools: WaldiezNodeTool[];
}) => {
    const { data, onDataChange, tools } = props;
    const [localData, setLocalData] = useState<WaldiezNodeAgentData>(data);
    const onUseCodeExecutionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({
            ...localData,
            codeExecutionConfig: event.target.checked
                ? {
                      ...data.codeExecutionConfig,
                  }
                : false,
        });
        onDataChange({
            codeExecutionConfig: event.target.checked
                ? {
                      ...data.codeExecutionConfig,
                  }
                : false,
        });
    };
    const onCodeExecutionWorkDirChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({
            ...localData,
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                workDir: event.target.value,
            },
        });
        onDataChange({
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                workDir: event.target.value,
            },
        });
    };
    const onCodeExecutionLastNMessagesChange = (value: number | "auto" | null) => {
        setLocalData({
            ...localData,
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                lastNMessages: value ?? 0,
            },
        });
        onDataChange({
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                lastNMessages: value ?? 0,
            },
        });
    };
    const onCodeExecutionTimeoutChange = (value: number | null) => {
        setLocalData({
            ...localData,
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                timeout: value ?? 0,
            },
        });
        onDataChange({
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                timeout: value ?? 0,
            },
        });
    };
    const onCodeExecutionUseDockerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setLocalData({
            ...localData,
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                useDocker: event.target.checked,
            },
        });
        onDataChange({
            codeExecutionConfig: {
                ...data.codeExecutionConfig,
                useDocker: event.target.checked,
            },
        });
    };
    const onExecutionFunctionsChange = (
        newValue: MultiValue<{
            label: string;
            value: string;
        } | null>,
    ) => {
        if (newValue) {
            const isArray = Array.isArray(newValue);
            const selectedFunctions = isArray ? newValue : [newValue];
            const selectedFunctionIds = selectedFunctions.map(f => f.value as string);
            setLocalData({
                ...localData,
                codeExecutionConfig: {
                    ...data.codeExecutionConfig,
                    functions: selectedFunctionIds,
                },
            });
            onDataChange({
                codeExecutionConfig: {
                    ...data.codeExecutionConfig,
                    functions: selectedFunctionIds,
                },
            });
        }
    };
    const getToolName = (toolId: string) => {
        const tool = tools.find(tool => tool.id === toolId);
        return (tool?.data.label ?? "Unknown Tool") as string;
    };
    const codeExecutionFunctionOptions: { label: string; value: string }[] = tools.map(tool => ({
        label: (tool.data.label ?? "Unknown Tool") as string,
        value: tool.id,
    }));
    const codeExecutionValue: { label: string; value: string }[] =
        data.codeExecutionConfig === false
            ? ([] as { label: string; value: string }[])
            : ((data.codeExecutionConfig?.functions ?? []).map(func => ({
                  label: getToolName(func),
                  value: func,
              })) ?? ([] as { label: string; value: string }[]));
    return {
        data: localData,
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
