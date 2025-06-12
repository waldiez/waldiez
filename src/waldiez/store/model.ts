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

/**
 * WaldiezModelStore
 * A store for managing Waldiez models.
 * It provides methods to get, add, clone, update, delete, import, and export models.
 * @see {@link IWaldiezModelStore}
 */
export class WaldiezModelStore implements IWaldiezModelStore {
    private get: typeOfGet;
    private set: typeOfSet;
    /**
     * Creates an instance of WaldiezModelStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     */
    constructor(get: typeOfGet, set: typeOfSet) {
        this.get = get;
        this.set = set;
    }
    /**
     * Creates a new instance of WaldiezModelStore.
     * @param get - A function to get the current state of the store.
     * @param set - A function to set the new state of the store.
     * @returns A new instance of WaldiezModelStore.
     */
    static create(get: typeOfGet, set: typeOfSet) {
        return new WaldiezModelStore(get, set);
    }
    /**
     * Gets all models from the store.
     * @returns An array of WaldiezNodeModel objects.
     * @see {@link WaldiezNodeModel}
     * @see {@link IWaldiezModelStore.getModels}
     */
    getModels = () => {
        return this.get().nodes.filter(node => node.type === "model") as WaldiezNodeModel[];
    };
    /**
     * Gets a model by its ID.
     * @param id - The ID of the model to retrieve.
     * @returns The WaldiezNodeModel object if found, otherwise null.
     * @see {@link WaldiezNodeModel}
     * @see {@link IWaldiezModelStore.getModelById}
     */
    getModelById = (id: string) => {
        const model = this.get().nodes.find(node => node.id === id);
        if (!model || model.type !== "model") {
            return null;
        }
        return model as WaldiezNodeModel;
    };
    /**
     * Adds a new model to the store.
     * @returns The newly created WaldiezNodeModel object.
     * @see {@link WaldiezNodeModel}
     * @see {@link IWaldiezModelStore.addModel}
     */
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
    /**
     * Clones an existing model by its ID.
     * @param id - The ID of the model to clone.
     * @returns The cloned WaldiezNodeModel object if successful, otherwise null.
     * @see {@link WaldiezNodeModel}
     * @see {@link IWaldiezModelStore.cloneModel}
     */
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
    /**
     * Updates the data of an existing model by its ID.
     * @param id - The ID of the model to update.
     * @param data - The partial data to update the model with.
     * @see {@link WaldiezNodeModelData}
     * @see {@link IWaldiezModelStore.updateModelData}
     */
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
    /**
     * Deletes a model by its ID.
     * @param id - The ID of the model to delete.
     * @see {@link IWaldiezModelStore.deleteModel}
     */
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
    /**
     * Imports a model from a given model object.
     * @param model - The model object to import.
     * @param modelId - The ID to assign to the imported model.
     * @param position - The position to place the imported model in the flow.
     * @param save - Whether to save the imported model immediately (default: true).
     * @returns The imported WaldiezNodeModel object.
     * @see {@link WaldiezNodeModel}
     * @see {@link IWaldiezModelStore.importModel}
     */
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
    /**
     * Exports a model by its ID.
     * @param modelId - The ID of the model to export.
     * @param hideSecrets - Whether to hide secrets in the exported model (default: true).
     * @returns The exported model object.
     * @see {@link IWaldiezModelStore.exportModel}
     */
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
    /**
     * Gets the nodes after a model deletion.
     * This method rearranges the nodes and updates the positions of the remaining model nodes.
     * It also checks if the deleted model was linked to any agents and updates them accordingly.
     * @param modelId - The ID of the model that was deleted.
     * @param rfInstance - The React Flow instance to get the new positions for the nodes.
     * @returns An array of updated nodes after the model deletion.
     */
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
                if (agent.data.modelIds.includes(modelId)) {
                    // if the model is linked to the agent, remove the link
                    newNodes.push({
                        ...agent,
                        data: { ...agent.data, modelIds: agent.data.modelIds.filter(id => id !== modelId) },
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
