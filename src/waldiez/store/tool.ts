/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { Node, ReactFlowInstance } from "@xyflow/react";

import { WaldiezTool } from "@waldiez/models";
import { toolMapper } from "@waldiez/models/mappers";
import type { IWaldiezToolStore, WaldiezNodeTool, WaldiezNodeToolData } from "@waldiez/models/types";
import { getNewNodePosition, reArrangeTools, setViewPortTopLeft } from "@waldiez/store/utils";
import type { WaldiezNodeAgent, typeOfGet, typeOfSet } from "@waldiez/types";
import { getId } from "@waldiez/utils";

/**
 * WaldiezToolStore is a store for managing tools in the Waldiez application.
 * It provides methods to get, add, clone, update, delete, import, and export tools.
 * @see {@link IWaldiezToolStore}
 */
export class WaldiezToolStore implements IWaldiezToolStore {
    private readonly get: typeOfGet;
    private readonly set: typeOfSet;
    /**
     * Creates an instance of WaldiezToolStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    /**
     * Creates a new instance of WaldiezToolStore.
     * @param get - A function to get the current state.
     * @param set - A function to set the new state.
     * @returns A new instance of WaldiezToolStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezToolStore(get, set);
    }
    /**
     * Returns the type of the store.
     * @returns The type of the store, which is "tool".
     * @see {@link IWaldiezToolStore.getTools}
     */
    getTools = () => {
        return this.get().nodes.filter(node => node.type === "tool") as WaldiezNodeTool[];
    };
    /**
     * Returns a tool by its ID.
     * @param id - The ID of the tool to retrieve.
     * @returns The tool with the specified ID, or null if not found or not a tool.
     * @see {@link IWaldiezToolStore.getToolById}
     */
    getToolById = (id: string) => {
        const tool = this.get().nodes.find(node => node.id === id);
        if (!tool || tool.type !== "tool") {
            return null;
        }
        return tool as WaldiezNodeTool;
    };
    /**
     * Adds a new tool to the store.
     * @returns The newly added tool with its position.
     * @see {@link IWaldiezToolStore.addTool}
     */
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
    /**
     * Clones an existing tool by its ID.
     * @param id - The ID of the tool to clone.
     * @returns The cloned tool with its new position, or null if the tool is not found or not a tool.
     * @see {@link IWaldiezToolStore.cloneTool}
     */
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
    /**
     * Updates the data of an existing tool by its ID.
     * @param id - The ID of the tool to update.
     * @param data - The new data to update the tool with.
     * @see {@link IWaldiezToolStore.updateToolData}
     */
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
    /**
     * Deletes a tool by its ID.
     * @param id - The ID of the tool to delete.
     * @see {@link IWaldiezToolStore.deleteTool}
     */
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
    /**
     * Imports a tool from an external source.
     * @param tool - The tool data to import.
     * @param toolId - The ID to assign to the imported tool.
     * @param position - The position to place the imported tool, if any.
     * @param save - Whether to save the imported tool immediately.
     * @returns The imported tool as a node.
     * @see {@link IWaldiezToolStore.importTool}
     */
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
    /**
     * Exports a tool by its ID.
     * @param toolId - The ID of the tool to export.
     * @param hideSecrets - Whether to hide secrets in the exported tool data.
     * @returns The exported tool data.
     * @see {@link IWaldiezToolStore.exportTool}
     */
    exportTool = (toolId: string, hideSecrets: boolean) => {
        const tool = this.get().nodes.find(node => node.id === toolId);
        if (!tool || tool.type !== "tool") {
            return {};
        }
        return toolMapper.exportTool(tool as WaldiezNodeTool, hideSecrets);
    };
    /**
     * Gets a cloned version of a tool with a new ID and position.
     * @param tool - The tool to clone.
     * @param rfInstance - The React Flow instance to use for positioning.
     * @returns A cloned tool with a new ID, position, and updated timestamps.
     */
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
        return {
            ...tool,
            id: `wt-${getId()}`,
            data: { ...tool.data, label, createdAt, updatedAt },
            position,
        };
    };
    /**
     * Gets the agent after a tool has been deleted.
     * @param toolId - The ID of the tool that was deleted.
     * @param agent - The agent to update.
     * @returns The updated agent with the tool removed.
     */
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
    /**
     * Gets all agents after a tool has been deleted.
     * @param toolId - The ID of the tool that was deleted.
     * @param rfInstance - The React Flow instance to use for positioning.
     * @returns An array of updated nodes with agents reflecting the tool deletion.
     */
    private getAgentsAfterToolDeletion = (toolId: string, rfInstance: ReactFlowInstance | undefined) => {
        const newToolNodes = this.get().nodes.filter(node => node.type === "tool" && node.id !== toolId);
        const newToolNodesCount = newToolNodes.length;
        const flowId = this.get().flowId;
        for (let i = 0; i < newToolNodesCount; i++) {
            const node = newToolNodes[i];
            const position = getNewNodePosition(i, flowId, rfInstance);
            newToolNodes[i] = { ...node, id: node?.id || `wa-${getId()}`, data: node?.data || {}, position };
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
