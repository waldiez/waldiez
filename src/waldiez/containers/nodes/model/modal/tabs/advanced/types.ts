/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeModelData } from "@waldiez/models";

export type WaldiezNodeModelModalAdvancedTabProps = {
    data: WaldiezNodeModelData;
    onDataChange: (data: Partial<WaldiezNodeModelData>) => void;
};
