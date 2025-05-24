/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import { MultiValue } from "@waldiez/components";
import { WaldiezAgentToolsProps } from "@waldiez/containers/nodes/agent/modal/tabs/tools/types";
import { WaldiezAgentLinkedTool, WaldiezNodeAgent, WaldiezNodeTool } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

/**
 * Custom hook for managing Waldiez Agent Tools functionality
 * Handles tool selection, addition, removal, and tool-agent relationships
 */
export const useWaldiezAgentTools = (props: WaldiezAgentToolsProps) => {
    const { id, data, tools, agents, onDataChange } = props;

    // Store selectors
    const updateAgentData = useWaldiez(state => state.updateAgentData);

    // Local state
    const [selectedTool, setSelectedTool] = useState<{
        label: string;
        value: WaldiezNodeTool;
    } | null>(null);

    const [selectedExecutor, setSelectedExecutor] = useState<{
        label: string;
        value: WaldiezNodeAgent;
    } | null>(null);

    /**
     * Clean up tools that have been deleted from the workspace
     */
    useEffect(() => {
        // If a tool was removed from the workspace but still linked to the agent,
        // let's remove it
        const currentToolIds = tools.map(tool => tool.id);
        const newTools = data.tools.filter(tool => currentToolIds.includes(tool.id));

        if (newTools.length !== data.tools.length) {
            updateAgentData(id, { tools: newTools });
        }
    }, [tools, data.tools, updateAgentData, id]);

    // const currentTools = data.tools;

    const selectedTools = useMemo(
        () =>
            data.tools.map(tool => {
                const toolFound = tools.find(t => t.id === tool.id);
                if (!toolFound) {
                    return null;
                }
                return {
                    label: toolFound.data.label as string,
                    value: toolFound,
                };
            }),
        [data.tools, tools],
    );

    const onSelectedToolsChange = useCallback(
        (newValue: MultiValue<{ label: string; value: WaldiezNodeTool } | null>) => {
            if (!newValue || newValue.length === 0) {
                onDataChange({ tools: [] });
            } else {
                onDataChange({
                    tools: newValue
                        .filter(tool => tool !== null)
                        .map(tool => ({
                            id: tool.value.id,
                            executorId: id,
                        })),
                });
            }
        },
        [onDataChange, id],
    );

    /**
     * Generate tool options for select dropdown
     */
    const toolOptions = useMemo(
        () =>
            tools
                .filter(tool => tool.data.toolType !== "shared")
                .map(tool => ({
                    label: (tool.data.label as string) ?? "Unknown tool",
                    value: tool,
                })),
        [tools],
    );

    /**
     * Generate agent options for select dropdown
     */
    const agentOptions = useMemo(
        () =>
            agents.map(agent => ({
                label: (agent.data.label as string) ?? "Unknown Agent",
                value: agent,
            })),
        [agents],
    );

    /**
     * Get tool name from linked tool id
     */
    const getToolName = useCallback(
        (linkedTool: WaldiezAgentLinkedTool) => {
            const toolFound = tools.find(tool => tool.id === linkedTool.id);
            if (!toolFound) {
                return "Unknown tool";
            }
            return toolFound.data.label as string;
        },
        [tools],
    );

    /**
     * Get agent name from linked tool's executor id
     */
    const getAgentName = useCallback(
        (linkedTool: WaldiezAgentLinkedTool) => {
            const agentFound = agents.find(agent => agent.id === linkedTool.executorId);
            if (!agentFound) {
                return "Unknown Agent";
            }
            return agentFound.data.label as string;
        },
        [agents],
    );

    /**
     * Add selected tool with executor to agent's tools
     */
    const onAddTool = useCallback(() => {
        if (!selectedTool || !selectedExecutor) {
            return;
        }

        const linkedTool = selectedTool.value;
        const linkedToolExecutor = selectedExecutor.value;

        // Check if tool already exists with this executor
        const toolAlready = data.tools.find(
            entry => entry.executorId === linkedToolExecutor.id && entry.id === linkedTool.id,
        );

        // If not already present, add it
        if (!toolAlready) {
            const newTool = {
                id: linkedTool.id,
                executorId: linkedToolExecutor.id,
            };

            const newTools = [...data.tools, newTool];
            onDataChange({ tools: newTools });

            // Reset selections
            setSelectedTool(null);
            setSelectedExecutor(null);
        }
    }, [selectedTool, selectedExecutor, data.tools, onDataChange]);

    /**
     * Remove tool at specified index
     */
    const onRemoveTool = useCallback(
        (index: number) => {
            const newTools = data.tools.filter((_, i) => i !== index);
            onDataChange({ tools: newTools });
        },
        [data.tools, onDataChange],
    );

    return {
        toolOptions,
        agentOptions,
        selectedTool,
        selectedTools,
        selectedExecutor,
        getToolName,
        getAgentName,
        onSelectedToolChange: setSelectedTool,
        onSelectedToolsChange,
        onSelectedExecutorChange: setSelectedExecutor,
        onAddTool,
        onRemoveTool,
    };
};
