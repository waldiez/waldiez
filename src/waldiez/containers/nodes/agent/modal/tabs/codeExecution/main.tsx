/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { InfoCheckbox, NumberInput, Select, TextInput } from "@waldiez/components";
import { useWaldiezAgentCodeExecution } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution/hooks";
import { WaldiezAgentCodeExecutionProps } from "@waldiez/containers/nodes/agent/modal/tabs/codeExecution/types";

// let's hide the docker option, until we change the 'run' props in the main component
const showDockerOption = false;

export const WaldiezAgentCodeExecution = (props: WaldiezAgentCodeExecutionProps) => {
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
    return (
        <div className="agent-panel agent-codeExecution-panel margin-top--10">
            <InfoCheckbox
                label={"Use Code Execution"}
                info={"Whether the agent is capable of executing code."}
                checked={data.codeExecutionConfig !== false}
                onChange={onUseCodeExecutionChange}
                dataTestId={`agent-code-execution-toggle-${id}`}
            />
            {data.codeExecutionConfig !== false && (
                <div className="agent-node-codeExecution-options">
                    <TextInput
                        label="Working directory:"
                        value={data.codeExecutionConfig?.workDir ?? ""}
                        onChange={onCodeExecutionWorkDirChange}
                        dataTestId={`agent-code-execution-work-dir-${id}`}
                    />
                    <NumberInput
                        label="Last N messages:"
                        value={
                            data.codeExecutionConfig?.lastNMessages &&
                            data.codeExecutionConfig?.lastNMessages !== "auto"
                                ? data.codeExecutionConfig?.lastNMessages
                                : 0
                        }
                        onChange={onCodeExecutionLastNMessagesChange}
                        min={0}
                        max={1000}
                        step={1}
                        setNullOnLower={true}
                        forceInt
                        onLowerLabel="auto"
                        labelInfo="Maximum number of messages to use for code execution. If set to auto(0), all messages will be used."
                        dataTestId={`agent-code-execution-last-n-messages-${id}`}
                    />
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
                    />
                    <div className={`margin-top-10 margin-bottom-10 ${!showDockerOption && "hidden"}`}>
                        <label className="checkbox-label codeExecution-use-docker-checkbox">
                            <div> Use docker</div>
                            <input
                                type="checkbox"
                                checked={data.codeExecutionConfig?.useDocker === true}
                                onChange={onCodeExecutionUseDockerChange}
                                data-testid={`agent-code-execution-use-docker-${id}`}
                            />
                            <div className="checkbox"></div>
                        </label>
                    </div>
                    {!data.codeExecutionConfig?.useDocker && tools.length > 0 && (
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
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
