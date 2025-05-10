/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { Node, ReactFlowInstance } from "@xyflow/react";

import {
    IWaldiezModelStore,
    WaldiezModel,
    WaldiezNodeAgent,
    WaldiezNodeModel,
    WaldiezNodeModelData,
} from "@waldiez/models";
import { modelMapper } from "@waldiez/models/mappers";
import { getNewNodePosition, reArrangeModels, setViewPortTopLeft } from "@waldiez/store/utils";
import { typeOfGet, typeOfSet } from "@waldiez/types";

export class WaldiezModelStore implements IWaldiezModelStore {
    private get: typeOfGet;
    private set: typeOfSet;
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezModelStore(get, set);
    }
    getModels = () => {
        return this.get().nodes.filter(node => node.type === "model") as WaldiezNodeModel[];
    };
    getModelById = (id: string) => {
        const model = this.get().nodes.find(node => node.id === id);
        if (!model || model.type !== "model") {
            return null;
        }
        return model as WaldiezNodeModel;
    };
    addModel = () => {
        const existingModels = this.get().nodes.filter(node => node.type === "model");
        const modelCount = existingModels.length;
        const flowId = this.get().flowId;
        const rfInstance = this.get().rfInstance;
        const position = getNewNodePosition(modelCount, flowId, rfInstance);
        const newModel = WaldiezModel.create();
        const newNode = modelMapper.asNode(newModel, position);
        this.set({
            nodes: [
                ...this.get().nodes,
                {
                    ...newNode,
                    type: "model",
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeModels(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const model = this.get().nodes.find(node => node.id === newNode.id);
        return model as WaldiezNodeModel;
    };
    cloneModel = (id: string) => {
        const model = this.get().nodes.find(node => node.id === id);
        if (!model || model.type !== "model") {
            return null;
        }
        const rfInstance = this.get().rfInstance;
        reArrangeModels(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const newLabel = model.data.label + " (copy)";
        const newModel = this.getClonedModel(id, rfInstance);
        newModel.data.label = newLabel;
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.id === id) {
                        return { ...node, selected: false };
                    }
                    return node;
                }),
                {
                    ...newModel,
                    type: "model",
                    selected: true,
                },
            ],
            updatedAt: new Date().toISOString(),
        });
        reArrangeModels(this.get, this.set);
        setViewPortTopLeft(rfInstance);
        const modelWithNewPosition = this.get().nodes.find(node => node.id === newModel.id);
        return modelWithNewPosition as WaldiezNodeModel;
    };
    updateModelData = (id: string, data: Partial<WaldiezNodeModelData>) => {
        const model = this.get().nodes.find(node => node.id === id);
        if (!model || model.type !== "model") {
            return;
        }
        const updatedAt = new Date().toISOString();
        this.set({
            nodes: [
                ...this.get().nodes.map(node => {
                    if (node.id === id) {
                        return {
                            ...node,
                            data: { ...node.data, ...data, updatedAt },
                        };
                    }
                    return node;
                }),
            ],
            updatedAt,
        });
    };
    deleteModel = (id: string) => {
        const rfInstance = this.get().rfInstance;
        const newNodes = this.getNodesAfterModelDeletion(id, rfInstance);
        this.set({
            nodes: newNodes,
            updatedAt: new Date().toISOString(),
        });
        reArrangeModels(this.get, this.set);
        setViewPortTopLeft(rfInstance);
    };
    importModel = (
        model: { [key: string]: unknown },
        modelId: string,
        position: { x: number; y: number } | undefined,
        save: boolean = true,
    ) => {
        const newModel = modelMapper.importModel(model);
        const modelNode = modelMapper.asNode(newModel, position);
        modelNode.id = modelId;
        if (position) {
            modelNode.position = position;
        }
        if (save) {
            this.set({
                nodes: this.get().nodes.map(node => (node.id === modelId ? modelNode : node)),
            });
        }
        return modelNode;
    };
    exportModel = (modelId: string, hideSecrets: boolean) => {
        const model = this.get().nodes.find(node => node.id === modelId);
        if (!model || model.type !== "model") {
            throw new Error(`Model with id ${modelId} not found`);
        }
        return modelMapper.exportModel(model as WaldiezNodeModel, hideSecrets);
    };
    private getClonedModel = (modelId: string, rfInstance: ReactFlowInstance | undefined) => {
        const model = this.get().nodes.find(node => node.id === modelId);
        if (!model) {
            throw new Error(`Model with id ${modelId} not found`);
        }
        const existingModels = this.get().nodes.filter(node => node.type === "model");
        const modelCount = existingModels.length;
        const flowId = this.get().flowId;
        const position = getNewNodePosition(modelCount, flowId, rfInstance);
        const newModel = WaldiezModel.create();
        return modelMapper.asNode(newModel, position);
    };
    private getNodesAfterModelDeletion = (modelId: string, rfInstance: ReactFlowInstance | undefined) => {
        const newModelNodes = this.get().nodes.filter(node => node.type === "model" && node.id !== modelId);
        const newModelNodesCount = newModelNodes.length;
        const flowId = this.get().flowId;
        for (let i = 0; i < newModelNodesCount; i++) {
            const node = newModelNodes[i];
            const position = getNewNodePosition(i, flowId, rfInstance);
            newModelNodes[i] = { ...node, position };
        }
        const allNodes = newModelNodes.concat(this.get().nodes.filter(node => node.type !== "model"));
        // check if the model is linked to any agent
        const newNodes = [] as Node[];
        allNodes.forEach(node => {
            if (node.type === "agent") {
                const agent = node as WaldiezNodeAgent;
                if (agent.data.modelId === modelId) {
                    // if the model is linked to the agent, remove the link
                    newNodes.push({
                        ...agent,
                        data: { ...agent.data, modelId: null },
                    });
                } else {
                    // if the model is not linked to the agent, keep the agent
                    newNodes.push(agent);
                }
            } else {
                newNodes.push(node);
            }
        });
        return newNodes;
    };
}
