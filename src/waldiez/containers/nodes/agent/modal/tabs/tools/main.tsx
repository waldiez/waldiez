/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Select } from "@waldiez/components";
import { useWaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools/hooks";
import { WaldiezAgentToolsProps } from "@waldiez/containers/nodes/agent/modal/tabs/tools/types";

export const WaldiezAgentTools = (props: WaldiezAgentToolsProps) => {
    const { id, data, tools } = props;
    const {
        toolOptions,
        agentOptions,
        selectedTool,
        selectedExecutor,
        getToolName,
        getAgentName,
        onSelectedToolChange,
        onSelectedExecutorChange,
        onAddTool,
        onRemoveTool,
    } = useWaldiezAgentTools(props);
    return (
        <div className="agent-panel agent-tools-panel">
            {tools.length === 0 ? (
                <div className="agent-no-tools margin-top-10 margin-bottom-10">
                    No tools found in the workspace
                </div>
            ) : (
                <div>
                    <div className="agent-panel-add-tool">
                        <label htmlFor={`select-agent-tool-${id}`}>Tool:</label>
                        <Select
                            options={toolOptions}
                            onChange={onSelectedToolChange}
                            value={selectedTool}
                            inputId={`select-agent-tool-${id}`}
                        />
                        <label htmlFor={`select-agent-tool-executor-${id}`}>Executor:</label>
                        <Select
                            options={agentOptions}
                            onChange={onSelectedExecutorChange}
                            value={selectedExecutor}
                            inputId={`select-agent-tool-executor-${id}`}
                        />
                        <button
                            type="button"
                            title="Add tool"
                            disabled={!selectedTool || !selectedExecutor}
                            onClick={onAddTool}
                            data-testid={`add-agent-tool-${id}`}
                        >
                            Add
                        </button>
                    </div>
                    {data.tools.length > 0 && (
                        <div className="agent-panel-current-tools margin-top-10">
                            <div className="agent-panel-current-tools-heading">Current tools:</div>
                            {data.tools.map((tool, index) => {
                                return (
                                    <div key={index} className="agent-panel-current-tool">
                                        <div className="agent-panel-current-tool-entry">
                                            <div className="tool-item">
                                                Tool:{" "}
                                                <div
                                                    className="tool-name"
                                                    data-testid={`tool-name-${id}-${index}`}
                                                >
                                                    {getToolName(tool)}
                                                </div>
                                            </div>
                                            <div className="agent-item">
                                                Executor:{" "}
                                                <div
                                                    className="agent-name"
                                                    data-testid={`agent-name-${id}-${index}`}
                                                >
                                                    {getAgentName(tool)}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                title="Remove tool"
                                                onClick={onRemoveTool.bind(null, index)}
                                                data-testid={`remove-agent-tool-${id}-${index}`}
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
