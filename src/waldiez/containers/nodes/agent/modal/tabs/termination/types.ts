/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentTerminationProps = {
    id: string;
    data: WaldiezNodeAgentData;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
