/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData, WaldiezNodeAgentReasoningData } from "@waldiez/types";

export type WaldiezAgentReasoningProps = {
    id: string;
    data: WaldiezNodeAgentReasoningData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
