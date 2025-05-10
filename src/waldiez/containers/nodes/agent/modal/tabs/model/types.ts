/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData, WaldiezNodeModel } from "@waldiez/models";

export type WaldiezAgentModelsProps = {
    id: string;
    data: WaldiezNodeAgentData;
    models: WaldiezNodeModel[];
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
