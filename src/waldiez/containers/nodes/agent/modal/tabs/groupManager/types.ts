/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import type { WaldiezNodeAgentGroupManagerData } from "@waldiez/models/types";

export type WaldiezNodeGroupManagerTabsProps = {
    id: string;
    flowId: string;
    isModalOpen: boolean;
    isDarkMode: boolean;
    data: WaldiezNodeAgentGroupManagerData;
    onDataChange: (data: Partial<WaldiezNodeAgentGroupManagerData>, markDirty?: boolean) => void;
};
