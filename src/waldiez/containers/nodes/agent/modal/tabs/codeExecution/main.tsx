/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { NumberInput, Select, TextInput } from "@waldiez/components";
import { useWaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution/hooks";
import { WaldiezAgentCodeExecutionProps } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution/types";

// Flag to control Docker option visibility
// Currently hidden until 'run' props changes in the main component
const SHOW_DOCKER_OPTION = false;

/**
 * Component for configuring agent code execution settings
 * Manages execution options, tools integration, and runtime settings
 */
// eslint-disable-next-line complexity
export const WaldiezAgentCodeExecution = memo((props: WaldiezAgentCodeExecutionProps) => {
    const { id, tools } = props;

    const {
        data,
        codeExecutionValue,
        codeExecutionFunctionOptions,
        onUseCodeExecutionChange,
        onCodeExecutionWorkDirChange,
        onCodeExecutionLastNMessagesChange,
        onCodeExecutionTimeoutChange,
        onCodeExecutionUseDockerChange,
        onExecutionFunctionsChange,
    } = useWaldiezAgentCodeExecution(props);

    // Determine if code execution is enabled
    const isCodeExecutionEnabled = data.codeExecutionConfig !== false;

    // Calculate last N messages value for input
    const lastNMessagesValue =
        isCodeExecutionEnabled &&
        data.codeExecutionConfig !== false &&
        data.codeExecutionConfig?.lastNMessages &&
        data.codeExecutionConfig?.lastNMessages !== "auto"
            ? data.codeExecutionConfig?.lastNMessages
            : 0;

    // Determine if Docker is enabled
    const isDockerEnabled =
        isCodeExecutionEnabled &&
        data.codeExecutionConfig !== false &&
        data.codeExecutionConfig?.useDocker === true;

    // Check if functions selection should be shown
    const shouldShowFunctions = isCodeExecutionEnabled && !isDockerEnabled && tools.length > 0;

    return (
        <div className="agent-panel agent-codeExecution-panel">
            {/* Code Execution Toggle
            <InfoCheckbox
                label="Use Code Execution"
                info="Whether the agent is capable of executing code."
                checked={isCodeExecutionEnabled}
                onChange={onUseCodeExecutionChange}
                dataTestId={`agent-code-execution-toggle-${id}`}
                aria-label="Enable code execution"
            /> */}
            <label className="checkbox-label">
                <div className="checkbox-label-view">Use Code Execution</div>
                <input
                    type="checkbox"
                    checked={isCodeExecutionEnabled}
                    onChange={onUseCodeExecutionChange}
                    data-testid={`agent-code-execution-toggle-${id}`}
                />
                <div className="checkbox"></div>
            </label>
            {/* Code Execution Configuration Options */}
            {isCodeExecutionEnabled && data.codeExecutionConfig !== false && (
                <div className="agent-node-codeExecution-options margin-top-10">
                    {/* Working Directory Setting */}
                    <TextInput
                        label="Working directory:"
                        placeholder="Working directory"
                        className="margin-top-10"
                        value={data.codeExecutionConfig?.workDir ?? ""}
                        onChange={onCodeExecutionWorkDirChange}
                        dataTestId={`agent-code-execution-work-dir-${id}`}
                        aria-label="Code execution working directory"
                    />

                    {/* Last N Messages Setting */}
                    <NumberInput
                        label="Last N messages:"
                        value={lastNMessagesValue}
                        onChange={onCodeExecutionLastNMessagesChange}
                        min={0}
                        max={1000}
                        step={1}
                        setNullOnLower={true}
                        forceInt
                        onLowerLabel="auto"
                        labelInfo="Maximum number of messages to use for code execution. If set to auto(0), all messages will be used."
                        dataTestId={`agent-code-execution-last-n-messages-${id}`}
                        aria-label="Number of messages to include for code execution"
                    />

                    {/* Timeout Setting */}
                    <NumberInput
                        label="Timeout:"
                        value={data.codeExecutionConfig?.timeout ?? 0}
                        onChange={onCodeExecutionTimeoutChange}
                        min={0}
                        max={1000}
                        step={1}
                        onNull={0}
                        forceInt
                        setNullOnLower={true}
                        onLowerLabel="No timeout"
                        labelInfo="Maximum time in seconds to wait for code execution. If set to 0, no timeout will be used."
                        dataTestId={`agent-code-execution-timeout-${id}`}
                        aria-label="Code execution timeout in seconds"
                    />

                    {/* Docker Toggle (conditionally shown) */}
                    <div
                        className={`margin-top-10 margin-bottom-10 ${!SHOW_DOCKER_OPTION ? "sr-only hidden" : ""}`}
                    >
                        <label
                            className="checkbox-label codeExecution-use-docker-checkbox"
                            htmlFor={`agent-code-execution-use-docker-${id}`}
                        >
                            <div>Use docker</div>
                            <input
                                type="checkbox"
                                id={`agent-code-execution-use-docker-${id}`}
                                checked={isDockerEnabled}
                                onChange={onCodeExecutionUseDockerChange}
                                data-testid={`agent-code-execution-use-docker-${id}`}
                                aria-label="Use Docker for code execution"
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>

                    {/* Functions Selection (shown when Docker is disabled) */}
                    {shouldShowFunctions && (
                        <div className="codeExecution-functions">
                            <div className="agent-node-functions">
                                <label htmlFor={`agent-code-execution-functions-${id}`}>Functions:</label>
                                <div className="margin-top-10">
                                    <Select
                                        isMulti
                                        options={codeExecutionFunctionOptions}
                                        value={codeExecutionValue}
                                        onChange={onExecutionFunctionsChange}
                                        inputId={`agent-code-execution-functions-${id}`}
                                        aria-label="Select code execution functions"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});

WaldiezAgentCodeExecution.displayName = "WaldiezAgentCodeExecution";
