/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { SingleValue } from "@waldiez/components";
import { WaldiezEdgeData, WaldiezEdgeType } from "@waldiez/models";

export type WaldiezEdgeBasicTabProps = {
    edgeId: string;
    edgeType: WaldiezEdgeType;
    data: WaldiezEdgeData;
    onTypeChange: (
        option: SingleValue<{
            label: string;
            value: WaldiezEdgeType;
        }>,
    ) => void;
    onDataChange: (data: Partial<WaldiezEdgeData>) => void;
};
