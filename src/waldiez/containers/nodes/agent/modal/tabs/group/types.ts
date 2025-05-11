/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgent, WaldiezNodeAgentData } from "@waldiez/models";

export type WaldiezAgentGroupProps = {
    id: string;
    data: WaldiezNodeAgentData;
    agents: WaldiezNodeAgent[];
    darkMode: boolean;
    onDataChange: (partialData: Partial<WaldiezNodeAgentData>) => void;
};
