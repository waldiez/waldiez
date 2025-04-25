/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdgeData } from "@waldiez/models";

export type WaldiezEdgeMessageTabProps = {
    edgeId: string;
    data: WaldiezEdgeData;
    darkMode: boolean;
    skipCarryoverOption?: boolean;
    skipRagOption: boolean;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
