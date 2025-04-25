/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezEdgeData } from "@waldiez/models";

export type WaldiezEdgeNestedTabProps = {
    flowId: string;
    edgeId: string;
    darkMode: boolean;
    data: WaldiezEdgeData;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
