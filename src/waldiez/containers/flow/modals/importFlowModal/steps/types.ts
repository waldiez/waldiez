/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { ImportFlowState } from "@waldiez/containers/flow/modals/importFlowModal/types";

export type LoadFlowStepProps = {
    flowId: string;
    state: ImportFlowState;
    initialState: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
};

export type FlowDataPreviewProps = {
    flowId: string;
    state: ImportFlowState;
    onStateChange: (newState: Partial<ImportFlowState>) => void;
};
