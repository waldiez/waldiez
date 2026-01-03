/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import { useCallback, useEffect, useMemo, useState } from "react";

import type { MultiValue } from "@waldiez/components";
import type { WaldiezAgentToolsProps } from "@waldiez/containers/nodes/agent/modal/tabs/tools/types";
import type { WaldiezAgentLinkedTool, WaldiezNodeAgent, WaldiezNodeTool } from "@waldiez/models";
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

    const getToolName = useCallback((tool: WaldiezNodeTool) => {
        if (tool.data.toolType === "predefined" && tool.data.label === "waldiez_flow" && tool.data.kwargs) {
            return (tool.data.kwargs.name || tool.data.label) as string;
        }
        return tool.data.label as string;
    }, []);

    const selectedTools = useMemo(
        () =>
            data.tools.map(tool => {
                const toolFound = tools.find(t => t.id === tool.id);
                if (!toolFound) {
                    return null;
                }
                return {
                    label: getToolName(toolFound),
                    value: toolFound,
                };
            }),
        [data.tools, tools, getToolName],
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
                    label: getToolName(tool),
                    value: tool,
                })),
        [tools, getToolName],
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
    const getLinkedToolName = useCallback(
        (linkedTool: WaldiezAgentLinkedTool) => {
            const toolFound = tools.find(tool => tool.id === linkedTool.id);
            if (!toolFound) {
                return "Unknown tool";
            }
            return getToolName(toolFound);
        },
        [tools, getToolName],
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
        getLinkedToolName,
        getAgentName,
        onSelectedToolChange: setSelectedTool,
        onSelectedToolsChange,
        onSelectedExecutorChange: setSelectedExecutor,
        onAddTool,
        onRemoveTool,
    };
};
