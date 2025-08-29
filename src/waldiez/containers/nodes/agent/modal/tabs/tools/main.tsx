/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { memo } from "react";

import { Select } from "@waldiez/components";
import { useWaldiezAgentTools } from "@waldiez/containers/nodes/agent/modal/tabs/tools/hooks";
import { type WaldiezAgentToolsProps } from "@waldiez/containers/nodes/agent/modal/tabs/tools/types";

/**
 * Component for managing tools associated with an agent
 * Allows adding, viewing, and removing tools with their executors
 */
export const WaldiezAgentTools = memo((props: WaldiezAgentToolsProps) => {
    const { id, data, tools, skipExecutor } = props;

    const {
        toolOptions,
        agentOptions,
        selectedTool,
        selectedTools,
        selectedExecutor,
        getToolName,
        getAgentName,
        onSelectedToolChange,
        onSelectedToolsChange,
        onSelectedExecutorChange,
        onAddTool,
        onRemoveTool,
    } = useWaldiezAgentTools(props);

    // If no tools are available in the workspace, show a message
    if (tools.length === 0) {
        return (
            <div className="agent-panel agent-tools-panel margin-bottom-10">
                <div className="margin-top-10 margin-left-10">No tools found in the workspace</div>
            </div>
        );
    }

    if (skipExecutor === true) {
        return (
            <div className="agent-panel agent-tools-panel margin-top-10 margin-bottom-10">
                <div className="agent-panel-select-tools">
                    <label htmlFor={`select-agent-tools-${id}`}>Tools:</label>
                    <Select
                        options={toolOptions}
                        onChange={onSelectedToolsChange}
                        value={selectedTools}
                        isMulti={true}
                        isClearable={true}
                        inputId={`select-agent-tool-${id}`}
                        aria-label="Select tools"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="agent-panel agent-tools-panel margin-top-10 margin-bottom-10">
            <div>
                {/* Tool selection controls */}
                <div className="agent-panel-add-tool">
                    <label htmlFor={`select-agent-tool-${id}`}>Tool:</label>
                    <Select
                        options={toolOptions}
                        onChange={onSelectedToolChange}
                        value={selectedTool}
                        inputId={`select-agent-tool-${id}`}
                        aria-label="Select tool"
                    />

                    <label htmlFor={`select-agent-tool-executor-${id}`}>Executor:</label>
                    <Select
                        options={agentOptions}
                        onChange={onSelectedExecutorChange}
                        value={selectedExecutor}
                        inputId={`select-agent-tool-executor-${id}`}
                        aria-label="Select executor agent"
                    />

                    <button
                        type="button"
                        title="Add tool"
                        disabled={!selectedTool || !selectedExecutor}
                        onClick={onAddTool}
                        data-testid={`add-agent-tool-${id}`}
                        aria-label="Add tool"
                    >
                        Add
                    </button>
                </div>

                {/* Current tools list */}
                {data.tools.length > 0 && (
                    <div className="agent-panel-current-tools margin-top-10">
                        <div className="agent-panel-current-tools-heading">Current tools:</div>

                        {data.tools.map((tool, index) => (
                            <div
                                key={`tool-${id}-${tool.id}-${tool.executorId}`}
                                className="agent-panel-current-tool"
                            >
                                <div className="agent-panel-current-tool-entry">
                                    <div className="tool-item">
                                        Tool:{" "}
                                        <div className="tool-name" data-testid={`tool-name-${id}-${index}`}>
                                            {getToolName(tool)}
                                        </div>
                                    </div>

                                    <div className="agent-item">
                                        Executor:{" "}
                                        <div className="agent-name" data-testid={`agent-name-${id}-${index}`}>
                                            {getAgentName(tool)}
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        title="Remove tool"
                                        onClick={() => onRemoveTool(index)}
                                        data-testid={`remove-agent-tool-${id}-${index}`}
                                        aria-label={`Remove ${getToolName(tool)}`}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
});

WaldiezAgentTools.displayName = "WaldiezAgentTools";
