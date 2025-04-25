/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModel, WaldiezNodeModelData } from "@waldiez/models";

export interface IWaldiezModelStore {
    getModels: () => WaldiezNodeModel[];
    getModelById: (id: string) => WaldiezNodeModel | null;
    addModel: () => WaldiezNodeModel;
    cloneModel: (id: string) => WaldiezNodeModel | null;
    updateModelData: (id: string, data: Partial<WaldiezNodeModelData>) => void;
    deleteModel: (id: string) => void;
    importModel: (
        model: { [key: string]: unknown },
        modelId: string,
        position: { x: number; y: number } | undefined,
        save: boolean,
    ) => WaldiezNodeModel;
    exportModel: (modelId: string, hideSecrets: boolean) => { [key: string]: unknown };
}
