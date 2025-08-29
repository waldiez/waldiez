/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeModel, WaldiezNodeModelData } from "@waldiez/models";

export interface IWaldiezModelStore {
    /**
     * Get the stored models.
     * @returns An array of models.
     * @see {@link WaldiezNodeModel}
     */
    getModels: () => WaldiezNodeModel[];
    /**
     * Get a specific model by its ID.
     * @param id - The ID of the model.
     * @returns The model with the specified ID, or null if not found.
     * @see {@link WaldiezNodeModel}
     */
    getModelById: (id: string) => WaldiezNodeModel | null;
    /**
     * Add a new model to the store.
     * @returns The newly added model.
     * @see {@link WaldiezNodeModel}
     */
    addModel: () => WaldiezNodeModel;
    /**
     * Clone an existing model.
     * @param id - The ID of the model to clone.
     * @returns The cloned model, or null if the model was not found.
     * @see {@link WaldiezNodeModel}
     */
    cloneModel: (id: string) => WaldiezNodeModel | null;
    /**
     * Update the data of a specific model.
     * @param id - The ID of the model to update.
     * @param data - The new data for the model.
     * @see {@link WaldiezNodeModelData}
     */
    updateModelData: (id: string, data: Partial<WaldiezNodeModelData>) => void;
    /**
     * Delete a specific model from the store.
     * @param id - The ID of the model to delete.
     */
    deleteModel: (id: string) => void;
    /**
     * Import a model into the store.
     * @param model - The model data to import.
     * @param modelId - The ID of the model.
     * @param position - The position of the model in the flow.
     * @param save - Whether to save the changes.
     * @returns The imported model.
     * @see {@link WaldiezNodeModel}
     */
    importModel: (
        model: { [key: string]: unknown },
        modelId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeModel;
    /**
     * Export a model from the store.
     * @param modelId - The ID of the model to export.
     * @param hideSecrets - Whether to hide secrets in the exported data.
     * @returns The exported model data.
     */
    exportModel: (modelId: string, hideSecrets: boolean) => { [key: string]: unknown };
}
