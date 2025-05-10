/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, ReactFlowInstance } from "@xyflow/react";

import { IWaldiezToolStore, WaldiezNodeTool, WaldiezNodeToolData, WaldiezTool } from "@waldiez/models";
import { toolMapper } from "@waldiez/models/mappers";
import { getNewNodePosition, reArrangeTools, setViewPortTopLeft } from "@waldiez/store/utils";
import { WaldiezNodeAgent, typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

export class WaldiezToolStore implements IWaldiezToolStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezToolStore(get, set);
    }
    getTools = () => {
        return this.get().nodes.filter(node => node.type === "tool") as WaldiezNodeTool[];
    };
    getToolById = (id: string) => {
        const tool = this.get().nodes.find(node => node.id === id);
        if (!tool || tool.type !== "tool") {
            return null;
        }
        return tool as WaldiezNodeTool;
    };
    addTool = () => {
        const existingTools = this.get().nodes.filter(node => node.type === "tool");
        const flowId = this.get().flowId;
        const rfInstance = this.get().rfInstance;
        const toolCount = existingTools.length;
        const position = getNewNodePosition(toolCount, flowId, rfInstance);
        const newTool = WaldiezTool.create();
        const newNode = toolMapper.asNode(newTool, position);
        this.set({
            nodes: [
                ...this.get().nodes,
                {
                    ...newNode,
                    type: "tool",
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeTools(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const toolWithNewPosition = this.get().nodes.find(node => node.id === newNode.id);
        return toolWithNewPosition as WaldiezNodeTool;
    };
    cloneTool = (id: string) => {
        const tool = this.get().nodes.find(node => node.id === id);
        if (!tool || tool.type !== "tool") {
            return null;
        }
        const rfInstance = this.get().rfInstance;
        const newTool = this.getClonedTool(tool as WaldiezNodeTool, rfInstance);
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, selected: false };
                    }
                    return node;
                }),
                {
                    ...newTool,
                    type: "tool",
                    selected: true,
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeTools(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const toolWithNewPosition = this.get().nodes.find(node => node.id === newTool.id);
        return toolWithNewPosition as WaldiezNodeTool;
    };
    updateToolData = (id: string, data: Partial<WaldiezNodeToolData>) => {
        const tool = this.get().nodes.find(node => node.id === id);
        if (!tool || tool.type !== "tool") {
            return;
        }
        const updatedAt = new Date().toISOString();
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.type === "tool" && node.id === id) {
                        return {
                            ...node,
                            data: { ...tool.data, ...data, updatedAt },
                        };
                    }
                    return node;
                }),
            ],
            updatedAt,
        });
    };
    deleteTool = (id: string) => {
        const rfInstance = this.get().rfInstance;
        const allNodes = this.getAgentsAfterToolDeletion(id, rfInstance);
        this.set({
            nodes: allNodes,
            updatedAt: new Date().toISOString(),
        });
        reArrangeTools(this.get, this.set);
        setViewPortTopLeft(rfInstance);
    };
    importTool = (
        tool: { [key: string]: unknown },
        toolId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => {
        const newTool = toolMapper.importTool(tool);
        const toolNode = toolMapper.asNode(newTool, position);
        toolNode.id = toolId;
        if (position) {
            toolNode.position = position;
        }
        if (save) {
            this.set({
                nodes: this.get().nodes.map(node => (node.id === toolId ? toolNode : node)),
            });
        }
        return toolNode;
    };
    exportTool = (toolId: string, hideSecrets: boolean) => {
        const tool = this.get().nodes.find(node => node.id === toolId);
        if (!tool || tool.type !== "tool") {
            return {};
        }
        return toolMapper.exportTool(tool as WaldiezNodeTool, hideSecrets);
    };
    private getClonedTool: (
        tool: WaldiezNodeTool,
        rfInstance: ReactFlowInstance | undefined,
    ) => WaldiezNodeTool = (tool, rfInstance) => {
        const createdAt = new Date().toISOString();
        const updatedAt = createdAt;
        const toolsCount = this.get().nodes.filter(node => node.type === "tool").length;
        const flowId = this.get().flowId;
        const position = getNewNodePosition(toolsCount, flowId, rfInstance);
        const label = tool.data.label + " (copy)";
        const clonedTool = {
            ...tool,
            id: `wt-${getId()}`,
            data: { ...tool.data, label, createdAt, updatedAt },
            position,
        };
        return clonedTool;
    };
    private getAgentAfterToolDeletion = (toolId: string, agent: WaldiezNodeAgent) => {
        const tools = agent.data.tools;
        const newTools = tools.filter(tool => tool.id !== toolId);
        const codeExecution = agent.data.codeExecutionConfig;
        if (typeof codeExecution === "boolean") {
            return {
                ...agent,
                data: {
                    ...agent.data,
                    tools: newTools,
                },
            };
        }
        const functions = codeExecution.functions ?? [];
        const newFunctions = functions.filter(func => func !== toolId);
        return {
            ...agent,
            data: {
                ...agent.data,
                tools: newTools,
                codeExecutionConfig: {
                    ...codeExecution,
                    functions: newFunctions,
                },
            },
        };
    };
    private getAgentsAfterToolDeletion = (toolId: string, rfInstance: ReactFlowInstance | undefined) => {
        const newToolNodes = this.get().nodes.filter(node => node.type === "tool" && node.id !== toolId);
        const newToolNodesCount = newToolNodes.length;
        const flowId = this.get().flowId;
        for (let i = 0; i < newToolNodesCount; i++) {
            const node = newToolNodes[i];
            const position = getNewNodePosition(i, flowId, rfInstance);
            newToolNodes[i] = { ...node, position };
        }
        const allNodes = newToolNodes.concat(this.get().nodes.filter(node => node.type !== "tool"));
        // check if the tool is linked to any agent
        const newNodes = [] as Node[];
        allNodes.forEach(node => {
            if (node.type === "agent") {
                const agent = this.getAgentAfterToolDeletion(toolId, node as WaldiezNodeAgent);
                newNodes.push(agent);
            } else {
                newNodes.push(node);
            }
        });
        return newNodes;
    };
}
