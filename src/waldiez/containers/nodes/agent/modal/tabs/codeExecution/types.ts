/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { MultiValue } from "@waldiez/components";
import { WaldiezNodeAgentData, WaldiezNodeTool } from "@waldiez/models";

export type WaldiezAgentCodeExecutionProps = {
    id: string;
    data: WaldiezNodeAgentData;
    tools: WaldiezNodeTool[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
export type CodeExecutionAgentConfigTabViewProps = {
    id: string;
    data: WaldiezNodeAgentData;
    tools: WaldiezNodeTool[];
    onUseCodeExecutionChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCodeExecutionWorkDirChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onCodeExecutionLastNMessagesChange: (value: number | null) => void;
    onCodeExecutionTimeoutChange: (value: number | null) => void;
    onCodeExecutionUseDockerChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    onExecutionFunctionsChange: (
        newValue: MultiValue<{
            label: string;
            value: string;
        } | null>,
    ) => void;
};
