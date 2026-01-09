/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { EditFlowModalData } from "@waldiez/containers/sidebar/modals/editFlowModal/types";

export type EditFlowModalModalTabOtherProps = {
    flowId: string;
    data: EditFlowModalData;
    onDataChange: (data: Partial<EditFlowModalData>) => void;
};
