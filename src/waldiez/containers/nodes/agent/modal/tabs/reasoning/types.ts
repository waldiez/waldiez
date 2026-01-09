/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2026 Waldiez & contributors
 */
import type { WaldiezNodeAgentData, WaldiezNodeAgentReasoningData } from "@waldiez/models";

export type WaldiezAgentReasoningProps = {
    id: string;
    data: WaldiezNodeAgentReasoningData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
