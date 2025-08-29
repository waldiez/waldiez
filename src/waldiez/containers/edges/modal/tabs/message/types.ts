/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezEdgeData } from "@waldiez/models/types";

export type WaldiezEdgeMessageTabProps = {
    edgeId: string;
    data: WaldiezEdgeData;
    darkMode: boolean;
    skipCarryoverOption?: boolean;
    skipRagOption?: boolean;
    skipContextVarsOption?: boolean;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
