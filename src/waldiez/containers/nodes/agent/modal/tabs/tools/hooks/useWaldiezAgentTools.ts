/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { useEffect, useState } from "react";

import { WaldiezAgentToolsProps } from "@waldiez/containers/nodes/agent/modal/tabs/tools/types";
import { WaldiezAgentLinkedTool, WaldiezNodeAgent, WaldiezNodeTool } from "@waldiez/models";
import { useWaldiez } from "@waldiez/store";

export const useWaldiezAgentTools = (props: WaldiezAgentToolsProps) => {
    const { id, data, tools, agents, onDataChange } = props;
    const updateAgentData = useWaldiez(state => state.updateAgentData);
    const [selectedTool, setSelectedTool] = useState<{
        label: string;
        value: WaldiezNodeTool;
    } | null>(null);
    const [selectedExecutor, setSelectedExecutor] = useState<{
        label: string;
        value: WaldiezNodeAgent;
    } | null>(null);
    const currentTools = data.tools;
    useEffect(() => {
        // if a tool was removed, but previously linked to the agent, remove it
        const currentToolIds = tools.map(tool => tool.id);
        const newTools = currentTools.filter(tool => currentToolIds.includes(tool.id));
        if (newTools.length !== currentTools.length) {
            // onDataChange({ tools: newTools });
            updateAgentData(id, { tools: newTools });
        }
    }, [data.tools]);
    const toolOptions: { label: string; value: WaldiezNodeTool }[] = tools.map(tool => {
        return {
            label: (tool.data.label as string) ?? "Unknown tool",
            value: tool,
        };
    });
    const agentOptions: { label: string; value: WaldiezNodeAgent }[] = agents.map(agent => {
        return {
            label: (agent.data.label as string) ?? "Unknown Agent",
            value: agent,
        };
    });
    const getToolName = (linkedTool: WaldiezAgentLinkedTool) => {
        const toolFound = tools.find(tool => tool.id === linkedTool.id);
        if (!toolFound) {
            return "Unknown tool";
        }
        return toolFound.data.label as string;
    };
    const getAgentName = (linkedTool: WaldiezAgentLinkedTool) => {
        const agentFound = agents.find(agent => agent.id === linkedTool.executorId);
        if (!agentFound) {
            return "Unknown Agent";
        }
        return agentFound.data.label as string;
    };
    const onAddTool = () => {
        if (!selectedTool || !selectedExecutor) {
            return;
        }
        const linkedTool = selectedTool.value;
        const linkedToolExecutor = selectedExecutor.value;
        const toolAlready = currentTools.find(
            entry => entry.executorId === linkedToolExecutor.id && entry.id === linkedTool.id,
        );
        const newTool = {
            id: linkedTool.id,
            executorId: linkedToolExecutor.id,
        };
        if (!toolAlready) {
            const newTools = [...currentTools, newTool];
            onDataChange({ tools: newTools });
            setSelectedTool(null);
            setSelectedExecutor(null);
        }
    };
    const onRemoveTool = (index: number) => {
        const newTools = currentTools.filter((_, i) => i !== index);
        onDataChange({ tools: newTools });
    };
    return {
        toolOptions,
        agentOptions,
        selectedTool,
        selectedExecutor,
        getToolName,
        getAgentName,
        onSelectedToolChange: setSelectedTool,
        onSelectedExecutorChange: setSelectedExecutor,
        onAddTool,
        onRemoveTool,
    };
};
