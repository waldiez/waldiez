/**
 * SPDX-License-Identifier: Apache-2.0
 * Copyright 2024 - 2025 Waldiez & contributors
 */
import { WaldiezNodeAgentGroupManagerData } from "@waldiez/models";

export type WaldiezNodeGroupManagerTabsProps = {
    id: string;
    flowId: string;
    isModalOpen: boolean;
    isDarkMode: boolean;
    data: WaldiezNodeAgentGroupManagerData;
    onDataChange: (data: Partial<WaldiezNodeAgentGroupManagerData>, markDirty?: boolean) => void;
};
